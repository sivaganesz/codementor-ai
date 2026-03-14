import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, CheckCircle2, Loader2, BookOpen, Clock, ChevronRight, Layers } from 'lucide-react'
import { useState } from 'react'
import { useCourseGeneration } from '../../hooks/useCourseGeneration'

export const Route = createFileRoute('/generate/')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: GenerateWizard,
})

function GenerateWizard() {
  const { generatePlanMutation, confirmPlanMutation, pollStatus, store } = useCourseGeneration()
  const [localPrompt, setLocalPrompt] = useState(store.prompt)
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner')

  const exampleChips = [
    "Master React 19", "NestJS for Beginners", "TypeScript Generics", "Full-stack with Next.js", "AI Integration"
  ]

  const steps = [
    { id: 'input', label: 'Define' },
    { id: 'review', label: 'Review' },
    { id: 'generating', label: 'Build' },
    { id: 'complete', label: 'Ready' }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === store.step)

  const handleStartGeneration = () => {
    store.setPrompt(localPrompt)
    generatePlanMutation.mutate({ prompt: localPrompt, difficulty })
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl min-h-[80vh] flex flex-col">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-16">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 ${
                i <= currentStepIndex ? 'bg-brand-primary text-white shadow-[0_0_15px_rgba(108,59,255,0.4)]' : 'bg-surface-3 text-text-muted border border-white/5'
              }`}>
                {i < currentStepIndex ? <CheckCircle2 className="w-6 h-6" /> : i + 1}
              </div>
              <span className={`absolute -bottom-7 text-xs font-medium whitespace-nowrap ${i <= currentStepIndex ? 'text-brand-primary' : 'text-text-muted'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 transition-all duration-500 ${i < currentStepIndex ? 'bg-brand-primary' : 'bg-surface-3'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {store.step === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-surface-2 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-brand-secondary" />
                What's your learning goal?
              </h1>
              
              <div className="space-y-8">
                <div>
                  <textarea 
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value.slice(0, 500))}
                    className="w-full bg-surface-3 border border-white/5 rounded-2xl p-6 text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[160px] transition-all resize-none"
                    placeholder="e.g. Master React 19 and TanStack Router by building a professional dashboard..."
                  />
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-text-muted">{localPrompt.length} / 500</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Difficulty Level</label>
                  <div className="flex gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level as any)}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                          difficulty === level 
                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                            : 'bg-surface-3 border-white/5 text-text-muted hover:bg-white/5'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Try these:</label>
                  <div className="flex flex-wrap gap-2">
                    {exampleChips.map(chip => (
                      <button 
                        key={chip}
                        onClick={() => setLocalPrompt(chip)}
                        className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-sm hover:bg-brand-primary/20 hover:border-brand-primary/30 transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleStartGeneration}
                  disabled={!localPrompt || generatePlanMutation.isPending}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-display font-bold text-xl hover:shadow-[0_0_30px_rgba(108,59,255,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {generatePlanMutation.isPending ? (
                    <> <Loader2 className="w-6 h-6 animate-spin" /> Generating Plan... </>
                  ) : (
                    <> Generate Course Plan <ArrowRight className="w-6 h-6" /> </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review */}
          {store.step === 'review' && store.planSnapshot && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full space-y-8"
            >
              <div className="bg-surface-2 border border-white/10 rounded-[2.5rem] p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <BookOpen className="w-48 h-48" />
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-4xl font-display font-bold mb-4">{store.planSnapshot.title}</h2>
                  <p className="text-text-muted text-lg font-body mb-8 max-w-2xl leading-relaxed">
                    {store.planSnapshot.description}
                  </p>
                  <div className="flex items-center gap-6 text-brand-secondary font-bold mb-10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" /> {store.planSnapshot.estimatedHours} Hours
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5" /> {store.planSnapshot?.planSnapshot?.modules?.length} Modules
                    </div>
                  </div>

                  <div className="space-y-4">
                    {store.planSnapshot.modules.map((module, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center font-bold text-brand-primary">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{module.title}</h3>
                            <p className="text-sm text-text-muted">{module.lessons.length} Lessons</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => confirmPlanMutation.mutate(store.planId!)}
                  disabled={confirmPlanMutation.isPending}
                  className="flex-1 py-5 bg-brand-primary text-white rounded-2xl font-display font-bold text-xl shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {confirmPlanMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Build Full Course'}
                </button>
                <button 
                  onClick={() => store.setStep('input')}
                  className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-display font-bold text-xl hover:bg-white/10 transition-all"
                >
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {store.step === 'generating' && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center text-center"
            >
              <div className="relative mb-12">
                <div className="w-48 h-48 rounded-full bg-brand-primary/20 flex items-center justify-center relative z-10">
                  <div className="w-32 h-32 rounded-full bg-brand-primary/40 animate-ping absolute" />
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary animate-pulse relative z-20 flex items-center justify-center shadow-[0_0_50px_rgba(108,59,255,0.5)]">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-4xl font-display font-bold mb-4">Building Your Knowledge...</h2>
              <p className="text-text-muted text-lg font-body mb-12 max-w-md">
                Gemini is crafting deep lessons and practical examples tailored to your goal.
              </p>

              <div className="w-full max-w-md space-y-4">
                <div className="h-4 w-full bg-surface-3 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${pollStatus.data?.progress || 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-sm font-bold font-display tracking-widest text-brand-secondary">
                  <span>{pollStatus.data?.status?.toUpperCase() || 'PREPARING'}</span>
                  <span>{pollStatus.data?.progress || 0}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {store.step === 'complete' && (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-surface-2 border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-primary to-brand-secondary" />
              <div className="w-20 h-20 bg-brand-secondary/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-brand-secondary" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">Course Ready!</h2>
              <p className="text-text-muted text-lg mb-10 font-body">
                Your personalized curriculum has been generated and is ready for you to dive in.
              </p>

              <div className="flex flex-col gap-4">
                <Link 
                  to="/generate/$courseId"
                  params={{ courseId: store.courseId! }}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-display font-bold text-xl hover:shadow-[0_0_25px_rgba(108,59,255,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  Go to Course <ArrowRight className="w-6 h-6" />
                </Link>
                <button 
                  onClick={() => store.reset()}
                  className="text-text-muted hover:text-brand-secondary transition-colors font-medium"
                >
                  Generate Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
