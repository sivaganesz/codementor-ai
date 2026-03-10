import { apiClient } from './client'
import { TopicContent, GenerateTopicDto, TopicSummary } from '../../types/topic'

export const topicApi = {
  // Generate a focused topic deep-dive
  generateTopic: (payload: GenerateTopicDto) =>
    apiClient.post<TopicContent>('/topics/generate', payload),

  // Get saved topic content
  getTopic: (topicId: string) =>
    apiClient.get<TopicContent>(`/topics/${topicId}`),

  // Browse/search topics
  searchTopics: (query: string) =>
    apiClient.get<TopicSummary[]>(`/topics/search?q=${query}`),
}
