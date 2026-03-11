import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/topics/')({
  component: TopicsComponent,
})

function TopicsComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Topic Deep-Dive</h1>
      <p className="text-slate-600 mb-8">Quickly understand any concept with AI-generated explanations and examples.</p>
      
      <div className="max-w-2xl bg-white p-6 border rounded-xl shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">What do you want to learn about?</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="e.g. How do React Hooks work?"
          />
          <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
