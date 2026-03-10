import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, Sparkles, GraduationCap } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-12 py-12">
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Your AI-Powered <span className="text-indigo-600">Personal Tutor</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Generate custom structured courses or deep-dive into any topic with the power of Google Gemini.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Link 
          to="/generate"
          className="group p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all text-left"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <Sparkles className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Full Course Generation</h2>
          <p className="text-slate-500 mb-6">Create a complete learning path with modules, lessons, and AI-generated videos.</p>
          <div className="text-indigo-600 font-semibold flex items-center gap-2">
            Get Started →
          </div>
        </Link>

        <Link 
          to="/topics"
          className="group p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all text-left"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
            <BookOpen className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Topic Deep-Dive</h2>
          <p className="text-slate-500 mb-6">Need to understand a specific concept quickly? Generate focused learning content on demand.</p>
          <div className="text-emerald-600 font-semibold flex items-center gap-2">
            Explore Topics →
          </div>
        </Link>
      </div>

      <div className="pt-12 border-t">
        <div className="flex justify-center items-center gap-12 grayscale opacity-50">
          <div className="flex items-center gap-2 font-bold text-xl"><GraduationCap /> Learning Reimagined</div>
          <div className="font-bold text-xl">Powered by Gemini 1.5</div>
        </div>
      </div>
    </div>
  )
}
