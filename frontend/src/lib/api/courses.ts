import { apiClient } from './client'
import { Course, CoursePlan, GenerationStatus } from '../../types/course'

export interface GeneratePlanDto {
  prompt: string
}

export const courseApi = {
  // Step 1: Generate a course plan
  generatePlan: (payload: GeneratePlanDto) =>
    apiClient.post<CoursePlan>('/courses/generate-plan', payload),

  // Step 2: Confirm plan → triggers full course generation
  confirmPlan: (planId: string) =>
    apiClient.post<{ jobId: string }>(`/courses/${planId}/confirm`),

  // Fetch a course with all modules & lessons
  getCourse: (courseId: string) =>
    apiClient.get<Course>(`/courses/${courseId}`),

  // Get all user courses
  listMyCourses: () =>
    apiClient.get<Course[]>('/courses/me'),

  // Get generation status (polling)
  getGenerationStatus: (jobId: string) =>
    apiClient.get<GenerationStatus>(`/courses/status/${jobId}`),
}
