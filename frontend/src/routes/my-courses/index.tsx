import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, BookMarked, Sparkles } from 'lucide-react'
import { courseApi } from '../../lib/api/courses'
import { CourseCard } from '../../components/course/CourseCard'

export const Route = createFileRoute('/my-courses/')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: MyCourses,
})

function MyCourses() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', 'me'],
    queryFn: () => courseApi.listMyCourses().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="h-10 w-48 bg-surface-2 animate-pulse rounded-xl" />
          <div className="h-12 w-40 bg-surface-2 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-surface-2 animate-pulse rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-brand-primary font-display font-bold uppercase tracking-widest text-sm">Library</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">My <span className="text-brand-primary">Courses</span></h1>
        </div>
        
        {courses && courses.length > 0 && (
          <Link 
            to="/generate"
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(108,59,255,0.4)] transition-all"
          >
            <Plus className="w-5 h-5" /> Generate New
          </Link>
        )}
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center bg-surface-2 border border-white/5 border-dashed rounded-[3rem]"
        >
          <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-8">
            <Sparkles className="w-12 h-12 text-brand-primary opacity-20" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4 text-white">Your library is empty</h2>
          <p className="text-text-muted text-lg font-body max-w-md mb-10 leading-relaxed">
            You haven't generated any personalized courses yet. Start your journey with your first topic!
          </p>
          <Link 
            to="/generate"
            className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-display font-bold text-xl hover:shadow-[0_0_30px_rgba(108,59,255,0.4)] transition-all flex items-center gap-3"
          >
            Create Your First Course <Plus className="w-6 h-6" />
          </Link>
        </motion.div>
      )}
    </div>
  )
}
