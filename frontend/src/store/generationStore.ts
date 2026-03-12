import { create } from 'zustand'
import type { CoursePlan } from '../types/course'

interface GenerationStore {
  step: 'input' | 'review' | 'generating' | 'complete'
  prompt: string
  planId: string | null
  jobId: string | null
  courseId: string | null
  planSnapshot: CoursePlan | null

  setStep: (step: GenerationStore['step']) => void
  setPrompt: (prompt: string) => void
  setPlanId: (id: string) => void
  setJobId: (id: string) => void
  setCourseId: (id: string) => void
  setPlanSnapshot: (plan: CoursePlan) => void
  reset: () => void
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  step: 'input',
  prompt: '',
  planId: null,
  jobId: null,
  courseId: null,
  planSnapshot: null,
  setStep: (step) => set({ step }),
  setPrompt: (prompt) => set({ prompt }),
  setPlanId: (planId) => set({ planId }),
  setJobId: (jobId) => set({ jobId }),
  setCourseId: (courseId) => set({ courseId }),
  setPlanSnapshot: (planSnapshot) => set({ planSnapshot }),
  reset: () => set({ step: 'input', prompt: '', planId: null, jobId: null, courseId: null, planSnapshot: null }),
}))

