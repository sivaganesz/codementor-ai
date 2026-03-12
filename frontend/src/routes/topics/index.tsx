import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, Clock, ArrowRight, Zap, Target } from 'lucide-react'
import { useTopicLearning } from '../../hooks/useTopicLearning'
import { topicApi } from '../../lib/api/topics'

export const Route = createFileRoute('/topics/')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: TopicsHome,
})

function TopicsHome() {
  const [topic, setTopic] = useState('')
  const [depth, setDepth] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner')
  const { mutate: generateTopic, isPending } = useTopicLearning()

  // For pre-filling from query params if needed
  const searchParams = Route.useSearch() as { prefill?: string }
  useEffect(() => {
    if (searchParams.prefill) setTopic(searchParams.prefill)
  }, [searchParams.prefill])

  const { data: recentTopics } = useQuery({
    queryKey: ['topics', 'search', ''],
    queryFn: () => topicApi.searchTopics('').then(r => r.data),
  })

  const exampleChips = [
    "React State Management", "Custom Hooks", "TanStack Query", "TypeScript Generics", "NestJS Guards", "Docker Basics"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic) return
    generateTopic({ topic, preferredDepth: depth.toLowerCase() as any })
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-sm font-bold mb-6">
            <Target className="w-4 h-4" /> Focused Learning
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">Master any <span className="text-brand-secondary">Concept</span></h1>
          <p className="text-xl text-text-muted font-body max-w-2xl mx-auto">
            Get instant, deep explanations with real-world scenarios and production-ready code examples.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-2 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl mb-20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Search className="w-48 h-48 text-brand-secondary" />
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted" />
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What concept do you want to explore?"
                className="w-full bg-surface-3 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={isPending || !topic}
              className="px-10 py-5 bg-brand-secondary text-surface-1 rounded-2xl font-display font-bold text-xl hover:shadow-[0_0_25px_rgba(0,212,170,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Zap className="w-6 h-6 animate-pulse" /> : 'Explore Now'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Depth:</span>
              <div className="flex bg-surface-3 p-1 rounded-xl border border-white/5">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDepth(level as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      depth === level ? 'bg-brand-secondary text-surface-1' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {exampleChips.map(chip => (
                <button 
                  key={chip}
                  type="button"
                  onClick={() => setTopic(chip)}
                  className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-xs font-medium hover:bg-brand-secondary/20 hover:border-brand-secondary/30 transition-all text-text-muted hover:text-brand-secondary"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </form>
      </motion.div>

      {/* Recent Topics */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-primary" /> Recently Explored
          </h2>
          <Link to="/topics" className="text-brand-secondary text-sm font-bold hover:underline">View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentTopics?.slice(0, 6).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                to="/topics/$topicId"
                params={{ topicId: item.id }}
                className="group block p-6 bg-surface-2 border border-white/5 rounded-2xl hover:border-brand-secondary/30 hover:bg-white/5 transition-all h-full"
              >
                <div className="w-10 h-10 bg-brand-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-secondary group-hover:text-surface-1 transition-all">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-brand-secondary transition-colors">{item.name}</h3>
                <p className="text-text-muted text-sm line-clamp-2 font-body mb-4">
                  {item.overview}
                </p>
                <div className="flex items-center gap-2 text-brand-secondary text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
          
          {(!recentTopics || recentTopics.length === 0) && (
            <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
              <p className="text-text-muted">No topics explored yet. Start your first search above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
