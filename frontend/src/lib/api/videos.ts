import { apiClient } from './client'

export interface VideoScriptData {
  moduleId: string
  script: string
  status: string
}

export const videoApi = {
  generateScript: (moduleId: string) =>
    apiClient.post<VideoScriptData>(`/videos/module/${moduleId}/generate`),

  getScript: (moduleId: string) =>
    apiClient.get<VideoScriptData>(`/videos/module/${moduleId}/script`),

  getStatus: (moduleId: string) =>
    apiClient.get<{ moduleId: string; videoStatus: string }>(
      `/videos/module/${moduleId}/status`,
    ),
}