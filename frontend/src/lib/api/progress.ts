import { apiClient } from './client'

export interface CourseProgressData {
  courseId: string
  percentage: number
  completedLessons: number
  totalLessons: number
  level: number
  levelLabel: string
  moduleProgress: {
    moduleId: string
    title: string
    completedLessons: number
    totalLessons: number
    completed: boolean
  }[]
  completedLessonIds: string[]
}

export const progressApi = {
  markComplete: (courseId: string, lessonId: string, moduleId: string) =>
    apiClient.post<CourseProgressData>(
      `/courses/${courseId}/lessons/${lessonId}/complete`,
      { moduleId },
    ),

  getProgress: (courseId: string) =>
    apiClient.get<CourseProgressData>(`/courses/${courseId}/progress`),

  getCompletedLessons: (courseId: string) =>
    apiClient.get<string[]>(`/courses/${courseId}/completed-lessons`),
}
