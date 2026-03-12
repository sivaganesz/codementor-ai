# CodeMentor AI — Full Codebase Analysis & Development Plan

---

## 1. CURRENT STATE SUMMARY

The project has a **solid skeleton** — the architecture, folder structure, routing, and API contracts are correctly set up. However, the majority of the UI pages are **placeholders with no real functionality**. The backend services are **logically correct but missing critical wiring**. Below is a detailed breakdown.

---

## 2. ISSUES FOUND — FRONTEND

### 🔴 CRITICAL (Broken / Non-functional)

| File | Issue |
|---|---|
| `src/App.tsx` | Still the default Vite boilerplate (counter button, React logo). Never used since TanStack Router handles routing, but it's misleading. |
| `src/routes/generate/index.tsx` | Textarea has no state, no `onChange`, no form submission. The "Generate Plan" button does nothing — no API call, no mutation, no navigation. |
| `src/routes/generate/$courseId.tsx` | Entirely a placeholder — just shows the `courseId` param. No API fetch, no course display, no modules/lessons rendering. |
| `src/routes/topics/index.tsx` | Input has no state, no `onChange`. "Search" button does nothing. No `useMutation` for topic generation. |
| `src/routes/topics/$topicId.tsx` | Placeholder only. No API call, no content rendering (no overview, examples, code blocks, takeaways). |
| `src/routes/my-courses/index.tsx` | Static "No courses generated yet." text. No `useQuery` to fetch actual courses. No course cards. |

### 🟡 INCOMPLETE (Wired but missing logic)

| File | Issue |
|---|---|
| `src/store/generationStore.ts` | Store is defined but **never used** in any route component. |
| `src/lib/api/client.ts` | Redirects to `/login` on 401 but there is **no `/login` route** in the app. |
| `src/lib/api/courses.ts` | API methods are defined correctly but **never called** anywhere in the UI. |
| `src/lib/api/topics.ts` | API methods defined but **never called**. |
| `src/main.tsx` | Missing `@tanstack/react-query`'s `ReactQueryDevtools` (optional but useful). |
| `src/routeTree.gen.ts` | Auto-generated — needs regeneration after adding new routes (auth routes). |

### 🟠 MISSING ENTIRELY

| What's Missing | Why It's Needed |
|---|---|
| Auth pages (`/login`, `/register`) | `client.ts` redirects to `/login` on 401, but the page doesn't exist |
| Auth store / context | No way to store or read the JWT token beyond raw `localStorage` |
| `useCourseGeneration` hook | The generation wizard needs a central hook with mutation + polling logic |
| `useTopicLearning` hook | Topic generation needs mutation + redirect to result page |
| Plan Review step (UI) | The 4-step wizard has no Step 2 (review plan before confirming) |
| Generation progress UI | No animated progress screen while course is being built |
| Course content renderer | No component to render modules, lessons, markdown content, or code examples |
| Topic content renderer | No component for overview, real-world examples, code blocks, takeaways |
| Syntax highlighting | Code examples will be raw text without a highlighter (e.g. `react-syntax-highlighter`) |
| Markdown renderer | Lesson content is stored as Markdown — needs `react-markdown` to render |
| Error states | No error boundaries, no empty states, no retry UI anywhere |
| Loading skeletons | No skeleton loaders — UI just hangs during API calls |
| Toast notifications | `react-hot-toast` is installed but never initialized or used |
| `<Toaster />` in root | `react-hot-toast` needs `<Toaster />` mounted in the root |

---

## 3. ISSUES FOUND — BACKEND

### 🔴 CRITICAL

| File | Issue |
|---|---|
| `videos.service.ts` | `generateForModule()` creates a Video record with `status: 'generating'` but **never actually generates anything**. No Remotion process, no queue job, no URL — it's a permanent placeholder. |
| `courses.service.ts` | `getJobStatus()` queries the DB for `jobId`, but `jobs.service.ts` queries **BullMQ queue** for the same job. These are two separate implementations and the controller uses the wrong one — `CoursesService.getJobStatus` (DB-only), not `JobsService.getStatus` (BullMQ). The frontend will get stale DB status instead of live queue progress. |
| `jobs.service.ts` | `getStatus()` throws 404 if BullMQ has already cleaned the job (jobs are removed from queue after completion). Needs to fall back to DB status. |
| `course-generation.processor.ts` | `generateModuleContent()` returns a structured AI response, but the processor assumes `moduleContent.lessons` always exists. If the AI returns unexpected JSON, this crashes silently and marks course as `failed` with no useful error logged. |

### 🟡 INCOMPLETE

| File | Issue |
|---|---|
| `ai.service.ts` | Uses `any` type for the model and all return types. No error handling around `JSON.parse(result.response.text())` — will throw unhandled exceptions if Gemini returns malformed JSON. |
| `auth.service.ts` | `generateToken()` uses `any` type for user. No refresh token logic. JWT never expires gracefully on the frontend. |
| `courses.controller.ts` | `GET /courses/me` is defined **before** `GET /courses/:courseId`, which causes a route conflict in Express — `me` gets matched as a `:courseId` param. Must reorder or prefix. |
| `course-generation.service.ts` | No validation that `planSnapshot.modules` exists before queuing the job. If AI returns a malformed plan and user confirms it, the processor crashes. |
| `main.ts` | CORS is not configured. Frontend at `localhost:5173` will be blocked by browser CORS policy when calling `localhost:3000`. |
| `topics.controller.ts` | `GET /topics/search` must come before `GET /topics/:topicId` — same route conflict issue as courses. |

### 🟠 MISSING ENTIRELY

| What's Missing | Why It's Needed |
|---|---|
| CORS configuration | Without it, the browser blocks all frontend API calls |
| Rate limiting | AI calls are expensive — no rate limiting means users can spam generation |
| `course-content.prompt.ts` | File is referenced in `ai.service.ts` but its content isn't complete enough to guarantee structured lesson content |
| Auth guard on `GET /courses/status/:jobId` | Currently unguarded — anyone can poll job status |
| Input sanitization | User prompts go directly to Gemini with no sanitization or length check |
| Proper error logging | `catch (err)` in the processor only rethrows — no structured logging of what failed |
| API prefix | No global `/api` prefix configured in `main.ts` — frontend's `baseURL: '/api'` won't match |

---

## 4. UI DESIGN ISSUES

The current design is **functional but generic** — plain white cards, standard indigo/slate Tailwind palette, no visual identity. Here's what needs to improve:

| Issue | Fix |
|---|---|
| Bland homepage — two flat white cards | Redesign with gradient backgrounds, animated hero, glassmorphism cards |
| No dark/light theme | Add theme toggle with CSS variables |
| Generic indigo color scheme | Introduce a signature color palette with a primary brand color |
| No page transitions | Add Framer Motion page enter/exit animations |
| Navbar has no visual weight | Redesign with blur backdrop, logo icon, user avatar |
| No visual feedback on AI generation | Add animated progress bar, module-by-module reveal, pulsing AI indicators |
| Code examples will render as plain text | Add syntax-highlighted code blocks with copy button |
| No empty state illustrations | Add illustrated empty states for library, topics, errors |
| Typography is default Tailwind | Add custom Google Font pair for brand identity |

---

## 5. COMPLETE DEVELOPMENT PLAN

### Phase 1 — Fix Critical Backend Issues (Day 1)

**1.1 Add CORS and global API prefix to `main.ts`**
```ts
app.setGlobalPrefix('api');
app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' });
```

**1.2 Fix route ordering in `courses.controller.ts`**
Move `@Get('me')` ABOVE `@Get(':courseId')` to prevent route conflict.

**1.3 Fix route ordering in `topics.controller.ts`**
Move `@Get('search')` ABOVE `@Get(':topicId')`.

**1.4 Unify job status endpoint**
Replace `CoursesService.getJobStatus` with `JobsService.getStatus` in the controller. Update `JobsService` to fall back to DB if BullMQ job is already cleaned.

```ts
async getStatus(jobId: string) {
  const job = await this.queue.getJob(jobId);
  if (job) {
    const state = await job.getState();
    return { jobId, status: this.mapJobState(state), progress: job.progress || 0 };
  }
  // Job cleaned from queue — fall back to DB
  const course = await this.courseRepo.findOne({ where: { jobId } });
  if (!course) throw new NotFoundException('Job not found');
  return { jobId, status: course.status, progress: course.status === 'completed' ? 100 : 0 };
}
```

**1.5 Add try/catch + JSON validation to `ai.service.ts`**
```ts
async generateCoursePlan(prompt: string): Promise<any> {
  try {
    const result = await this.model.generateContent(...);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    throw new InternalServerErrorException(`AI generation failed: ${err.message}`);
  }
}
```

**1.6 Add AI rate limiting**
Install `@nestjs/throttler` and apply to AI-calling endpoints:
```ts
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('generate-plan')
```

---

### Phase 2 — Complete the Generation Flow (Day 2–3)

**2.1 Create `useCourseGeneration` hook**

```ts
// src/hooks/useCourseGeneration.ts
export function useCourseGeneration() {
  const store = useGenerationStore();

  const generatePlan = useMutation({
    mutationFn: (prompt: string) => courseApi.generatePlan({ prompt }),
    onSuccess: (res) => {
      store.setPlanId(res.data.id);
      store.setStep('review');
    },
    onError: () => toast.error('Failed to generate plan. Try again.'),
  });

  const confirmPlan = useMutation({
    mutationFn: (planId: string) => courseApi.confirmPlan(planId),
    onSuccess: (res) => {
      store.setJobId(res.data.jobId);
      store.setStep('generating');
    },
  });

  const pollStatus = useQuery({
    queryKey: ['courses', 'status', store.jobId],
    queryFn: () => courseApi.getGenerationStatus(store.jobId!),
    enabled: !!store.jobId && store.step === 'generating',
    refetchInterval: (query) =>
      query.state.data?.data.status === 'completed' ? false : 3000,
    select: (res) => res.data,
  });

  // Auto-advance to complete when done
  useEffect(() => {
    if (pollStatus.data?.status === 'completed') {
      store.setStep('complete');
    }
  }, [pollStatus.data?.status]);

  return { generatePlan, confirmPlan, pollStatus, store };
}
```

**2.2 Rebuild `/generate` route as a proper 4-step wizard**

Step components to create:
- `StepInput` — textarea with character count, example prompts, level selector
- `StepReview` — plan card with module list, approve/regenerate buttons
- `StepGenerating` — animated progress bar, live module names being built
- `StepComplete` — success state, "View Course" CTA button

**2.3 Build the Course View page (`/generate/$courseId`)**

Components needed:
- `CourseHeader` — title, description, estimated hours, progress badge
- `ModuleAccordion` — expandable module with lesson list
- `LessonView` — markdown content rendered with `react-markdown`
- `CodeBlock` — syntax highlighted code with copy button using `react-syntax-highlighter`
- `VideoSection` — module video player / generate video button

**2.4 Create `useTopicLearning` hook**

```ts
export function useTopicLearning() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: topicApi.generateTopic,
    onSuccess: (res) => {
      toast.success('Topic content ready!');
      navigate({ to: '/topics/$topicId', params: { topicId: res.data.id } });
    },
    onError: () => toast.error('Failed to generate topic content.'),
  });
}
```

**2.5 Build Topic Content Page (`/topics/$topicId`)**

Sections:
- `TopicOverview` — hero section with topic name + overview text
- `RealWorldExamples` — 1–3 scenario cards (scenario → solution → outcome)
- `CodeExamples` — tabbed or stacked syntax highlighted code blocks
- `WhenToUse` — call-out box with use case text
- `CommonPitfalls` — warning cards
- `KeyTakeaways` — checkmark list
- `RelatedTopics` — clickable chips that pre-fill the topic input

---

### Phase 3 — Auth Flow (Day 3–4)

**3.1 Create `/login` and `/register` routes**

Both need:
- React Hook Form + Zod validation
- `useMutation` calling auth API
- On success: store JWT in localStorage, navigate to `/`
- Link between login ↔ register

**3.2 Create auth store**

```ts
// src/store/authStore.ts
interface AuthStore {
  token: string | null;
  user: { id: string; email: string } | null;
  setAuth: (token: string, user: AuthStore['user']) => void;
  logout: () => void;
}
```

**3.3 Add auth redirect guards to routes**

Protect `/generate`, `/topics`, `/my-courses` — redirect to `/login` if no token.

**3.4 Add user avatar + logout to navbar**

---

### Phase 4 — My Library Page (Day 4)

**4.1 Fetch and display user courses**
```ts
const { data: courses, isLoading } = useQuery({
  queryKey: ['courses', 'me'],
  queryFn: () => courseApi.listMyCourses().then(r => r.data),
});
```

**4.2 Build CourseCard component**
- Title, description, status badge (draft / generating / completed)
- Estimated hours, number of modules
- "Continue Learning" / "View" CTA

**4.3 Add empty state**
Illustrated empty state with CTA to generate first course.

---

### Phase 5 — UI Design Overhaul (Day 5–6)

**5.1 Color System**

Replace generic indigo with a distinctive brand palette:
```css
:root {
  --brand-primary: #6C3BFF;    /* electric violet */
  --brand-secondary: #00D4AA;  /* cyan-teal accent */
  --brand-warm: #FF6B35;       /* coral for CTAs */
  --surface-1: #0A0A0F;        /* near-black bg */
  --surface-2: #12121A;        /* card bg */
  --surface-3: #1C1C2E;        /* elevated surface */
  --text-primary: #F0EFFF;
  --text-muted: #8B89A8;
}
```

**5.2 Typography**

Add to `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

- Display/headings: `Syne` (bold, geometric, modern)
- Body: `DM Sans` (clean, readable)

**5.3 Homepage Redesign**

- Dark hero with animated gradient mesh background
- Large typographic headline with gradient text
- Two feature cards with glassmorphism effect
- Floating tech badge strip (React, NestJS, Gemini, etc.)
- Animated particle or grid background

**5.4 Navbar Redesign**

- Frosted glass with `backdrop-blur`
- CodeMentor AI logo with icon mark
- Active route indicator with animated underline
- User avatar with dropdown (profile, logout)

**5.5 Generation Wizard UI**

- Step indicator with progress dots
- Animated transitions between steps (Framer Motion `AnimatePresence`)
- AI "thinking" animation during generation (pulsing orb or typewriter)
- Module cards reveal one-by-one as they complete

**5.6 Topic Page UI**

- Colorful section headers with icon badges
- Code blocks with dark theme + language tag + copy button
- Real-world example cards with colored left border per category
- "Related Topics" as interactive pill chips

---

### Phase 6 — Package Additions Needed

**Frontend**
```bash
npm install react-markdown react-syntax-highlighter @types/react-syntax-highlighter
npm install @tanstack/react-query-devtools
```

**Backend**
```bash
npm install @nestjs/throttler
```

---

## 6. CORRECTED FILE IMPLEMENTATIONS

### `backend/src/main.ts` — Add CORS + global prefix
```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  // ... swagger setup
  await app.listen(process.env.PORT || 3000);
}
```

### `backend/src/courses/courses.controller.ts` — Fix route order
```ts
@Get('me')         // ← MUST be first
getMyCourses() {}

@Get('status/:jobId')
getStatus() {}

@Get(':courseId')  // ← MUST be last
getCourse() {}
```

### `frontend/src/main.tsx` — Add Toaster
```tsx
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

---

## 7. FULL COMPLETION PROMPT

Use the following prompt when working with an AI assistant to complete this project:

---

```
You are completing the CodeMentor AI project — an AI-powered course generation platform.

TECH STACK:
- Frontend: React 19 + Vite + TanStack Router + TanStack Query + Zustand + Tailwind CSS + Framer Motion
- Backend: NestJS + TypeORM + PostgreSQL + BullMQ + Redis + Google Gemini AI

PROJECT STRUCTURE:
- frontend/ — Vite React app
- backend/ — NestJS app

WHAT EXISTS (already built):
- Backend: All entities, services, controllers, AI service with Gemini, BullMQ processor, auth with JWT
- Frontend: TanStack Router setup, API client (axios), queryClient, Zustand store, type definitions, AppShell layout
- Routes exist for: /, /generate, /generate/$courseId, /topics, /topics/$topicId, /my-courses

WHAT NEEDS TO BE BUILT:

=== BACKEND FIXES (do these first) ===
1. Add to main.ts: app.setGlobalPrefix('api') and app.enableCors({ origin: 'http://localhost:5173' })
2. In courses.controller.ts: move @Get('me') and @Get('status/:jobId') ABOVE @Get(':courseId') to fix route conflicts
3. In topics.controller.ts: move @Get('search') ABOVE @Get(':topicId')
4. Fix jobs.service.ts: if BullMQ job not found, fall back to querying course table by jobId
5. Wrap all ai.service.ts calls in try/catch and throw InternalServerErrorException on JSON.parse failure
6. Add @nestjs/throttler: limit /courses/generate-plan and /topics/generate to 5 req/min per user

=== FRONTEND — NEW FILES TO CREATE ===

1. src/hooks/useCourseGeneration.ts
   - useMutation for generatePlan → sets planId + step='review' in store
   - useMutation for confirmPlan → sets jobId + step='generating'
   - useQuery polling getGenerationStatus every 3s while step='generating'
   - Auto-advance to step='complete' when status===completed

2. src/hooks/useTopicLearning.ts
   - useMutation for topicApi.generateTopic
   - On success: navigate to /topics/$topicId with the returned id

3. src/routes/auth/login.tsx and register.tsx
   - React Hook Form + Zod validation
   - On success: save token to localStorage, navigate to /

4. src/store/authStore.ts (Zustand)
   - token, user, setAuth(), logout()

=== FRONTEND — PAGES TO COMPLETE ===

5. src/routes/generate/index.tsx — Full 4-step wizard:
   - Step 1 (input): textarea with onChange, example prompts as chips, level selector, submit button using useCourseGeneration
   - Step 2 (review): display planSnapshot modules and lessons, Approve/Regenerate buttons
   - Step 3 (generating): animated progress bar using pollStatus.data.progress, show module names
   - Step 4 (complete): success card with "View Course" button → navigate to /generate/$courseId

6. src/routes/generate/$courseId.tsx — Full course view:
   - useQuery to fetch course by id
   - Course header with title, description, estimated hours, status badge
   - Accordion per module showing all lessons
   - Lesson view with react-markdown for content, react-syntax-highlighter for code
   - Video section per module (generate video button)

7. src/routes/topics/index.tsx — Topic input page:
   - Controlled input with useState
   - useTopicLearning mutation on submit
   - Example topic chips that pre-fill input
   - Loading state while generating

8. src/routes/topics/$topicId.tsx — Topic content page:
   - useQuery to fetch topic by id
   - Overview section
   - RealWorldExamples (1-3 scenario cards)
   - CodeExamples with react-syntax-highlighter (dark theme, copy button)
   - WhenToUse callout
   - CommonPitfalls warning list
   - KeyTakeaways checkmark list
   - RelatedTopics clickable chips

9. src/routes/my-courses/index.tsx — Library page:
   - useQuery listMyCourses
   - CourseCard component with title, status badge, hours, module count
   - Illustrated empty state with CTA

=== UI DESIGN REQUIREMENTS ===
Dark theme app with this color palette:
- Background: #0A0A0F (near-black)
- Card surface: #12121A
- Primary brand: #6C3BFF (electric violet)
- Accent: #00D4AA (cyan-teal)
- CTA: #FF6B35 (coral)
- Text: #F0EFFF primary, #8B89A8 muted

Typography:
- Add to index.html: Google Fonts — Syne (700,800) for headings, DM Sans (300,400,500) for body
- Apply via Tailwind custom font config

Components to build beautifully:
- Navbar: frosted glass, logo icon, active route underline animation
- Homepage: gradient mesh hero, glassmorphism feature cards, floating badges
- Generation wizard: step dots indicator, smooth Framer Motion transitions between steps
- AI thinking animation: pulsing gradient orb during generation
- Code blocks: dark bg, language badge, 1-click copy button
- Topic cards: colorful left border, icon badges, hover lift effect

=== GLOBAL SETUP ===
- Add <Toaster position="top-right" /> to main.tsx
- Add toast.success() and toast.error() calls in all mutation onSuccess/onError handlers
- Add ReactQueryDevtools in development
- Protect /generate, /topics, /my-courses routes — redirect to /login if no token in localStorage

IMPORTANT RULES:
- Never use localStorage for anything except the JWT access_token
- All server state must go through TanStack Query — never useState for API data
- All UI state (wizard steps, form inputs) must use Zustand or local useState
- Code must be TypeScript — no 'any' types except where unavoidable
- All components must handle loading, error, and empty states
```

---

## 8. PRIORITY ORDER (Quickest Path to Working App)

1. ✅ Fix CORS + API prefix (5 min) — nothing works without this
2. ✅ Fix route ordering in controllers (2 min) — critical bug
3. ✅ Add `<Toaster />` to main.tsx (1 min)
4. 🔨 Build `useCourseGeneration` hook (1 hour)
5. 🔨 Complete `/generate` wizard (3 hours)
6. 🔨 Complete `/generate/$courseId` course view (2 hours)
7. 🔨 Complete `/topics` + `/topics/$topicId` (2 hours)
8. 🔨 Complete `/my-courses` (1 hour)
9. 🔨 Build `/login` + `/register` (1 hour)
10. 🎨 Apply full dark UI design overhaul (4 hours)

**Estimated total: ~15 hours to a fully working, beautiful application.**
