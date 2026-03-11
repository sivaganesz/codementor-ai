import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/generate/')({
  component: GenerateComponent,
})

function GenerateComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Generate Full Course</h1>
      <p className="text-slate-600 mb-8">Tell us what you want to learn, and Gemini will build a structured course for you.</p>
      
      <div className="max-w-2xl bg-white p-6 border rounded-xl shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">What do you want to learn?</label>
        <textarea 
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
          placeholder="e.g. Master React and TypeScript by building a project management app"
        />
        <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
          Generate Plan
        </button>
      </div>
    </div>
  )
}
