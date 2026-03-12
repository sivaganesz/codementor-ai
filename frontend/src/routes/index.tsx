import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Sparkles, BookOpen, ArrowRight, Zap, Layers, Cpu } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const techBadges = [
    "React 19", "NestJS", "Gemini AI", "PostgreSQL", "BullMQ", 
    "TypeScript", "Tailwind CSS", "TanStack Query", "Framer Motion", "Redis"
  ]

  return (
    <div className="relative overflow-hidden pt-20 pb-32">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-brand-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-6 relative z-10">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-secondary text-sm font-bold mb-8">
              <Zap className="w-4 h-4 fill-brand-secondary" />
              Revolutionizing Tech Education
            </span>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tight mb-8 leading-[1.1]">
              Learn Any Tech, <br />
              <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">Your Way</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-muted font-body max-w-2xl mx-auto mb-12 leading-relaxed">
              Generate structured personal courses or deep-dive into any concept with AI that understands your goals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/generate"
                className="w-full sm:w-auto px-8 py-4 bg-brand-cta text-white rounded-2xl font-display font-bold text-lg hover:shadow-[0_0_25px_rgba(255,107,53,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Generate Full Course <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/topics"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-display font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Explore Topics
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link 
              to="/generate"
              className="group block p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] hover:bg-white/10 hover:border-brand-primary/50 transition-all relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers className="w-24 h-24" />
              </div>
              <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                <Sparkles className="w-8 h-8 text-brand-primary" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">Structured Paths</h2>
              <p className="text-text-muted text-lg font-body mb-8 leading-relaxed">
                Create a full curriculum from scratch. Modules, lessons, and practical code examples — all perfectly sequenced.
              </p>
              <div className="text-brand-primary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Start Building →
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link 
              to="/topics"
              className="group block p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] hover:bg-white/10 hover:border-brand-secondary/50 transition-all relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="w-24 h-24" />
              </div>
              <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                <BookOpen className="w-8 h-8 text-brand-secondary" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">Topic Deep-Dives</h2>
              <p className="text-text-muted text-lg font-body mb-8 leading-relaxed">
                Stuck on a specific concept? Get instant deep-dives with real-world scenarios and production-ready code.
              </p>
              <div className="text-brand-secondary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Quick Search →
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Tech Badges Strip */}
        <div className="relative mt-20">
          <div className="flex overflow-hidden group">
            <motion.div 
              className="flex gap-4 py-4 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{ 
                duration: 30, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              {[...techBadges, ...techBadges].map((tech, i) => (
                <div 
                  key={i}
                  className="px-6 py-3 bg-white/5 backdrop-blur-md border border-white/5 rounded-full text-text-muted font-medium text-sm hover:text-brand-secondary hover:border-brand-secondary/30 transition-all cursor-default"
                >
                  {tech}
                </div>
              ))}
            </motion.div>
          </div>
          {/* Gradient Fades for Marquee */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface-1 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface-1 to-transparent z-10" />
        </div>
      </div>
    </div>
  )
}
