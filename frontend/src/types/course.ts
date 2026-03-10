export interface CoursePlan {
  id: string
  title: string
  description: string
  estimatedHours: number
  modules: PlanModule[]
}

export interface PlanModule {
  id: string
  title: string
  description: string
  order: number
  lessons: PlanLesson[]
}

export interface PlanLesson {
  id: string
  title: string
  order: number
}

export interface Course extends CoursePlan {
  status: 'draft' | 'generating' | 'completed' | 'failed'
  createdAt: string
  modules: CourseModule[]
}

export interface CourseModule extends PlanModule {
  videoUrl?: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  content: string         // Markdown content
  codeExamples: CodeExample[]
  order: number
  estimatedMinutes: number
}

export interface CodeExample {
  language: string
  code: string
  description: string
}

export interface GenerationStatus {
  jobId: string
  status: 'draft' | 'generating' | 'completed' | 'failed'
}
