import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { courseApi } from '../lib/api/courses'
import { useGenerationStore } from '../store/generationStore'

export function useCourseGeneration() {
  const store = useGenerationStore()

  const generatePlanMutation = useMutation({
    mutationFn: (payload: { prompt: string, difficulty: string }) => courseApi.generatePlan(payload),
    // onSuccess: (res) => {
    //   store.setPlanId(res.data.id)
    //   store.setPlanSnapshot(res.data)
    //   store.setStep('review')
    //   toast.success('Course plan generated!')
    // },
    onSuccess: (res) => {
  const plan = res.data

  const normalizedPlan = {
    ...plan,
    modules: plan.modules?.map((m: any) => ({
      ...m,
      lessons: m.lessons ?? []
    })) ?? []
  }
  store.setPlanId(plan.id)
  store.setPlanSnapshot(normalizedPlan)
  store.setStep('review')

  toast.success('Course plan generated!')
},
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate plan. Try again.')
    },
  })

  const confirmPlanMutation = useMutation({
    mutationFn: (planId: string) => courseApi.confirmPlan(planId),
    onSuccess: (res) => {
      store.setJobId(res.data.jobId)
      store.setStep('generating')
      toast.success('Generation started!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to confirm plan.')
    },
  })

  const pollStatus = useQuery({
    queryKey: ['courses', 'status', store.jobId],
    queryFn: () => courseApi.getGenerationStatus(store.jobId!),
    enabled: !!store.jobId && store.step === 'generating',
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.data?.status === 'completed' || data?.data?.status === 'failed' ? false : 3000;
    },
    select: (res) => res.data,
  })

  useEffect(() => {
    if (pollStatus.data?.status === 'completed' && pollStatus.data.courseId) {
      store.setCourseId(pollStatus.data.courseId)
      store.setStep('complete')
      toast.success('Course ready!')
    } else if (pollStatus.data?.status === 'failed') {
      toast.error('Generation failed. Please try again.')
    }
  }, [pollStatus.data?.status, pollStatus.data?.courseId])

  return { generatePlanMutation, confirmPlanMutation, pollStatus, store }
}
