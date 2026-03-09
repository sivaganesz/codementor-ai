# Frontend Documentation — AI Course Generation Platform

## Overview

The frontend is a React + Vite single-page application that provides two core flows:
1. **Full Course Generation** — multi-step wizard to generate a full structured course
2. **Customized Topic Learning** — focused, on-demand topic deep-dives

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tooling & dev server |
| TanStack Router | File-based routing with type safety |
| TanStack Query v5 | Server state, caching, background refetch |
| Zustand | Local UI state (wizard steps, preferences) |
| Axios | HTTP client with interceptors |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component primitives |
| Remotion | In-browser video generation per module |
| React Hook Form + Zod | Forms with schema validation |
| Framer Motion | Page & component animations |
| Lucide React | Icon set |
| React Hot Toast | Notification toasts |

---

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/          # Shared UI: Button, Card, Badge, Spinner, etc.
│   │   ├── course/          # Course-specific components
│   │   │   ├── CoursePlanCard.tsx
│   │   │   ├── ModuleAccordion.tsx
│   │   │   ├── LessonView.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── ProgressTracker.tsx
│   │   ├── topic/           # Topic learning components
│   │   │   ├── TopicCard.tsx
│   │   │   ├── ExampleBlock.tsx
│   │   │   └── UseCasePanel.tsx
│   │   ├── generation/      # AI generation UI states
│   │   │   ├── GenerationLoader.tsx
│   │   │   ├── PlanReviewModal.tsx
│   │   │   └── StreamingText.tsx
│   │   └── layout/
│   │       ├── AppShell.tsx
│   │       ├── Sidebar.tsx
│   │       └── Topbar.tsx
│   ├── hooks/
│   │   ├── useCourseGeneration.ts
│   │   ├── useTopicLearning.ts
│   │   ├── useStreamingResponse.ts
│   │   └── useVideoGeneration.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts        # Axios instance
│   │   │   ├── courses.ts       # Course API calls
│   │   │   ├── topics.ts        # Topic API calls
│   │   │   └── videos.ts        # Video generation API calls
│   │   ├── query/
│   │   │   └── queryClient.ts   # TanStack Query client config
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── validators.ts
│   ├── remotion/
│   │   ├── compositions/
│   │   │   ├── ModuleIntro.tsx
│   │   │   ├── LessonSlide.tsx
│   │   │   └── CodeShowcase.tsx
│   │   └── Root.tsx
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx            # Landing / home
│   │   ├── generate/
│   │   │   ├── index.tsx        # Generation wizard entry
│   │   │   └── $courseId.tsx    # Course review & content view
│   │   ├── topics/
│   │   │   ├── index.tsx        # Topic browser
│   │   │   └── $topicId.tsx     # Individual topic view
│   │   └── my-courses/
│   │       └── index.tsx        # User course library
│   ├── store/
│   │   ├── generationStore.ts   # Wizard state (steps, inputs, plan)
│   │   └── uiStore.ts           # Sidebar, theme, modals
│   ├── types/
│   │   ├── course.ts
│   │   ├── topic.ts
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Routing (TanStack Router)

All routes are file-based using TanStack Router v1.

```
/                           Home — choose between Full Course or Topic Learning
/generate                   Step 1: Enter topic/goal for full course
/generate/$courseId         Step 2+: Review plan → Approve → View generated course
/topics                     Topic browser with search/filter
/topics/$topicId            Individual topic deep-dive page
/my-courses                 User's saved & completed courses
```

### Route Config (`src/routes/__root.tsx`)

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
```

---

## API Layer (`src/lib/api/`)

### Axios Client (`client.ts`)

```ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // e.g. http://localhost:3000/api
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // redirect to login
    }
    return Promise.reject(err)
  }
)
```

### Course API (`courses.ts`)

```ts
export const courseApi = {
  // Step 1: Generate a course plan (returns plan before full content)
  generatePlan: (payload: GeneratePlanDto) =>
    apiClient.post<CoursePlan>('/courses/generate-plan', payload),

  // Step 2: Confirm plan → triggers full course generation
  confirmPlan: (planId: string) =>
    apiClient.post<Course>(`/courses/${planId}/confirm`),

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
```

### Topic API (`topics.ts`)

```ts
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
```

---

## TanStack Query Configuration

### Query Client (`src/lib/query/queryClient.ts`)

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 30,         // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
```

### Query Keys Convention

```ts
// src/lib/query/queryKeys.ts
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    mine: () => [...queryKeys.courses.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.courses.all, id] as const,
    status: (jobId: string) => [...queryKeys.courses.all, 'status', jobId] as const,
    plan: (planId: string) => [...queryKeys.courses.all, 'plan', planId] as const,
  },
  topics: {
    all: ['topics'] as const,
    detail: (id: string) => [...queryKeys.topics.all, id] as const,
    search: (q: string) => [...queryKeys.topics.all, 'search', q] as const,
  },
}
```

### Key Hooks

```ts
// useCourseGeneration.ts
export function useCourseGeneration() {
  const { planId, setPlanId, setJobId } = useGenerationStore()

  const generatePlan = useMutation({
    mutationFn: courseApi.generatePlan,
    onSuccess: (data) => setPlanId(data.data.id),
  })

  const confirmPlan = useMutation({
    mutationFn: courseApi.confirmPlan,
    onSuccess: (data) => setJobId(data.data.jobId),
  })

  // Poll generation status every 3s while pending
  const status = useQuery({
    queryKey: queryKeys.courses.status(jobId ?? ''),
    queryFn: () => courseApi.getGenerationStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) =>
      query.state.data?.data.status === 'completed' ? false : 3000,
  })

  return { generatePlan, confirmPlan, status }
}
```

---

## Full Course Generation Flow (UI)

### Step Wizard

The wizard uses Zustand to track step state:

```
Step 1: Input Prompt
  └─ User types: "I want to learn React.js"
  └─ POST /courses/generate-plan

Step 2: Plan Review
  └─ Display generated plan (modules, lesson titles)
  └─ User can approve or regenerate
  └─ POST /courses/:planId/confirm → returns jobId

Step 3: Generation in Progress
  └─ Poll GET /courses/status/:jobId every 3s
  └─ Show animated progress with module names as they complete

Step 4: Course View
  └─ Full course rendered: modules → lessons → video per module
```

### Plan Review Modal (`PlanReviewModal.tsx`)

```tsx
function PlanReviewModal({ plan, onConfirm, onRegenerate }: Props) {
  return (
    <Dialog>
      <DialogHeader>
        <h2>{plan.title}</h2>
        <p>{plan.description}</p>
      </DialogHeader>

      <div className="space-y-4">
        {plan.modules.map((module, i) => (
          <div key={module.id} className="border rounded-lg p-4">
            <h3>Module {i + 1}: {module.title}</h3>
            <ul>
              {module.lessons.map(lesson => (
                <li key={lesson.id}>{lesson.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onRegenerate}>Regenerate Plan</Button>
        <Button onClick={() => onConfirm(plan.id)}>Looks Good — Generate Course</Button>
      </DialogFooter>
    </Dialog>
  )
}
```

---

## Customized Topic Learning Flow (UI)

Topic learning is simpler — single input → immediate streaming response.

### Topic Input Page (`/topics`)

```tsx
function TopicsPage() {
  const [input, setInput] = useState('')
  const generate = useMutation({ mutationFn: topicApi.generateTopic })

  return (
    <div>
      <h1>Learn Any Topic</h1>
      <p>Enter a specific concept you want to understand deeply.</p>

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. React State Management, Custom Hooks, TanStack Query..."
      />
      <Button onClick={() => generate.mutate({ topic: input })}>
        Generate Learning Content
      </Button>

      {/* Example suggestions */}
      <div className="flex gap-2 flex-wrap">
        {EXAMPLE_TOPICS.map(t => (
          <Badge
            key={t}
            className="cursor-pointer"
            onClick={() => setInput(t)}
          >
            {t}
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

### Topic Content View (`/topics/$topicId`)

Sections rendered for each topic:

1. **Concept Overview** — clear definition + when to use
2. **Real-World Examples** (1–3) — concrete, relatable scenarios
3. **Code Examples** — syntax-highlighted snippets
4. **When & Where** — use cases, anti-patterns
5. **Key Takeaways** — bullet summary

---

## Remotion Video Generation

Each main module gets a short explainer video generated via Remotion.

### Composition Structure (`src/remotion/`)

```tsx
// Root.tsx — registers all compositions
export const RemotionRoot = () => (
  <>
    <Composition
      id="ModuleIntro"
      component={ModuleIntroVideo}
      durationInFrames={150}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{ title: '', description: '', keyPoints: [] }}
    />
  </>
)
```

### Module Intro Video (`ModuleIntro.tsx`)

```tsx
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export function ModuleIntroVideo({ title, description, keyPoints }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = spring({ frame, fps, from: 0, to: 1 })

  return (
    <AbsoluteFill className="bg-gradient-to-br from-slate-900 to-indigo-900 flex flex-col items-center justify-center p-12">
      <h1 style={{ opacity: titleOpacity }} className="text-5xl font-bold text-white">
        {title}
      </h1>
      <p className="text-xl text-slate-300 mt-4">{description}</p>
      <ul className="mt-8 space-y-2">
        {keyPoints.map((point, i) => (
          <li key={i} style={{ opacity: spring({ frame: frame - i * 10, fps }) }}>
            {point}
          </li>
        ))}
      </ul>
    </AbsoluteFill>
  )
}
```

### Video Trigger Hook (`useVideoGeneration.ts`)

```ts
export function useVideoGeneration(moduleId: string) {
  return useMutation({
    mutationFn: () => videoApi.generateVideo(moduleId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.courses.detail(data.courseId),
        (old: Course) => mergeModuleVideo(old, moduleId, data.videoUrl)
      )
    },
  })
}
```

---

## State Management (Zustand)

### Generation Wizard Store (`generationStore.ts`)

```ts
interface GenerationStore {
  step: 'input' | 'review' | 'generating' | 'complete'
  prompt: string
  planId: string | null
  jobId: string | null
  courseId: string | null

  setStep: (step: GenerationStore['step']) => void
  setPrompt: (prompt: string) => void
  setPlanId: (id: string) => void
  setJobId: (id: string) => void
  setCourseId: (id: string) => void
  reset: () => void
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  step: 'input',
  prompt: '',
  planId: null,
  jobId: null,
  courseId: null,
  setStep: (step) => set({ step }),
  setPrompt: (prompt) => set({ prompt }),
  setPlanId: (planId) => set({ planId }),
  setJobId: (jobId) => set({ jobId }),
  setCourseId: (courseId) => set({ courseId }),
  reset: () => set({ step: 'input', prompt: '', planId: null, jobId: null, courseId: null }),
}))
```

---

## TypeScript Types (`src/types/`)

### `course.ts`

```ts
export interface CoursePlan {
  id: string
  title: string
  description: string
  estimatedHours: number
  modules: PlanModule[]
}

export interface PlanModule {
  id: string
  title: string
  description: string
  order: number
  lessons: PlanLesson[]
}

export interface PlanLesson {
  id: string
  title: string
  order: number
}

export interface Course extends CoursePlan {
  status: 'draft' | 'generating' | 'completed'
  createdAt: string
  modules: CourseModule[]
}

export interface CourseModule extends PlanModule {
  videoUrl?: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  content: string         // Markdown content
  codeExamples: CodeExample[]
  order: number
  estimatedMinutes: number
}

export interface CodeExample {
  language: string
  code: string
  description: string
}
```

### `topic.ts`

```ts
export interface GenerateTopicDto {
  topic: string
  preferredDepth?: 'beginner' | 'intermediate' | 'advanced'
}

export interface TopicContent {
  id: string
  topic: string
  overview: string
  realWorldExamples: RealWorldExample[]
  codeExamples: CodeExample[]
  whenToUse: string
  commonPitfalls: string[]
  keyTakeaways: string[]
  relatedTopics: string[]
  createdAt: string
}

export interface RealWorldExample {
  title: string
  scenario: string
  solution: string
  outcome: string
}
```

---

## Environment Variables

```env
# .env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_REMOTION_STUDIO_URL=http://localhost:3001
```

---

## Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Key Design Decisions

1. **Two-step course creation** — Plan first, confirm, then generate. Prevents wasted generation if the user doesn't like the structure.
2. **Polling over WebSocket for generation status** — Simpler to implement; TanStack Query's `refetchInterval` handles it cleanly.
3. **Remotion for video** — Videos are generated per module, not per lesson, to keep generation time reasonable.
4. **TanStack Router** — Provides type-safe params (`$courseId`, `$topicId`) and avoids React Router complexities.
5. **Zustand only for wizard/UI state** — All server state goes through TanStack Query. No mixing.
6. **Topic learning is stateless** — No multi-step wizard; single mutation, immediate result.

---

## API Contract Summary (Frontend → Backend)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/courses/generate-plan` | Generate course plan |
| POST | `/api/courses/:planId/confirm` | Confirm plan → start generation |
| GET | `/api/courses/status/:jobId` | Poll generation status |
| GET | `/api/courses/:courseId` | Get full course |
| GET | `/api/courses/me` | Get user courses |
| POST | `/api/topics/generate` | Generate topic content |
| GET | `/api/topics/:topicId` | Get saved topic |
| GET | `/api/topics/search` | Search topics |
| POST | `/api/videos/:moduleId/generate` | Trigger video generation |
| GET | `/api/videos/:moduleId` | Get video URL/status |
