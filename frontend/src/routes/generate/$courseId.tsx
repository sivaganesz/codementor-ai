import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
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
  PlayCircle, 
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { courseApi } from '../../lib/api/courses'
import type { Lesson } from '../../types/course'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/generate/$courseId')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: CourseView,
})

function CourseView() {
  const { courseId } = Route.useParams()
  const [activeModuleIdx, setActiveModuleIdx] = useState(0)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => courseApi.getCourse(courseId).then(r => r.data),
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
        <p className="text-text-muted mb-8">The course you're looking for doesn't exist or you don't have access.</p>
        <button onClick={() => window.history.back()} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Course Header */}
      <div className="relative bg-surface-2 border border-white/10 rounded-[2.5rem] p-10 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <BookOpen className="w-64 h-64 text-brand-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                course.status === 'completed' ? 'bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30' : 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'
              }`}>
                {course.status}
              </span>
              <span className="text-text-muted flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4" /> {course.estimatedHours} Hours total
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-text-muted text-lg font-body leading-relaxed">
              {course.description}
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center bg-white/5 border border-white/5 rounded-2xl px-6 py-4">
              <div className="text-2xl font-display font-bold text-brand-primary">{course.modules.length}</div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold">Modules</div>
            </div>
            <div className="text-center bg-white/5 border border-white/5 rounded-2xl px-6 py-4">
              <div className="text-2xl font-display font-bold text-brand-secondary">
                {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
              </div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold">Lessons</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="col-span-12 md:col-span-4 space-y-4">
          <h2 className="text-xl font-display font-bold px-4 mb-4">Curriculum</h2>
          {course.modules.map((module, mIdx) => (
            <div key={module.id} className="bg-surface-2 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <button 
                onClick={() => setActiveModuleIdx(mIdx === activeModuleIdx ? -1 : mIdx)}
                className={`w-full p-5 flex items-center justify-between transition-colors ${mIdx === activeModuleIdx ? 'bg-brand-primary/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${mIdx === activeModuleIdx ? 'bg-brand-primary text-white' : 'bg-surface-3 text-text-muted'}`}>
                    {mIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-brand-primary transition-colors">{module.title}</h3>
                    <p className="text-xs text-text-muted">{module.lessons.length} Lessons</p>
                  </div>
                </div>
                {mIdx === activeModuleIdx ? <ChevronDown className="w-5 h-5 text-brand-primary" /> : <ChevronRight className="w-5 h-5 text-text-muted" />}
              </button>
              
              <AnimatePresence>
                {mIdx === activeModuleIdx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 py-2 bg-black/20 overflow-hidden"
                  >
                    {module.lessons.map((lesson) => (
                      <button 
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full px-6 py-3.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group ${activeLesson?.id === lesson.id ? 'bg-white/5 border-l-2 border-brand-primary' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${activeLesson?.id === lesson.id ? 'bg-brand-primary' : 'bg-text-muted/30 group-hover:bg-brand-primary/50'}`} />
                        <span className={`text-sm font-medium ${activeLesson?.id === lesson.id ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}`}>
                          {lesson.title}
                        </span>
                      </button>
                    ))}
                    {module.videoUrl ? (
                      <button className="w-full px-6 py-4 flex items-center gap-3 text-brand-secondary hover:bg-brand-secondary/10 transition-colors font-bold text-xs uppercase tracking-widest mt-2 border-t border-white/5">
                        <PlayCircle className="w-4 h-4" /> Watch Module Video
                      </button>
                    ) : (
                      <div className="px-6 py-4">
                         <button className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest text-text-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                          Generate Video
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Lesson Content Panel */}
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
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-brand-primary" />
                  <span className="text-brand-primary font-bold font-display uppercase tracking-widest text-sm">Lesson Details</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-white">{activeLesson.title}</h2>
                
                <div className="prose prose-invert prose-brand max-w-none font-body text-text-muted leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 text-lg" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="pl-2" {...props} />,
                      code: ({node, ...props}) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-secondary font-mono text-sm" {...props} />,
                    }}
                  >
                    {activeLesson.content}
                  </ReactMarkdown>
                </div>

                {activeLesson.codeExamples.length > 0 && (
                  <div className="mt-12 space-y-8">
                    <h3 className="text-xl font-display font-bold flex items-center gap-2">
                      <Copy className="w-5 h-5 text-brand-secondary" /> Hands-on Examples
                    </h3>
                    {activeLesson.codeExamples.map((example, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-white/10 bg-surface-3 group">
                        <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                          <span className="text-xs font-bold font-display uppercase tracking-widest text-brand-secondary">
                            {example.language}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(example.code)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white"
                          >
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
                        <div className="p-4 bg-black/20 text-sm text-text-muted italic border-t border-white/5">
                          {example.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-16 pt-8 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{activeLesson.estimatedMinutes} mins read</span>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 rounded-xl font-bold hover:bg-brand-secondary text-white transition-all group">
                    Mark as Complete <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                <BookOpen className="w-24 h-24 mb-6 text-text-muted" />
                <h3 className="text-2xl font-display font-bold mb-2">Select a lesson</h3>
                <p className="max-w-xs mx-auto">Click on a module and select a lesson to start learning.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
