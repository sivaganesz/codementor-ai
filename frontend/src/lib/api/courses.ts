import { apiClient } from './client'
import type { Course, CoursePlan, GenerationStatus } from '../../types/course'

export interface GeneratePlanDto {
  prompt: string
  level: string   // backend DTO field is "level", not "difficulty"
}

export const courseApi = {
  generatePlan: (payload: { prompt: string; difficulty: string }) =>
    apiClient.post<CoursePlan>('/courses/generate-plan', {
      prompt: payload.prompt,
      level: payload.difficulty.toLowerCase(),   // FIX: map difficulty → level
    }),

  confirmPlan: (planId: string) =>
    apiClient.post<{ jobId: string }>(`/courses/${planId}/confirm`),

  getCourse: (courseId: string) =>
    apiClient.get<Course>(`/courses/${courseId}`),

  listMyCourses: () =>
    apiClient.get<Course[]>('/courses/me'),

  getGenerationStatus: (jobId: string) =>
    apiClient.get<GenerationStatus>(`/courses/status/${jobId}`),
}
