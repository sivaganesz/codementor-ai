import os
import re
import uuid
import asyncio
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import sys


# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="CodeMentor Video Worker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated videos as static files
app.mount("/results", StaticFiles(directory="results"), name="results")
app.mount("/avatars", StaticFiles(directory="avatars"), name="avatars")

# ─── Directories ──────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).parent
AVATARS_DIR   = BASE_DIR / "avatars"
RESULTS_DIR   = BASE_DIR / "results"
AUDIO_DIR     = BASE_DIR / "audio"
SADTALKER_DIR = BASE_DIR / "SadTalker"

for d in [AVATARS_DIR, RESULTS_DIR, AUDIO_DIR]:
    d.mkdir(exist_ok=True)

# ─── In-memory job store ──────────────────────────────────────────────────────
jobs: dict[str, dict] = {}

# ─── Available preset avatars ─────────────────────────────────────────────────
AVATARS = [
    {"id": "avatar_1", "name": "Alex",   "gender": "male",   "file": "avatar_1.jpg"},
    {"id": "avatar_2", "name": "Sarah",  "gender": "female", "file": "avatar_2.jpg"},
    {"id": "avatar_3", "name": "Marcus", "gender": "male",   "file": "avatar_3.jpg"},
    {"id": "avatar_4", "name": "Priya",  "gender": "female", "file": "avatar_4.jpg"},
    {"id": "avatar_5", "name": "James",  "gender": "male",   "file": "avatar_5.jpg"},
    {"id": "avatar_6", "name": "Zoe",    "gender": "female", "file": "avatar_6.jpg"},
]

VOICES = {
    "male":   "en-US-ChristopherNeural",
    "female": "en-US-JennyNeural",
}

# ─── Models ───────────────────────────────────────────────────────────────────
class GenerateVideoRequest(BaseModel):
    job_id:    str
    module_id: str
    script:    str
    avatar_id: str = "avatar_1"

# ─── FIX 1: Strip markdown so TTS doesn't read symbols aloud ─────────────────
def clean_script_for_tts(text: str) -> str:
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **bold** → bold
    text = re.sub(r'\*(.+?)\*',     r'\1', text)  # *italic* → italic
    text = re.sub(r'`(.+?)`',       r'\1', text)  # `code` → code
    text = re.sub(r'\[(\d+:\d+)\]', '',    text)  # [0:00] timestamps → remove
    text = re.sub(r'#+\s',          '',    text)  # ## headers → remove ##
    text = re.sub(r'\n{3,}',        '\n\n', text) # triple newlines → double
    return text.strip()

# ─── FIX 2: Edge-TTS with retry + pyttsx3 offline fallback ───────────────────
async def tts_with_retry(text: str, voice: str, output_path: str, retries: int = 3):
    """Try Edge-TTS up to 3 times with backoff before raising."""
    last_error = None
    for attempt in range(retries):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            return  # success
        except Exception as e:
            last_error = e
            if attempt < retries - 1:
                wait = 5 * (attempt + 1)  # 5s, 10s, 15s
                await asyncio.sleep(wait)
    raise last_error

def tts_offline_fallback(text: str, output_path: str):
    """Fully offline TTS using pyttsx3 — no internet required."""
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', 165)    # natural speaking pace
        engine.setProperty('volume', 1.0)
        engine.save_to_file(text, output_path)
        engine.runAndWait()
    except Exception as e:
        raise RuntimeError(f"pyttsx3 offline fallback also failed: {e}")

async def generate_audio(script: str, voice: str, audio_path: str):
    """Try Edge-TTS first — fall back to pyttsx3 if blocked (403)."""
    clean = clean_script_for_tts(script)
    try:
        await tts_with_retry(clean, voice, audio_path)
    except Exception as edge_error:
        print(f"[TTS] Edge-TTS failed ({edge_error}), trying offline fallback...")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, tts_offline_fallback, clean, audio_path)
        print("[TTS] Offline fallback succeeded.")

# ─── Helper: run SadTalker ────────────────────────────────────────────────────
def run_sadtalker(audio_path: str, avatar_path: str, output_dir: str) -> str:
    cmd = [
        sys.executable,   # ← this is the venv Python, not system Python
        str(SADTALKER_DIR / "inference.py"),
        "--driven_audio", audio_path,
        "--source_image",  avatar_path,
        "--result_dir",    output_dir,
        "--still",
        "--preprocess", "full",
        "--cpu",
    ]
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(SADTALKER_DIR),
    )
    if result.returncode != 0:
        raise RuntimeError(f"SadTalker failed:\n{result.stderr}")

    mp4_files = sorted(Path(output_dir).glob("*.mp4"), key=os.path.getmtime)
    if not mp4_files:
        raise RuntimeError("SadTalker completed but no .mp4 found")
    return str(mp4_files[-1])

# ─── Background task: full pipeline ──────────────────────────────────────────
async def generate_video_pipeline(
    job_id:    str,
    module_id: str,
    script:    str,
    avatar_id: str,
):
    try:
        jobs[job_id] = {"status": "processing", "step": "Generating voice...", "progress": 10}

        # 1. Find avatar
        avatar      = next((a for a in AVATARS if a["id"] == avatar_id), AVATARS[0])
        avatar_path = str(AVATARS_DIR / avatar["file"])

        if not Path(avatar_path).exists():
            raise FileNotFoundError(
                f"Avatar image not found: {avatar_path}\n"
                f"Please add {avatar['file']} to the avatars/ folder."
            )

        # 2. Generate voice (Edge-TTS with fallback)
        voice      = VOICES[avatar["gender"]]
        audio_path = str(AUDIO_DIR / f"{job_id}.mp3")

        await generate_audio(script, voice, audio_path)

        jobs[job_id]["step"]     = "Animating avatar..."
        jobs[job_id]["progress"] = 40

        # 3. Run SadTalker
        output_dir = str(RESULTS_DIR / job_id)
        Path(output_dir).mkdir(exist_ok=True)

        loop = asyncio.get_event_loop()
        video_path = await loop.run_in_executor(
            None,
            run_sadtalker,
            audio_path,
            avatar_path,
            output_dir,
        )

        jobs[job_id]["step"]     = "Finalizing..."
        jobs[job_id]["progress"] = 90

        # 4. Build public URL
        relative  = Path(video_path).relative_to(RESULTS_DIR)
        video_url = f"/results/{str(relative).replace(os.sep, '/')}"

        jobs[job_id] = {
            "status":    "completed",
            "step":      "Done",
            "progress":  100,
            "video_url": video_url,
            "module_id": module_id,
        }

    except Exception as e:
        jobs[job_id] = {
            "status":   "failed",
            "step":     "Failed",
            "progress": 0,
            "error":    str(e),
        }

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "sadtalker_ready": SADTALKER_DIR.exists()}

@app.get("/avatars")
def list_avatars():
    return [
        {**a, "preview_url": f"/avatars/{a['file']}"}
        for a in AVATARS
    ]

@app.post("/generate-video")
async def generate_video(
    req: GenerateVideoRequest,
    background_tasks: BackgroundTasks,
):
    jobs[req.job_id] = {
        "status":   "queued",
        "step":     "Queued...",
        "progress": 0,
    }
    background_tasks.add_task(
        generate_video_pipeline,
        req.job_id,
        req.module_id,
        req.script,
        req.avatar_id,
    )
    return {"job_id": req.job_id, "status": "queued"}

@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.delete("/job/{job_id}")
def cleanup_job(job_id: str):
    jobs.pop(job_id, None)
    return {"deleted": job_id}