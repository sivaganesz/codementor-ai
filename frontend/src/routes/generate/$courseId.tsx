import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/generate/$courseId')({
  component: CourseViewComponent,
})

function CourseViewComponent() {
  const { courseId } = Route.useParams()
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Course View</h1>
      <p className="text-slate-600">Viewing course: {courseId}</p>
      <div className="mt-8 p-6 bg-white border rounded-xl">
        <p>Course content for ID {courseId} will be displayed here.</p>
      </div>
    </div>
  )
}
