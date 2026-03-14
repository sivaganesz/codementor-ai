import { apiClient } from './client'

export const chatbotApi = {
  chat: (message: string, context?: string) =>
    apiClient.post<{ reply: string }>('/chatbot/chat', { message, context }),
}
