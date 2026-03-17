import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Video } from './entities/video.entity';
import { CourseModule } from '../courses/entities/module.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class VideosService {
  private readonly workerUrl: string;

  constructor(
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(CourseModule) private moduleRepo: Repository<CourseModule>,
    private aiService: AiService,
    private httpService: HttpService,
    private config: ConfigService,
  ) {
    this.workerUrl =
      this.config.get<string>('VIDEO_WORKER_URL') || 'http://localhost:8000';
  }

  // ─── List available avatars from the Python worker ─────────────────────────
  async getAvatars() {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.workerUrl}/avatars`),
      );
      return res.data;
    } catch {
      // Return defaults if worker is offline
      return [
        { id: 'avatar_1', name: 'Alex',   gender: 'male',   preview_url: null },
        { id: 'avatar_2', name: 'Sarah',  gender: 'female', preview_url: null },
        { id: 'avatar_3', name: 'Marcus', gender: 'male',   preview_url: null },
        { id: 'avatar_4', name: 'Priya',  gender: 'female', preview_url: null },
        { id: 'avatar_5', name: 'James',  gender: 'male',   preview_url: null },
        { id: 'avatar_6', name: 'Zoe',    gender: 'female', preview_url: null },
      ];
    }
  }

  // ─── Start video generation for a module ───────────────────────────────────
  async generateForModule(
    moduleId: string,
    avatarId: string = 'avatar_1',
  ): Promise<Video> {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['lessons'],
    });
    if (!mod) throw new NotFoundException('Module not found');

    // Check if already generating or completed
    const existing = await this.videoRepo.findOne({ where: { moduleId } });
    if (existing?.status === 'processing' || existing?.status === 'queued') {
      return existing; // Don't double-queue
    }

    // Step 1: Generate script with Gemini
    await this.moduleRepo.update(moduleId, { videoStatus: 'generating' });

    let script: string;
    try {
      script = await this.aiService.generateVideoScript(mod);
    } catch (err) {
      await this.moduleRepo.update(moduleId, { videoStatus: 'pending' });
      throw new InternalServerErrorException(
        `Script generation failed: ${(err as Error).message}`,
      );
    }

    // Step 2: Create/update video record in DB
    const workerJobId = uuidv4();
    let video: Video;

    if (existing) {
      await this.videoRepo.update(existing.id, {
        script,
        avatarId,
        workerJobId,
        status: 'queued',
        currentStep: 'Queued for video generation...',
        progress: 5,
        errorMessage: null,
        videoUrl: null,
      });
      video = await this.videoRepo.findOne({ where: { id: existing.id } });
    } else {
      video = await this.videoRepo.save(
        this.videoRepo.create({
          moduleId,
          courseId: mod.courseId,
          script,
          avatarId,
          workerJobId,
          status: 'queued',
          currentStep: 'Queued for video generation...',
          progress: 5,
        }),
      );
    }

    // Step 3: Send to Python worker (fire and forget — we poll separately)
    this.sendToWorker(video, mod).catch((err) => {
      console.error(`Worker call failed for module ${moduleId}:`, err.message);
    });

    return video;
  }

  // ─── Send job to Python FastAPI worker ─────────────────────────────────────
  private async sendToWorker(video: Video, mod: CourseModule) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.workerUrl}/generate-video`, {
          job_id:    video.workerJobId,
          module_id: video.moduleId,
          script:    video.script,
          avatar_id: video.avatarId,
        }),
      );

      // Start polling the worker for progress
      this.pollWorkerJob(video.id, video.workerJobId, video.moduleId);
    } catch (err) {
      await this.videoRepo.update(video.id, {
        status: 'failed',
        currentStep: 'Failed to reach video worker',
        errorMessage: 'Python video worker is not running. Start it with: uvicorn main:app',
      });
      await this.moduleRepo.update(video.moduleId, { videoStatus: 'pending' });
    }
  }

  // ─── Poll worker every 10s until done ──────────────────────────────────────
  private pollWorkerJob(
    videoId: string,
    workerJobId: string,
    moduleId: string,
    attempts = 0,
  ) {
    const MAX_ATTEMPTS = 120; // 120 × 10s = 20 minutes max
    const INTERVAL_MS  = 10000;

    const poll = async () => {
      try {
        const res = await firstValueFrom(
          this.httpService.get(`${this.workerUrl}/job/${workerJobId}`),
        );
        const job = res.data;

        await this.videoRepo.update(videoId, {
          status:      this.mapWorkerStatus(job.status),
          currentStep: job.step,
          progress:    job.progress,
        });

        if (job.status === 'completed') {
          // Build the full video URL pointing to the Python worker
          const fullVideoUrl = `${this.workerUrl}${job.video_url}`;
          await this.videoRepo.update(videoId, {
            videoUrl:    fullVideoUrl,
            status:      'completed',
            currentStep: 'Video ready!',
            progress:    100,
          });
          await this.moduleRepo.update(moduleId, {
            videoStatus: 'completed',
            videoUrl:    fullVideoUrl,
          });
          return; // Stop polling
        }

        if (job.status === 'failed') {
          await this.videoRepo.update(videoId, {
            status:       'failed',
            currentStep:  'Video generation failed',
            errorMessage: job.error || 'Unknown error',
          });
          await this.moduleRepo.update(moduleId, { videoStatus: 'pending' });
          return; // Stop polling
        }

        // Still processing — schedule next poll
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(() => this.pollWorkerJob(videoId, workerJobId, moduleId, attempts + 1), INTERVAL_MS);
        }
      } catch {
        // Worker unreachable — retry up to max
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(() => this.pollWorkerJob(videoId, workerJobId, moduleId, attempts + 1), INTERVAL_MS);
        }
      }
    };

    setTimeout(poll, INTERVAL_MS);
  }

  // ─── Get video status for a module ─────────────────────────────────────────
  async getModuleVideo(moduleId: string) {
    const video = await this.videoRepo.findOne({ where: { moduleId } });
    if (!video) {
      return {
        moduleId,
        status: 'none',
        progress: 0,
        currentStep: null,
        videoUrl: null,
      };
    }
    return video;
  }

  // ─── Map Python worker status to our Video status ──────────────────────────
  private mapWorkerStatus(workerStatus: string): Video['status'] {
    const map: Record<string, Video['status']> = {
      queued:     'queued',
      processing: 'processing',
      completed:  'completed',
      failed:     'failed',
    };
    return map[workerStatus] ?? 'processing';
  }
}
