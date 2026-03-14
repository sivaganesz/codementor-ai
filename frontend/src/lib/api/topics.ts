import { apiClient } from './client'
import type { TopicContent, GenerateTopicDto, TopicSummary } from '../../types/topic'

// normalize topic: backend returns topicName but frontend expects name
function normalizeTopic(t: any): TopicContent {
  return { ...t, name: t.name ?? t.topicName ?? '' }
}
function normalizeTopics(arr: any[]): TopicSummary[] {
  return (arr || []).map(t => ({ ...t, name: t.name ?? t.topicName ?? '' }))
}

export const topicApi = {
  generateTopic: async (payload: GenerateTopicDto) => {
    const res = await apiClient.post<TopicContent>('/topics/generate', payload)
    return { ...res, data: normalizeTopic(res.data) }
  },

  getTopic: async (topicId: string) => {
    const res = await apiClient.get<TopicContent>(`/topics/${topicId}`)
    return { ...res, data: normalizeTopic(res.data) }
  },

  searchTopics: async (query: string) => {
    const res = await apiClient.get<TopicSummary[]>(`/topics/search?q=${encodeURIComponent(query)}`)
    return { ...res, data: normalizeTopics(res.data) }
  },
}
