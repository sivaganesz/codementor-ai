You are an expert full-stack developer. Your task is to complete the **CodeMentor AI** project — an AI-powered course generation platform.

I have placed an `ANALYSIS.md` file in the root of this project. Read it carefully before doing anything. It contains:
- A full breakdown of every broken, incomplete, and missing piece of code
- The exact fixes required for the backend
- The exact pages and hooks to build for the frontend
- The UI design system to apply

---

## YOUR WORKING CONTEXT

You are currently in the **root of the monorepo**. The structure is:

```
codementor-ai/          ← you are here
├── ANALYSIS.md         ← READ THIS FIRST
├── frontend/           ← React + Vite app
│   └── src/
│       ├── routes/     ← TanStack Router pages (mostly placeholders)
│       ├── hooks/      ← MISSING — needs to be created
│       ├── store/      ← generationStore.ts exists, authStore.ts missing
│       ├── lib/api/    ← axios client + course/topic API methods (defined, never called)
│       ├── components/ ← only AppShell.tsx exists
│       └── main.tsx    ← missing <Toaster />
└── backend/            ← NestJS app
    └── src/
        ├── main.ts     ← missing CORS + global prefix
        ├── courses/    ← controller has route ordering bug
        ├── topics/     ← controller has route ordering bug
        ├── jobs/       ← incomplete fallback logic
        └── ai/         ← missing try/catch on JSON.parse
```

---

## STEP 1 — READ THE ANALYSIS FILE FIRST

Before writing any code, read `./ANALYSIS.md` completely. Pay special attention to:
- Section 2: Frontend issues (what's broken and what's missing)
- Section 3: Backend issues (critical bugs and missing pieces)
- Section 4: UI design requirements
- Section 5: The phased development plan with exact code snippets
- Section 6: Corrected file implementations

---

## STEP 2 — BACKEND FIXES (do these before touching the frontend)

Work inside the `backend/` directory.

### 2.1 Fix `backend/src/main.ts`
Add global API prefix and CORS:
```ts
app.setGlobalPrefix('api');
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

### 2.2 Fix `backend/src/courses/courses.controller.ts`
Reorder the GET routes so static routes come before parameterized ones:
```
@Get('me')           ← FIRST
@Get('status/:jobId') ← SECOND
@Get(':courseId')    ← LAST
```

### 2.3 Fix `backend/src/topics/topics.controller.ts`
Same fix — `@Get('search')` must come before `@Get(':topicId')`.

### 2.4 Fix `backend/src/jobs/jobs.service.ts`
When BullMQ returns null for a job (already cleaned after completion), fall back to querying the `courses` table by `jobId` column. Inject the Course repository and return `{ status: course.status, progress: 100 }` for completed courses.

### 2.5 Fix `backend/src/ai/ai.service.ts`
Wrap every `JSON.parse(result.response.text())` in a try/catch block. On failure, throw `InternalServerErrorException` with a descriptive message. Remove all `any` types — use proper interfaces or `unknown`.

### 2.6 Fix `backend/src/courses/course-generation.processor.ts`
Add a guard before the lesson loop:
```ts
if (!moduleContent?.lessons?.length) {
  throw new Error(`Module "${planModule.title}" returned no lessons from AI`);
}
```
Also add a `Logger` and log each module completion with `this.logger.log(...)`.

### 2.7 Add rate limiting
Install: `cd backend && npm install @nestjs/throttler`
Register `ThrottlerModule` in `app.module.ts` with `ttl: 60000, limit: 5`.
Apply `@Throttle()` decorator to `POST /courses/generate-plan` and `POST /topics/generate`.

### 2.8 Add JWT guard to `GET /courses/status/:jobId`
This route is currently unguarded. Add `@UseGuards(JwtAuthGuard)`.

---

## STEP 3 — INSTALL MISSING FRONTEND PACKAGES

```bash
cd frontend
npm install react-markdown react-syntax-highlighter @types/react-syntax-highlighter
```

---

## STEP 4 — FRONTEND: GLOBAL SETUP

### 4.1 Fix `frontend/src/main.tsx`
Add `<Toaster />` from `react-hot-toast`:
```tsx
import { Toaster } from 'react-hot-toast'
// Inside render, after <RouterProvider />:
<Toaster position="top-right" toastOptions={{ style: { background: '#12121A', color: '#F0EFFF', border: '1px solid #6C3BFF' } }} />
```

### 4.2 Add Google Fonts to `frontend/index.html`
Add inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap" rel="stylesheet">
```

### 4.3 Update `frontend/tailwind.config.ts`
Add custom fonts and brand colors to the Tailwind config:
```ts
theme: {
  extend: {
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      body: ['DM Sans', 'sans-serif'],
    },
    colors: {
      brand: {
        primary: '#6C3BFF',
        secondary: '#00D4AA',
        cta: '#FF6B35',
      },
      surface: {
        1: '#0A0A0F',
        2: '#12121A',
        3: '#1C1C2E',
      },
    },
  },
}
```

### 4.4 Update `frontend/src/index.css`
Set the dark theme as default:
```css
body {
  background-color: #0A0A0F;
  color: #F0EFFF;
  font-family: 'DM Sans', sans-serif;
}
```

---

## STEP 5 — FRONTEND: CREATE AUTH STORE

Create `frontend/src/store/authStore.ts`:
```ts
import { create } from 'zustand'

interface AuthUser { id: string; email: string }
interface AuthStore {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('access_token', token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null, user: null })
  },
  isAuthenticated: () => !!get().token,
}))
```

---

## STEP 6 — FRONTEND: CREATE HOOKS

### 6.1 Create `frontend/src/hooks/useCourseGeneration.ts`
This hook manages the full 4-step course generation wizard:
- `generatePlanMutation`: calls `courseApi.generatePlan`, on success saves planId to store and sets step to `'review'`
- `confirmPlanMutation`: calls `courseApi.confirmPlan`, on success saves jobId and sets step to `'generating'`
- `pollStatus`: `useQuery` that calls `courseApi.getGenerationStatus(jobId)` every 3 seconds, stops when `status === 'completed'`, auto-sets step to `'complete'` and saves courseId
- Export all three plus the store state

### 6.2 Create `frontend/src/hooks/useTopicLearning.ts`
- Single `useMutation` calling `topicApi.generateTopic`
- `onSuccess`: show `toast.success('Topic ready!')`, navigate to `/topics/${data.id}`
- `onError`: show `toast.error('Failed to generate. Try again.')`
- Export `{ mutate, isPending }`

---

## STEP 7 — FRONTEND: CREATE AUTH PAGES

### 7.1 Create `frontend/src/routes/auth/login.tsx`
- Route path: `/login`
- Controlled form with email + password fields using `useState`
- On submit: call `POST /auth/login`, save token via `authStore.setAuth()`, navigate to `/`
- Link to `/register`
- Design: centered card on dark background, brand gradient title, glowing input focus states

### 7.2 Create `frontend/src/routes/auth/register.tsx`
- Route path: `/register`
- Same as login but calls `POST /auth/register`
- Fields: email, password, confirm password (validate match with Zod)
- Link to `/login`

---

## STEP 8 — FRONTEND: REDESIGN THE APP SHELL

### 8.1 Rewrite `frontend/src/components/layout/AppShell.tsx`
Design: frosted glass navbar on dark background.
- Backdrop blur header: `backdrop-blur-xl bg-surface-2/80 border-b border-white/5`
- Logo: stylized "CM" icon mark in brand violet + "CodeMentor AI" text in Syne font
- Nav links with active state: animated underline using Framer Motion `layoutId`
- Right side: if authenticated show user avatar + logout button; if not show Login/Register links
- Main content area: `bg-surface-1 min-h-screen`
- Footer: minimal, dark, brand accent border

---

## STEP 9 — FRONTEND: REDESIGN HOMEPAGE

Completely rewrite `frontend/src/routes/index.tsx`.

Design: dark hero with animated gradient mesh background.

Structure:
1. **Hero section**: Large Syne font headline "Learn Any Technology, Your Way" with gradient text (`from-brand-primary to-brand-secondary`). Subtitle in DM Sans. Two CTA buttons: "Generate Full Course" (filled, coral) + "Explore Topics" (outlined, violet).

2. **Feature cards** (2 cards side by side): Glassmorphism style — `bg-white/5 backdrop-blur border border-white/10 rounded-2xl`. Each card has a glowing icon, title, description, and "Get Started →" link. Hover: lift shadow + border glow.

3. **Tech badges strip**: Horizontally scrolling row of frosted-glass pill badges: "React 19", "NestJS", "Gemini AI", "PostgreSQL", "BullMQ", etc.

4. **Background**: Radial gradient blobs in violet and teal, positioned absolutely behind the hero content. Use CSS `filter: blur(80px)` on colored divs for the ambient glow effect.

---

## STEP 10 — FRONTEND: COMPLETE GENERATE WIZARD PAGE

Completely rewrite `frontend/src/routes/generate/index.tsx` as a 4-step wizard.

Use `useGenerationStore` for step state and `useCourseGeneration` hook for API calls.

### Step 1 — Input (`step === 'input'`)
- Large textarea for the learning goal
- Character counter (max 500)
- Difficulty level selector: Beginner / Intermediate / Advanced (pill toggles)
- Example prompt chips: "Master React.js", "Learn NestJS from scratch", "TypeScript for beginners", "Next.js full-stack development"
- Submit button: "Generate Course Plan →" — calls `generatePlanMutation.mutate(prompt)`
- Loading state: button shows spinner + "Generating plan..."

### Step 2 — Review (`step === 'review'`)
- Show the generated plan from `planSnapshot` stored in `generationStore`
- Course title and description at top
- Module list: each module card shows title, description, and collapsed lesson titles
- Two buttons: "Looks Good — Build This Course" (calls `confirmPlanMutation`) + "← Regenerate Plan"
- Animate cards in with staggered Framer Motion `fadeInUp`

### Step 3 — Generating (`step === 'generating'`)
- Full-width animated progress bar using `pollStatus.data.progress` (0–100)
- Pulsing gradient orb animation (CSS keyframes, violet/teal colors)
- Text: "Building your course..." then module names as they complete
- Show completed module count: "3 of 6 modules complete"

### Step 4 — Complete (`step === 'complete'`)
- Success checkmark animation (Framer Motion scale-in)
- Course title displayed
- "View Your Course →" button → navigate to `/generate/${courseId}`
- "Generate Another Course" link → calls `store.reset()`

Add a step dots indicator at the top that shows current step (4 dots, filled/empty).

---

## STEP 11 — FRONTEND: COMPLETE COURSE VIEW PAGE

Completely rewrite `frontend/src/routes/generate/$courseId.tsx`.

```ts
const { courseId } = Route.useParams()
const { data: course, isLoading } = useQuery({
  queryKey: ['courses', courseId],
  queryFn: () => courseApi.getCourse(courseId).then(r => r.data),
})
```

Layout:
1. **Course header**: gradient banner with title, description, status badge (color-coded), estimated hours, total modules count
2. **Sidebar or top tabs**: module list navigation
3. **Module accordion**: each module expands to show lessons list
4. **Lesson view**: clicking a lesson shows its content in a reading panel:
   - Title as heading
   - Markdown rendered via `react-markdown` with custom component overrides
   - Code blocks rendered via `react-syntax-highlighter` using `vscDarkPlus` theme
   - Copy button on each code block
5. **Video section** per module: if `videoUrl` exists show a `<video>` player, else show "Generate Video" button

Handle: loading skeleton, error state, empty modules state.

---

## STEP 12 — FRONTEND: COMPLETE TOPICS PAGES

### 12.1 Rewrite `frontend/src/routes/topics/index.tsx`
- Controlled `input` with `useState`
- On submit: call `useTopicLearning().mutate({ topic: input })`
- Depth selector: Beginner / Intermediate / Advanced
- Example topic chips: "React State Management", "Custom Hooks", "TanStack Query", "TypeScript Generics", "React + TanStack Query", "NestJS Guards"
- Recent topics section: `useQuery` to `topicApi.searchTopics('')` showing last 6 topics as clickable cards
- Loading state: full-width skeleton or spinner overlay

### 12.2 Rewrite `frontend/src/routes/topics/$topicId.tsx`
```ts
const { topicId } = Route.useParams()
const { data: topic } = useQuery({
  queryKey: ['topics', topicId],
  queryFn: () => topicApi.getTopic(topicId).then(r => r.data),
})
```

Sections (render in this order):
1. **Hero**: topic name in large Syne font + overview paragraph
2. **Real-World Examples** (1–3 cards): each card has colored left border, scenario → solution → outcome flow. Use `#6C3BFF`, `#00D4AA`, `#FF6B35` for borders rotating by index.
3. **Code Examples**: tabbed if multiple languages, each tab shows `SyntaxHighlighter` with `vscDarkPlus` + language badge + copy button
4. **When & Where**: callout box with violet left border + icon
5. **Common Pitfalls**: warning cards with red/orange accent
6. **Key Takeaways**: checkmark list with teal accent
7. **Related Topics**: clickable chip pills — clicking one navigates to `/topics?prefill=<topic>`

---

## STEP 13 — FRONTEND: COMPLETE MY COURSES PAGE

Rewrite `frontend/src/routes/my-courses/index.tsx`:
```ts
const { data: courses, isLoading } = useQuery({
  queryKey: ['courses', 'me'],
  queryFn: () => courseApi.listMyCourses().then(r => r.data),
})
```

**CourseCard component** (create in `src/components/course/CourseCard.tsx`):
- Dark card with `bg-surface-2 border border-white/5 rounded-2xl`
- Status badge: `draft` (gray), `generating` (yellow pulsing), `completed` (teal), `failed` (red)
- Title in Syne font, description truncated to 2 lines
- Footer: estimated hours + module count + "View Course →" link

**Empty state**: centered illustration (use SVG inline or emoji art), heading "No courses yet", subtext, CTA button to `/generate`.

**Loading state**: grid of 3 skeleton cards (`animate-pulse`).

---

## STEP 14 — PROTECT ROUTES

In `frontend/src/routes/__root.tsx` or in each protected route's `beforeLoad`:
```ts
beforeLoad: ({ location }) => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}
```
Apply this to: `/generate`, `/generate/$courseId`, `/topics`, `/topics/$topicId`, `/my-courses`.

---

## CODING RULES — FOLLOW THESE EXACTLY

1. **TypeScript only** — no `any` types unless absolutely unavoidable with a comment explaining why
2. **Server state = TanStack Query** — never use `useState` for data that comes from an API
3. **UI state = Zustand or local useState** — wizard steps, form inputs, toggles
4. **Every page must handle three states**: loading (skeleton), error (retry button), success (content)
5. **All mutations must have** `onSuccess` with `toast.success()` and `onError` with `toast.error()`
6. **No inline styles** — use Tailwind utility classes only
7. **All components fully typed** — define Props interfaces for every component
8. **File naming**: components in PascalCase, hooks in camelCase with `use` prefix, utils in camelCase
9. **Import order**: React → third-party → internal (`@/`) → relative
10. **Do not touch** `src/routeTree.gen.ts` — it is auto-generated by the TanStack Router Vite plugin

---

## EXECUTION ORDER

Follow this exact order to avoid dependency issues:

1. Read `ANALYSIS.md` fully
2. Backend fixes (Steps 2) — fix bugs before building features
3. Frontend global setup (Steps 3–4) — fonts, colors, toaster
4. Auth store (Step 5)
5. Hooks (Step 6)
6. Auth pages (Step 7)
7. App Shell redesign (Step 8)
8. Homepage redesign (Step 9)
9. Generate wizard (Step 10)
10. Course view (Step 11)
11. Topics pages (Step 12)
12. My Courses page (Step 13)
13. Route protection (Step 14)
14. Final: run `cd frontend && npm run build` to catch any TypeScript errors and fix them

After completing all steps, summarize:
- What files were created
- What files were modified
- Any issues encountered and how they were resolved
- Any assumptions made where the instructions were ambiguous
