import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayCircle,
  X,
  Loader2,
  Video,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles,
  Volume2,
} from 'lucide-react'
import { videoApi } from '../../lib/api/videos'
import toast from 'react-hot-toast'

interface ModuleVideoPanelProps {
  moduleId: string
  moduleTitle: string
  onClose: () => void
}

// ─── Step 1: Avatar Picker ────────────────────────────────────────────────────
function AvatarPicker({
  onSelect,
  isLoading,
}: {
  onSelect: (avatarId: string) => void
  isLoading: boolean
}) {
  const [selected, setSelected] = useState('avatar_1')

  const { data: avatars, isLoading: avatarsLoading } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => videoApi.getAvatars().then(r => r.data),
  })

  const genderColors: Record<string, string> = {
    male:   'border-brand-primary/40 bg-brand-primary/10',
    female: 'border-brand-secondary/40 bg-brand-secondary/10',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-2">Choose your presenter</h3>
        <p className="text-text-muted text-sm">
          This avatar will narrate your module content with a natural AI voice.
        </p>
      </div>

      {avatarsLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-3 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {(avatars ?? []).map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.id)}
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                selected === avatar.id
                  ? genderColors[avatar.gender] + ' shadow-lg scale-[1.02]'
                  : 'border-white/5 bg-surface-3 hover:border-white/20'
              }`}
            >
              {/* Avatar preview image or fallback icon */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden ${
                selected === avatar.id
                  ? avatar.gender === 'male' ? 'bg-brand-primary/20' : 'bg-brand-secondary/20'
                  : 'bg-surface-1'
              }`}>
                {avatar.preview_url ? (
                  <img
                    src={`http://localhost:8000${avatar.preview_url}`}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <User className={`w-7 h-7 ${
                    avatar.gender === 'male' ? 'text-brand-primary' : 'text-brand-secondary'
                  }`} />
                )}
              </div>

              <span className="text-sm font-bold">{avatar.name}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                {avatar.gender === 'male' ? 'Christopher' : 'Jenny'}
              </span>

              {selected === avatar.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-secondary flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="bg-surface-3 border border-white/5 rounded-2xl p-4 text-sm text-text-muted flex gap-3">
        <Sparkles className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
        <div>
          <span className="text-text-primary font-semibold">Processing time: 3–8 minutes</span>
          <br />
          Gemini generates the script, Edge-TTS adds voice, SadTalker animates the avatar.
          You'll be notified when it's ready.
        </div>
      </div>

      <button
        onClick={() => onSelect(selected)}
        disabled={isLoading}
        className="w-full py-4 bg-brand-primary text-white rounded-2xl font-display font-bold text-lg hover:shadow-[0_0_25px_rgba(108,59,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting Generation...</>
          : <><Video className="w-5 h-5" /> Generate Video</>
        }
      </button>
    </div>
  )
}

// ─── Step 2: Progress tracker ─────────────────────────────────────────────────
function GenerationProgress({ moduleId, onDone }: { moduleId: string; onDone: () => void }) {
  const { data: videoStatus } = useQuery({
    queryKey: ['video-status', moduleId],
    queryFn: () => videoApi.getModuleVideo(moduleId).then(r => r.data),
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'completed' || s === 'failed' ? false : 8000
    },
  })

  const steps = [
    { label: 'Generating script',   threshold: 5  },
    { label: 'Synthesizing voice',  threshold: 30 },
    { label: 'Animating avatar',    threshold: 50 },
    { label: 'Rendering video',     threshold: 80 },
    { label: 'Finalizing',          threshold: 95 },
  ]

  const progress = videoStatus?.progress ?? 0

  if (videoStatus?.status === 'completed') {
    onDone()
    return null
  }

  if (videoStatus?.status === 'failed') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="font-display font-bold text-lg mb-2">Generation Failed</h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">
          {videoStatus.errorMessage || 'Make sure the Python video worker is running on port 8000.'}
        </p>
        <code className="block mt-4 text-xs bg-surface-3 rounded-xl px-4 py-3 text-brand-secondary">
          python -m uvicorn main:app --port 8000
        </code>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Animated orb */}
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-brand-primary/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-[0_0_40px_rgba(108,59,255,0.5)]">
            <Video className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-display font-bold text-xl mb-1">Creating your video...</h3>
        <p className="text-text-muted text-sm">{videoStatus?.currentStep ?? 'Preparing...'}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-3 bg-surface-3 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs font-bold text-text-muted">
          <span>{videoStatus?.currentStep ?? 'Processing...'}</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const done    = progress > step.threshold
          const active  = progress <= step.threshold && (i === 0 || progress > steps[i - 1].threshold)
          return (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${
              done ? 'text-brand-secondary' : active ? 'text-text-primary' : 'text-text-muted opacity-40'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                done
                  ? 'bg-brand-secondary border-brand-secondary'
                  : active
                  ? 'border-brand-primary animate-pulse'
                  : 'border-white/10'
              }`}>
                {done
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  : active
                  ? <Loader2 className="w-3 h-3 text-brand-primary animate-spin" />
                  : null
                }
              </div>
              {step.label}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-text-muted">
        ⏱ This takes 3–8 minutes on CPU. You can close this and come back later.
      </p>
    </div>
  )
}

// ─── Step 3: Video Player ─────────────────────────────────────────────────────
function VideoPlayer({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const { data: videoStatus } = useQuery({
    queryKey: ['video-status', moduleId],
    queryFn: () => videoApi.getModuleVideo(moduleId).then(r => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-5 h-5 text-brand-secondary" />
        <span className="text-brand-secondary font-bold text-sm uppercase tracking-wider">Video Ready</span>
      </div>
      <h3 className="font-display font-bold text-xl">{moduleTitle}</h3>

      {videoStatus?.videoUrl ? (
        <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          <video
            src={videoStatus.videoUrl}
            controls
            autoPlay
            className="w-full max-h-[400px]"
            poster=""
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div className="h-48 bg-surface-3 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        </div>
      )}

      <p className="text-text-muted text-xs text-center">
        Video is served from your local Python worker at localhost:8000
      </p>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function ModuleVideoPanel({ moduleId, moduleTitle, onClose }: ModuleVideoPanelProps) {
  const queryClient = useQueryClient()

  const { data: existingVideo } = useQuery({
    queryKey: ['video-status', moduleId],
    queryFn: () => videoApi.getModuleVideo(moduleId).then(r => r.data),
  })

  const generateMutation = useMutation({
    mutationFn: (avatarId: string) => videoApi.generate(moduleId, avatarId).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-status', moduleId] })
      toast.success('Video generation started! Check back in a few minutes.')
    },
    onError: () => toast.error('Failed to start video generation. Is the Python worker running?'),
  })

  // Determine which view to show
  const status = existingVideo?.status ?? 'none'
  const showPlayer   = status === 'completed'
  const showProgress = status === 'queued' || status === 'processing'
  const showPicker   = status === 'none' || status === 'failed'

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-surface-2 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-gradient-to-r from-brand-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold">Module Video</h2>
              <p className="text-text-muted text-xs truncate max-w-[220px]">{moduleTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {showPlayer && (
              <motion.div key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VideoPlayer moduleId={moduleId} moduleTitle={moduleTitle} />
              </motion.div>
            )}
            {showProgress && (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GenerationProgress
                  moduleId={moduleId}
                  onDone={() => queryClient.invalidateQueries({ queryKey: ['video-status', moduleId] })}
                />
              </motion.div>
            )}
            {showPicker && (
              <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AvatarPicker
                  onSelect={(avatarId) => generateMutation.mutate(avatarId)}
                  isLoading={generateMutation.isPending}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
