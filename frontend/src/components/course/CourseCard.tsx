import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock, Layers, ArrowRight, PlayCircle, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { progressApi } from '../../lib/api/progress'
import type { Course } from '../../types/course'

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    draft: { color: 'bg-text-muted/20 text-text-muted', label: 'Draft', icon: null },
    generating: { color: 'bg-yellow-500/20 text-yellow-500', label: 'Generating', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { color: 'bg-brand-secondary/20 text-brand-secondary', label: 'Completed', icon: null },
    failed: { color: 'bg-red-500/20 text-red-500', label: 'Failed', icon: <AlertCircle className="w-3 h-3" /> },
  }

  const status = statusConfig[course.status] ?? statusConfig.draft

  // Load progress only for completed courses
  const { data: progress } = useQuery({
    queryKey: ['progress', course.id],
    queryFn: () => progressApi.getProgress(course.id).then(r => r.data),
    enabled: course.status === 'completed',
  })

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-surface-2 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-primary/30 transition-all group flex flex-col h-full shadow-xl"
    >
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
            {status.icon}
            {status.label}
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {new Date(course.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-xl font-display font-bold mb-3 group-hover:text-brand-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-text-muted text-sm line-clamp-2 font-body mb-5">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs font-bold text-text-muted mb-4">
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.estimatedHours}h</div>
          <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {course.modules?.length || 0} Modules</div>
        </div>

        {/* Progress bar */}
        {progress && course.status === 'completed' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" /> Progress
              </div>
              <span className="text-[10px] font-bold text-brand-secondary">{progress.percentage}%</span>
            </div>
            <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
        <Link
          to="/generate/$courseId"
          params={{ courseId: course.id }}
          className="text-sm font-bold text-brand-primary flex items-center gap-2 group-hover:translate-x-1 transition-transform"
        >
          {course.status === 'completed'
            ? (progress && progress.percentage === 100 ? '🏆 Review Course' : 'Continue Learning')
            : 'View Status'}
          <ArrowRight className="w-4 h-4" />
        </Link>
        {course.status === 'completed' && progress && progress.percentage === 100 && (
          <PlayCircle className="w-5 h-5 text-yellow-400" />
        )}
        {course.status === 'completed' && (!progress || progress.percentage < 100) && (
          <PlayCircle className="w-5 h-5 text-brand-secondary opacity-50" />
        )}
      </div>
    </motion.div>
  )
}
