import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-courses/')({
  component: MyCoursesComponent,
})

function MyCoursesComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Learning Library</h1>
      <p className="text-slate-600 mb-8">All your generated courses and topics in one place.</p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6 bg-white shadow-sm flex items-center justify-center min-h-[200px] border-dashed text-slate-400">
          No courses generated yet.
        </div>
      </div>
    </div>
  )
}
