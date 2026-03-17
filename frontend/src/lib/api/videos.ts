import { apiClient } from './client'

export interface Avatar {
  id: string
  name: string
  gender: 'male' | 'female'
  preview_url: string | null
}

export interface VideoStatus {
  id?: string
  moduleId: string
  status: 'none' | 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string | null
  videoUrl: string | null
  script?: string
  avatarId?: string
  errorMessage?: string
}

export const videoApi = {
  getAvatars: () =>
    apiClient.get<Avatar[]>('/videos/avatars'),

  generate: (moduleId: string, avatarId: string) =>
    apiClient.post<VideoStatus>('/videos/generate', { moduleId, avatarId }),

  getModuleVideo: (moduleId: string) =>
    apiClient.get<VideoStatus>(`/videos/module/${moduleId}`),
}