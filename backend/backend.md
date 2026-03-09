# Backend Documentation — AI Course Generation Platform

## Overview

The backend is a NestJS application providing REST APIs for course generation, topic learning, job status tracking, and video metadata. It uses PostgreSQL for persistence and Google Gemini for AI content generation, and optionally Redis for job queuing and caching.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| NestJS 10 | Server framework |
| TypeORM | ORM for PostgreSQL |
| PostgreSQL 16 | Primary database |
| Redis (optional) | Job queue (BullMQ) + response caching |
| BullMQ | Background job processing for long-running generation |
| Google Gemini SDK (@google/generative-ai) | LLM calls |
| Passport + JWT | Authentication |
| class-validator + class-transformer | DTO validation |
| Swagger (OpenAPI) | Auto-generated API docs |
| Pino | Structured logging |

---

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── config/
│   │   ├── configuration.ts       # Typed config with @nestjs/config
│   │   └── database.config.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │
│   ├── courses/
│   │   ├── courses.module.ts
│   │   ├── courses.controller.ts
│   │   ├── courses.service.ts
│   │   ├── course-generation.service.ts  # AI generation logic
│   │   ├── entities/
│   │   │   ├── course.entity.ts
│   │   │   ├── module.entity.ts
│   │   │   └── lesson.entity.ts
│   │   ├── dto/
│   │   │   ├── generate-plan.dto.ts
│   │   │   ├── confirm-plan.dto.ts
│   │   │   └── course-response.dto.ts
│   │   └── processors/
│   │       └── course-generation.processor.ts  # BullMQ processor
│   │
│   ├── topics/
│   │   ├── topics.module.ts
│   │   ├── topics.controller.ts
│   │   ├── topics.service.ts
│   │   ├── entities/
│   │   │   └── topic.entity.ts
│   │   └── dto/
│   │       ├── generate-topic.dto.ts
│   │       └── topic-response.dto.ts
│   │
│   ├── videos/
│   │   ├── videos.module.ts
│   │   ├── videos.controller.ts
│   │   ├── videos.service.ts
│   │   └── entities/
│   │       └── video.entity.ts
│   │
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts              # Unified AI provider wrapper
│   │   └── prompts/
│   │       ├── course-plan.prompt.ts
│   │       ├── course-content.prompt.ts
│   │       └── topic.prompt.ts
│   │
│   └── jobs/
│       ├── jobs.module.ts
│       ├── jobs.controller.ts         # GET /jobs/status/:jobId
│       └── jobs.service.ts
│
├── migrations/
├── test/
├── .env
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Module Breakdown

### AppModule (`app.module.ts`)

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        synchronize: false,  // Always use migrations in production
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    TopicsModule,
    VideosModule,
    JobsModule,
    AiModule,
  ],
})
export class AppModule {}
```

---

## Database Entities

### User (`user.entity.ts`)

```ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @Column({ default: 'free' })
  plan: 'free' | 'pro'

  @OneToMany(() => Course, (c) => c.user)
  courses: Course[]

  @OneToMany(() => Topic, (t) => t.user)
  topics: Topic[]

  @CreateDateColumn()
  createdAt: Date
}
```

### Course (`course.entity.ts`)

```ts
@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ default: 'draft' })
  status: 'draft' | 'generating' | 'completed' | 'failed'

  @Column({ nullable: true })
  jobId: string        // BullMQ job ID for status polling

  @Column({ type: 'int', default: 0 })
  estimatedHours: number

  @Column({ type: 'jsonb', nullable: true })
  planSnapshot: object  // Stores the plan JSON before full generation

  @ManyToOne(() => User, (u) => u.courses)
  user: User

  @Column()
  userId: string

  @OneToMany(() => CourseModule, (m) => m.course, { cascade: true, eager: false })
  @JoinColumn()
  modules: CourseModule[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

### CourseModule (`module.entity.ts`)

```ts
@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'int' })
  order: number

  @ManyToOne(() => Course, (c) => c.modules, { onDelete: 'CASCADE' })
  course: Course

  @Column()
  courseId: string

  @OneToMany(() => Lesson, (l) => l.module, { cascade: true })
  lessons: Lesson[]

  @Column({ nullable: true })
  videoUrl: string

  @Column({ default: 'pending' })
  videoStatus: 'pending' | 'generating' | 'completed'
}
```

### Lesson (`lesson.entity.ts`)

```ts
@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text' })
  content: string   // Markdown

  @Column({ type: 'jsonb', default: [] })
  codeExamples: CodeExample[]

  @Column({ type: 'int' })
  order: number

  @Column({ type: 'int', default: 10 })
  estimatedMinutes: number

  @ManyToOne(() => CourseModule, (m) => m.lessons, { onDelete: 'CASCADE' })
  module: CourseModule

  @Column()
  moduleId: string
}
```

### Topic (`topic.entity.ts`)

```ts
@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  topicName: string

  @Column({ type: 'text' })
  overview: string

  @Column({ type: 'jsonb' })
  realWorldExamples: RealWorldExample[]

  @Column({ type: 'jsonb' })
  codeExamples: CodeExample[]

  @Column({ type: 'text' })
  whenToUse: string

  @Column({ type: 'jsonb', default: [] })
  commonPitfalls: string[]

  @Column({ type: 'jsonb', default: [] })
  keyTakeaways: string[]

  @Column({ type: 'jsonb', default: [] })
  relatedTopics: string[]

  @ManyToOne(() => User, (u) => u.topics, { nullable: true })
  user: User

  @Column({ nullable: true })
  userId: string

  @CreateDateColumn()
  createdAt: Date
}
```

---

## AI Module (`src/ai/`)

### AI Service (`ai.service.ts`)

Central wrapper for all LLM calls. Keeps AI logic decoupled from business logic.

```ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

@Injectable()
export class AiService {
  private model

  constructor(private config: ConfigService) {
    const genAI = new GoogleGenerativeAI(
      this.config.get('gemini.apiKey')
    )

    this.model = genAI.getGenerativeModel({
      model: this.config.get('gemini.model') || 'gemini-1.5-flash',
    })
  }

  async generateCoursePlan(prompt: string): Promise<CoursePlanResponse> {
    const systemPrompt = coursePlanPrompt()

    const result = await this.model.generateContent(
      `${systemPrompt}\n\nGenerate a course plan for: ${prompt}`
    )

    const text = result.response.text()
    return JSON.parse(text)
  }

  async generateModuleContent(module: PlanModule): Promise<GeneratedModuleContent> {
    const systemPrompt = courseContentPrompt()

    const result = await this.model.generateContent(
      `${systemPrompt}\n\n${JSON.stringify(module)}`
    )

    const text = result.response.text()
    return JSON.parse(text)
  }

  async generateTopicContent(topic: string, depth: string): Promise<TopicContentResponse> {
    const systemPrompt = topicPrompt()

    const result = await this.model.generateContent(
      `${systemPrompt}\n\nTopic: ${topic}\nDepth: ${depth}`
    )

    const text = result.response.text()
    return JSON.parse(text)
  }
}
```

### AI Prompts (`src/ai/prompts/`)

#### Course Plan Prompt (`course-plan.prompt.ts`)

```ts
export const coursePlanPrompt = () => `
You are an expert curriculum designer and software engineer.
Generate a detailed course plan in JSON format with this exact structure:

{
  "title": "string",
  "description": "string (2-3 sentences)",
  "estimatedHours": number,
  "modules": [
    {
      "title": "string",
      "description": "string",
      "order": number,
      "lessons": [
        { "title": "string", "order": number }
      ]
    }
  ]
}

Rules:
- Generate 4–8 modules
- Each module should have 3–6 lessons
- Order from fundamentals to advanced
- Respond ONLY with the JSON object, no markdown
`
```

#### Topic Prompt (`topic.prompt.ts`)

```ts
export const topicPrompt = () => `
You are a world-class software engineering educator.
Generate comprehensive learning content for a topic in JSON format:

{
  "overview": "Clear 2-3 sentence explanation",
  "realWorldExamples": [
    {
      "title": "string",
      "scenario": "Real-world context",
      "solution": "How this concept solves it",
      "outcome": "What happens as a result"
    }
  ],
  "codeExamples": [
    { "language": "string", "code": "string", "description": "string" }
  ],
  "whenToUse": "When and where explanation",
  "commonPitfalls": ["string"],
  "keyTakeaways": ["string"],
  "relatedTopics": ["string"]
}

Rules:
- Always include 1–3 real-world examples
- Examples must be concrete and relatable (no vague abstractions)
- Code examples must be runnable and well-commented
- whenToUse must explain real scenarios, not just theory
- Respond ONLY with JSON, no markdown fences
`
```

---

## Courses Module

### Controller (`courses.controller.ts`)

```ts
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  // Step 1: Generate plan
  @Post('generate-plan')
  @ApiOperation({ summary: 'Generate a course plan from a prompt' })
  generatePlan(
    @Body() dto: GeneratePlanDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.generatePlan(dto, user)
  }

  // Step 2: Confirm plan → queue full generation job
  @Post(':planId/confirm')
  @ApiOperation({ summary: 'Confirm a plan and start full generation' })
  confirmPlan(
    @Param('planId') planId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.confirmPlan(planId, user)
  }

  // Poll generation status
  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get the generation status of a job' })
  getStatus(@Param('jobId') jobId: string) {
    return this.coursesService.getJobStatus(jobId)
  }

  // Get full course
  @Get(':courseId')
  getCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.findOne(courseId, user.id)
  }

  // User course library
  @Get('me')
  getMyCourses(@CurrentUser() user: User) {
    return this.coursesService.findAllByUser(user.id)
  }
}
```

### Course Generation Service (`course-generation.service.ts`)

```ts
@Injectable()
export class CourseGenerationService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseModule) private moduleRepo: Repository<CourseModule>,
    @InjectRepository(Lesson) private lessonRepo: Repository<Lesson>,
    private aiService: AiService,
  ) {}

  async generatePlan(prompt: string, userId: string): Promise<Course> {
    const plan = await this.aiService.generateCoursePlan(prompt)

    // Persist as a draft course with planSnapshot
    const course = this.courseRepo.create({
      title: plan.title,
      description: plan.description,
      estimatedHours: plan.estimatedHours,
      planSnapshot: plan,
      status: 'draft',
      userId,
    })
    return this.courseRepo.save(course)
  }

  async confirmAndQueue(courseId: string, userId: string): Promise<{ jobId: string }> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, userId },
    })

    if (!course || course.status !== 'draft') {
      throw new NotFoundException('Course plan not found or already confirmed')
    }

    // Add BullMQ job
    const job = await this.courseGenerationQueue.add(
      'generate-full-course',
      { courseId, planSnapshot: course.planSnapshot },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    )

    // Save jobId for polling
    await this.courseRepo.update(courseId, {
      jobId: String(job.id),
      status: 'generating',
    })

    return { jobId: String(job.id) }
  }
}
```

### BullMQ Processor (`course-generation.processor.ts`)

```ts
@Processor('course-generation')
export class CourseGenerationProcessor extends WorkerHost {
  constructor(
    private aiService: AiService,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseModule) private moduleRepo: Repository<CourseModule>,
    @InjectRepository(Lesson) private lessonRepo: Repository<Lesson>,
  ) {
    super()
  }

  async process(job: Job<{ courseId: string; planSnapshot: any }>) {
    const { courseId, planSnapshot } = job.data

    try {
      for (const planModule of planSnapshot.modules) {
        // Generate full content for each module
        const moduleContent = await this.aiService.generateModuleContent(planModule)

        // Save module
        const module = await this.moduleRepo.save({
          title: planModule.title,
          description: planModule.description,
          order: planModule.order,
          courseId,
        })

        // Save lessons
        for (const lesson of moduleContent.lessons) {
          await this.lessonRepo.save({
            title: lesson.title,
            content: lesson.content,
            codeExamples: lesson.codeExamples,
            order: lesson.order,
            estimatedMinutes: lesson.estimatedMinutes,
            moduleId: module.id,
          })
        }

        // Update job progress (0–100)
        const progress = Math.round(
          ((planSnapshot.modules.indexOf(planModule) + 1) / planSnapshot.modules.length) * 100
        )
        await job.updateProgress(progress)
      }

      // Mark course complete
      await this.courseRepo.update(courseId, { status: 'completed' })
    } catch (err) {
      await this.courseRepo.update(courseId, { status: 'failed' })
      throw err
    }
  }
}
```

---

## Topics Module

### Controller (`topics.controller.ts`)

```ts
@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate topic learning content' })
  generate(
    @Body() dto: GenerateTopicDto,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.generate(dto, user)
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.topicsService.search(query)
  }

  @Get(':topicId')
  findOne(
    @Param('topicId') topicId: string,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.findOne(topicId, user.id)
  }
}
```

### Topics Service (`topics.service.ts`)

```ts
@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    private aiService: AiService,
  ) {}

  async generate(dto: GenerateTopicDto, user: User): Promise<Topic> {
    const content = await this.aiService.generateTopicContent(
      dto.topic,
      dto.preferredDepth ?? 'intermediate'
    )

    const topic = this.topicRepo.create({
      topicName: dto.topic,
      overview: content.overview,
      realWorldExamples: content.realWorldExamples,
      codeExamples: content.codeExamples,
      whenToUse: content.whenToUse,
      commonPitfalls: content.commonPitfalls,
      keyTakeaways: content.keyTakeaways,
      relatedTopics: content.relatedTopics,
      userId: user.id,
    })

    return this.topicRepo.save(topic)
  }

  async search(query: string): Promise<Topic[]> {
    return this.topicRepo
      .createQueryBuilder('topic')
      .where('topic.topicName ILIKE :query', { query: `%${query}%` })
      .orderBy('topic.createdAt', 'DESC')
      .limit(20)
      .getMany()
  }

  async findOne(topicId: string, userId: string): Promise<Topic> {
    const topic = await this.topicRepo.findOne({
      where: { id: topicId, userId },
    })
    if (!topic) throw new NotFoundException('Topic not found')
    return topic
  }
}
```

---

## Jobs Module

### Jobs Controller (`jobs.controller.ts`)

```ts
@Controller('courses/status')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get(':jobId')
  @ApiOperation({ summary: 'Poll generation job status' })
  getStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getStatus(jobId)
  }
}
```

### Jobs Service (`jobs.service.ts`)

```ts
@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('course-generation') private queue: Queue,
  ) {}

  async getStatus(jobId: string): Promise<GenerationStatus> {
    const job = await this.queue.getJob(jobId)
    if (!job) throw new NotFoundException('Job not found')

    const state = await job.getState()
    const progress = job.progress as number

    return {
      jobId,
      status: this.mapJobState(state),
      progress,
      failReason: job.failedReason ?? null,
    }
  }

  private mapJobState(state: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const map: Record<string, any> = {
      waiting: 'pending',
      active: 'processing',
      completed: 'completed',
      failed: 'failed',
    }
    return map[state] ?? 'pending'
  }
}
```

---

## DTOs

### Generate Plan (`generate-plan.dto.ts`)

```ts
export class GeneratePlanDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  @ApiProperty({ example: 'I want to learn React.js' })
  prompt: string

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: 'beginner' | 'intermediate' | 'advanced'
}
```

### Generate Topic (`generate-topic.dto.ts`)

```ts
export class GenerateTopicDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty({ example: 'React State Management' })
  topic: string

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  preferredDepth?: 'beginner' | 'intermediate' | 'advanced'
}
```

---

## Authentication

JWT-based auth via Passport.js.

```ts
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('jwt.secret'),
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    return { id: payload.sub, email: payload.email }
  }
}
```

---

## Database Migrations

Never use `synchronize: true` in production. Use TypeORM migrations:

```bash
# Generate a migration after entity changes
npx typeorm migration:generate src/migrations/AddCourseTables -d src/data-source.ts

# Run migrations
npx typeorm migration:run -d src/data-source.ts
```

---

## Error Handling

### Global Exception Filter (`http-exception.filter.ts`)

```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    })
  }
}
```

---

## Environment Variables

```env
# .env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_NAME=course_platform

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-1.5-flash

# App
FRONTEND_URL=http://localhost:5173
```

---

## API Endpoints Summary

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Courses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/courses/generate-plan` | ✅ | Generate course plan from prompt |
| POST | `/api/courses/:planId/confirm` | ✅ | Approve plan → queue full generation |
| GET | `/api/courses/status/:jobId` | ✅ | Poll generation job status |
| GET | `/api/courses/me` | ✅ | Get authenticated user's courses |
| GET | `/api/courses/:courseId` | ✅ | Get full course with modules & lessons |

### Topics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/topics/generate` | ✅ | Generate topic learning content |
| GET | `/api/topics/search?q=` | ✅ | Search saved topics |
| GET | `/api/topics/:topicId` | ✅ | Get single topic content |

### Videos
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/videos/:moduleId/generate` | ✅ | Trigger Remotion video generation |
| GET | `/api/videos/:moduleId` | ✅ | Get video URL & status |

---

## Key Design Decisions

1. **BullMQ for async generation** — Full course generation can take 30–120 seconds depending on module count. Jobs run in background; frontend polls `/status/:jobId` every 3 seconds. No websocket complexity needed.
2. **`planSnapshot` in Course entity** — The approved plan is saved as JSONB so the job processor can work from it even if partial module data is written during processing.
3. **AI module is standalone** — `AiService` is a pure service with no DB access. It only calls the LLM and returns structured data. Makes it easy to swap Gemini for Anthropic or another provider.
4. **Topic generation is synchronous** — Topic content is much shorter than a full course (~2–5 seconds). No queuing needed; direct `await` in the request handler.
5. **JSON response format enforced for AI** — All AI calls use `response_format: { type: 'json_object' }` to guarantee parseable output.
6. **JSONB for flexible content** — Code examples, real-world examples, and key takeaways stored as JSONB so schema doesn't need to change if AI output structure evolves.
7. **No Kafka for MVP** — Kafka is reserved for when the platform needs event-driven module completion tracking, notifications, or analytics pipelines. Not needed initially.

---

## Redis Usage (Optional Enhancements)

When Redis is available, add caching to expensive operations:

```ts
// Cache repeated topic queries for 1 hour
@CacheKey('topic-search')
@CacheTTL(3600)
async search(query: string): Promise<Topic[]> { ... }

// Cache course detail for 5 minutes
async findOne(id: string): Promise<Course> {
  const cached = await this.redis.get(`course:${id}`)
  if (cached) return JSON.parse(cached)
  const course = await this.courseRepo.findOne(...)
  await this.redis.setex(`course:${id}`, 300, JSON.stringify(course))
  return course
}
```
