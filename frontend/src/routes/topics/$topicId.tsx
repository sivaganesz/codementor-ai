import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/topics/$topicId')({
  component: TopicDetailComponent,
})

function TopicDetailComponent() {
  const { topicId } = Route.useParams()
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Topic Deep-Dive</h1>
      <div className="bg-white p-8 border rounded-2xl shadow-sm space-y-6">
        <h2 className="text-2xl font-semibold text-indigo-600">Learning Content: {topicId}</h2>
        <div className="prose prose-slate max-w-none">
          <p>This is where the AI-generated deep-dive content for topic <strong>{topicId}</strong> will appear.</p>
        </div>
      </div>
    </div>
  )
}
