import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { 
  Lightbulb, 
  Code2, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Copy,
  Zap,
  Target
} from 'lucide-react'
import { topicApi } from '../../lib/api/topics'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/topics/$topicId')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: TopicDetail,
})

function TopicDetail() {
  const { topicId } = Route.useParams()

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topics', topicId],
    queryFn: () => topicApi.getTopic(topicId).then(r => r.data),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Code copied!')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 animate-pulse space-y-8">
        <div className="h-64 bg-surface-2 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-surface-2 rounded-2xl" />
          <div className="h-48 bg-surface-2 rounded-2xl" />
          <div className="h-48 bg-surface-2 rounded-2xl" />
        </div>
        <div className="h-96 bg-surface-2 rounded-3xl" />
      </div>
    )
  }

  if (!topic) return null

  const borderColors = ['border-brand-primary', 'border-brand-secondary', 'border-brand-cta']

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-surface-2 border border-white/10 rounded-[2.5rem] p-10 md:p-16 mb-12 overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Zap className="w-64 h-64 text-brand-secondary" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-brand-secondary/20 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-brand-secondary" />
            </div>
            <span className="text-brand-secondary font-display font-bold uppercase tracking-widest text-sm">Deep Dive</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-8">{topic.name}</h1>
          <p className="text-xl md:text-2xl text-text-muted font-body leading-relaxed max-w-3xl">
            {topic.overview}
          </p>
        </div>
      </motion.div>

      {/* Real World Examples */}
      <section className="mb-20">
        <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-brand-secondary" /> Real-World Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topic.realWorldExamples.map((ex, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-surface-2 border-l-4 ${borderColors[idx % 3]} rounded-2xl p-8 shadow-xl hover:bg-white/5 transition-all h-full`}
            >
              <h3 className="text-xl font-bold mb-4">{ex.title}</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Scenario</span>
                  <p className="text-text-muted">{ex.scenario}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary block mb-1">Solution</span>
                  <p className="text-text-primary">{ex.solution}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-primary block mb-1">Outcome</span>
                  <p className="text-text-muted italic">{ex.outcome}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Code Examples */}
      <section className="mb-20">
        <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <Code2 className="w-8 h-8 text-brand-primary" /> Implementation
        </h2>
        <div className="space-y-8">
          {topic.codeExamples.map((ex, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-surface-2 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-white/5 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-widest border border-brand-primary/30">
                    {ex.language}
                  </span>
                  <span className="text-sm font-medium text-text-muted">{ex.description}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(ex.code)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <SyntaxHighlighter 
                language={ex.language.toLowerCase()} 
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '2rem', background: 'transparent', fontSize: '15px' }}
              >
                {ex.code}
              </SyntaxHighlighter>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {/* When & Where */}
        <section className="bg-brand-primary/5 border border-brand-primary/20 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-brand-primary" /> When to use this?
          </h2>
          <p className="text-lg text-text-muted font-body leading-relaxed">
            {topic.whenToUse}
          </p>
        </section>

        {/* Common Pitfalls */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6" /> Common Pitfalls
          </h2>
          <ul className="space-y-4">
            {topic.commonPitfalls.map((pitfall, i) => (
              <li key={i} className="flex gap-3 text-text-muted font-body">
                <span className="text-red-400 font-bold mt-1">•</span>
                {pitfall}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Key Takeaways */}
      <section className="bg-surface-2 border border-white/5 rounded-[2.5rem] p-10 md:p-12 mb-20 shadow-xl">
        <h2 className="text-3xl font-display font-bold mb-10 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-brand-secondary" /> Key Takeaways
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topic.keyTakeaways.map((point, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-brand-secondary" />
              </div>
              <p className="text-text-primary font-medium">{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Topics */}
      <section className="text-center">
        <h2 className="text-2xl font-display font-bold mb-8 uppercase tracking-widest text-text-muted">Explore More</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {topic.relatedTopics.map((rel, i) => (
            <Link 
              key={i}
              to="/topics"
              search={{ prefill: rel }}
              className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-brand-primary/20 hover:border-brand-primary/30 transition-all font-bold text-sm"
            >
              {rel}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
