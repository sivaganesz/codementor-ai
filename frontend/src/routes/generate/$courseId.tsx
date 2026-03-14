import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Clock,
  Copy,
  CheckCircle,
  CheckCircle2,
  PlayCircle,
  FileText,
  AlertCircle,
  ArrowLeft,
  Trophy,
  Zap,
  Star,
  TrendingUp,
} from 'lucide-react'
import { courseApi } from '../../lib/api/courses'
import { progressApi } from '../../lib/api/progress'
import type { Lesson } from '../../types/course'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/generate/$courseId')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: CourseView,
})

// ─── Celebration overlay ──────────────────────────────────────────────
interface CelebrationProps {
  type: 'lesson' | 'module' | 'course'
  label: string
  level?: number
  levelLabel?: string
  onDone: () => void
}

const celebrationConfig = {
  lesson: { emoji: '✅', title: 'Lesson Complete!', color: 'text-brand-secondary', bg: 'from-brand-secondary/20 to-transparent', message: 'Keep going, you\'re on fire! 🔥' },
  module: { emoji: '🎉', title: 'Module Completed!', color: 'text-brand-primary', bg: 'from-brand-primary/20 to-transparent', message: 'Amazing progress! 🚀 Next module awaits.' },
  course: { emoji: '🏆', title: 'Course Complete!', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-transparent', message: 'You\'re a legend! Outstanding work! 🌟' },
}

function CelebrationOverlay({ type, label, level, levelLabel, onDone }: CelebrationProps) {
  const cfg = celebrationConfig[type]
  useEffect(() => {
    const t = setTimeout(onDone, type === 'course' ? 4000 : 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
    >
      {/* Confetti particles */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: ['#6C3BFF','#00D4AA','#FF6B35','#FFD700','#FF69B4'][i % 5],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: 0, opacity: 1, rotate: 0, scale: Math.random() * 1.5 + 0.5 }}
          animate={{ y: window.innerHeight + 50, opacity: [1, 1, 0], rotate: Math.random() * 720 - 360 }}
          transition={{ duration: Math.random() * 1.5 + 1, delay: Math.random() * 0.5, ease: 'easeIn' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-surface-2 border border-white/10 rounded-3xl px-10 py-8 text-center shadow-2xl max-w-sm mx-4 pointer-events-auto"
      >
        <div className={`text-6xl mb-4 bg-gradient-to-b ${cfg.bg} rounded-2xl py-4`}>{cfg.emoji}</div>
        <h2 className={`text-2xl font-display font-bold mb-2 ${cfg.color}`}>{cfg.title}</h2>
        <p className="text-text-primary font-semibold mb-1">{label}</p>
        <p className="text-text-muted text-sm mb-4">{cfg.message}</p>
        {level && (
          <div className="flex items-center justify-center gap-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-4 py-2 mb-4">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-brand-primary">Level {level} — {levelLabel}</span>
          </div>
        )}
        <button
          onClick={onDone}
          className="text-xs text-text-muted hover:text-brand-secondary transition-colors"
        >
          Continue →
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Progress bar component ───────────────────────────────────────────
function ProgressBar({ percentage, level, levelLabel }: { percentage: number; level: number; levelLabel: string }) {
  return (
    <div className="bg-surface-3 border border-white/5 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-secondary" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Course Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-brand-primary">Lvl {level} · {levelLabel}</span>
        </div>
      </div>
      <div className="h-2 bg-surface-1 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-text-muted">{percentage}% complete</span>
        {percentage === 100 && (
          <span className="text-[10px] text-brand-secondary font-bold">🏆 Completed!</span>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────
function CourseView() {
  const { courseId } = Route.useParams()
  const queryClient = useQueryClient()
  const [activeModuleIdx, setActiveModuleIdx] = useState(0)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [celebration, setCelebration] = useState<{ type: 'lesson' | 'module' | 'course'; label: string } | null>(null)

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => courseApi.getCourse(courseId).then(r => r.data),
  })

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => progressApi.getProgress(courseId).then(r => r.data),
    enabled: !!course,
  })

  const completedIds = new Set(progressData?.completedLessonIds ?? [])

  const markCompleteMutation = useMutation({
    mutationFn: ({ lessonId, moduleId }: { lessonId: string; moduleId: string }) =>
      progressApi.markComplete(courseId, lessonId, moduleId).then(r => r.data),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(['progress', courseId], data)

      const mod = course?.modules.find(m => m.id === vars.moduleId)
      const modProgress = data.moduleProgress.find(mp => mp.moduleId === vars.moduleId)

      // Decide which celebration to show
      if (data.percentage === 100) {
        setCelebration({ type: 'course', label: course?.title ?? 'Course' })
      } else if (modProgress?.completed && !completedIds.has(vars.lessonId)) {
        setCelebration({ type: 'module', label: mod?.title ?? 'Module' })
      } else {
        const lesson = mod?.lessons.find(l => l.id === vars.lessonId)
        setCelebration({ type: 'lesson', label: lesson?.title ?? 'Lesson' })
      }
    },
    onError: () => toast.error('Failed to mark lesson complete'),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Code copied!')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 animate-pulse">
        <div className="h-48 bg-surface-2 rounded-3xl mb-8" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4 h-96 bg-surface-2 rounded-2xl" />
          <div className="col-span-12 md:col-span-8 h-96 bg-surface-2 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-4">Course not found</h1>
        <p className="text-text-muted mb-8">This course doesn't exist or you don't have access.</p>
        <button onClick={() => window.history.back()} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebration && (
          <CelebrationOverlay
            type={celebration.type}
            label={celebration.label}
            level={progressData?.level}
            levelLabel={progressData?.levelLabel}
            onDone={() => setCelebration(null)}
          />
        )}
      </AnimatePresence>

      {/* Course Header */}
      <div className="relative bg-surface-2 border border-white/10 rounded-[2.5rem] p-10 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <BookOpen className="w-64 h-64 text-brand-primary" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                course.status === 'completed'
                  ? 'bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30'
                  : 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'
              }`}>
                {course.status}
              </span>
              <span className="text-text-muted flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4" /> {course.estimatedHours}h total
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-text-muted text-lg font-body leading-relaxed">{course.description}</p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-center bg-white/5 border border-white/5 rounded-2xl px-6 py-4">
              <div className="text-2xl font-display font-bold text-brand-primary">{course.modules.length}</div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold">Modules</div>
            </div>
            <div className="text-center bg-white/5 border border-white/5 rounded-2xl px-6 py-4">
              <div className="text-2xl font-display font-bold text-brand-secondary">{totalLessons}</div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold">Lessons</div>
            </div>
            {progressData && (
              <div className="text-center bg-white/5 border border-white/5 rounded-2xl px-6 py-4">
                <div className="text-2xl font-display font-bold text-yellow-400">{progressData.percentage}%</div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-bold">Done</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-4 space-y-3">
          {/* Progress */}
          {progressData && (
            <ProgressBar
              percentage={progressData.percentage}
              level={progressData.level}
              levelLabel={progressData.levelLabel}
            />
          )}

          <h2 className="text-xl font-display font-bold px-1 mb-2">Curriculum</h2>

          {course.modules.map((module, mIdx) => {
            const modProgress = progressData?.moduleProgress.find(mp => mp.moduleId === module.id)
            const isModComplete = modProgress?.completed ?? false
            const modCompletedCount = modProgress?.completedLessons ?? 0

            return (
              <div key={module.id} className="bg-surface-2 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <button
                  onClick={() => setActiveModuleIdx(mIdx === activeModuleIdx ? -1 : mIdx)}
                  className={`w-full p-5 flex items-center justify-between transition-colors ${mIdx === activeModuleIdx ? 'bg-brand-primary/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm relative ${
                      isModComplete ? 'bg-brand-secondary text-white' : mIdx === activeModuleIdx ? 'bg-brand-primary text-white' : 'bg-surface-3 text-text-muted'
                    }`}>
                      {isModComplete ? <CheckCircle2 className="w-5 h-5" /> : mIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{module.title}</h3>
                      <p className="text-xs text-text-muted">{modCompletedCount}/{module.lessons.length} Lessons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isModComplete && <Trophy className="w-4 h-4 text-yellow-400" />}
                    {mIdx === activeModuleIdx
                      ? <ChevronDown className="w-5 h-5 text-brand-primary" />
                      : <ChevronRight className="w-5 h-5 text-text-muted" />
                    }
                  </div>
                </button>

                <AnimatePresence>
                  {mIdx === activeModuleIdx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 py-2 bg-black/20 overflow-hidden"
                    >
                      {module.lessons.map((lesson) => {
                        const isDone = completedIds.has(lesson.id)
                        const isActive = activeLesson?.id === lesson.id
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full px-6 py-3.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors ${isActive ? 'bg-white/5 border-l-2 border-brand-primary' : ''}`}
                          >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isDone ? 'bg-brand-secondary' : isActive ? 'border-2 border-brand-primary' : 'border border-text-muted/30'
                            }`}>
                              {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm font-medium flex-1 ${
                              isDone ? 'text-text-muted line-through' : isActive ? 'text-text-primary' : 'text-text-muted'
                            }`}>
                              {lesson.title}
                            </span>
                            {isDone && <Zap className="w-3 h-3 text-brand-secondary shrink-0" />}
                          </button>
                        )
                      })}
                      {!module.videoUrl && (
                        <div className="px-6 py-3">
                          <button className="w-full py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest text-text-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all flex items-center justify-center gap-2">
                            <PlayCircle className="w-3.5 h-3.5" /> Generate Video
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Lesson Content */}
        <div className="col-span-12 md:col-span-8 bg-surface-2 border border-white/5 rounded-3xl min-h-[600px] shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 md:p-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-brand-primary" />
                    <span className="text-brand-primary font-bold font-display uppercase tracking-widest text-sm">Lesson</span>
                  </div>
                  {completedIds.has(activeLesson.id) && (
                    <span className="flex items-center gap-1.5 text-brand-secondary text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-white">{activeLesson.title}</h2>

                <div className="prose prose-invert max-w-none font-body text-text-muted leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4 text-base text-text-muted" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-1.5 text-text-muted" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-1.5 text-text-muted" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
                      code: ({ node, ...props }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-secondary font-mono text-sm" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-brand-primary/50 pl-4 italic text-text-muted my-4" {...props} />,
                    }}
                  >
                    {activeLesson.content}
                  </ReactMarkdown>
                </div>

                {activeLesson.codeExamples?.length > 0 && (
                  <div className="mt-10 space-y-6">
                    <h3 className="text-xl font-display font-bold flex items-center gap-2">
                      <Copy className="w-5 h-5 text-brand-secondary" /> Hands-on Examples
                    </h3>
                    {activeLesson.codeExamples.map((example, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-white/10 bg-surface-3">
                        <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                          <span className="text-xs font-bold font-display uppercase tracking-widest text-brand-secondary">{example.language}</span>
                          <button onClick={() => copyToClipboard(example.code)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          language={example.language.toLowerCase()}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '14px' }}
                        >
                          {example.code}
                        </SyntaxHighlighter>
                        {example.description && (
                          <div className="p-4 bg-black/20 text-sm text-text-muted italic border-t border-white/5">
                            {example.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer: time estimate + mark complete */}
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{activeLesson.estimatedMinutes} min read</span>
                  </div>

                  {completedIds.has(activeLesson.id) ? (
                    <div className="flex items-center gap-2 px-6 py-3 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 rounded-xl font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" /> Already Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const mod = course.modules.find(m => m.lessons.some(l => l.id === activeLesson.id))
                        if (mod) markCompleteMutation.mutate({ lessonId: activeLesson.id, moduleId: mod.id })
                      }}
                      disabled={markCompleteMutation.isPending}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 rounded-xl font-bold hover:bg-brand-secondary hover:text-surface-1 transition-all group disabled:opacity-50"
                    >
                      {markCompleteMutation.isPending
                        ? 'Saving...'
                        : <><CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Mark as Complete</>
                      }
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6 opacity-40">
                  <BookOpen className="w-12 h-12 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2 opacity-50">Select a lesson</h3>
                <p className="text-text-muted max-w-xs mx-auto opacity-40">
                  Click on a module and choose a lesson to start learning.
                </p>
                {progressData && progressData.completedLessons > 0 && (
                  <div className="mt-8 flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-5 py-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-brand-primary">
                      {progressData.completedLessons} of {progressData.totalLessons} lessons done · Level {progressData.level}
                    </span>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
