import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { topicApi } from '../lib/api/topics'

export function useTopicLearning() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: topicApi.generateTopic,
    onSuccess: (res) => {
      toast.success('Topic ready!')
      navigate({ to: '/topics/$topicId', params: { topicId: res.data.id } })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate. Try again.')
    },
  })
}
