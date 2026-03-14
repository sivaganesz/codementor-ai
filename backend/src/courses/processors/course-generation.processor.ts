import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Course } from '../entities/course.entity';
import { CourseModule } from '../entities/module.entity';
import { Lesson } from '../entities/lesson.entity';
import { AiService, CoursePlan } from '../../ai/ai.service';

@Processor('course-generation', {
  lockDuration: 300000,   // 5 minutes
  lockRenewTime: 120000,  // renew every 2 minutes
})
export class CourseGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(CourseGenerationProcessor.name);

  constructor(
    private aiService: AiService,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,
    @InjectRepository(Lesson) private lessonRepo: Repository<Lesson>,
  ) {
    super();
  }

  async process(job: Job<{ courseId: string; planSnapshot: CoursePlan }>) {
    const { courseId, planSnapshot } = job.data;

    try {
      for (let i = 0; i < planSnapshot.modules.length; i++) {
        const planModule = planSnapshot.modules[i];

        const moduleContent =
          await this.aiService.generateModuleContent(planModule);

        if (!moduleContent?.lessons?.length) {
          throw new Error(
            `Module "${planModule.title}" returned no lessons from AI`,
          );
        }

        const module = await this.moduleRepo.save({
          title: planModule.title,
          description: planModule.description,
          order: planModule.order,
          courseId,
        });

        for (const lesson of moduleContent.lessons) {
          await this.lessonRepo.save({
            title: lesson.title,
            content: lesson.content,
            codeExamples: lesson.codeExamples,
            order: lesson.order,
            estimatedMinutes: lesson.estimatedMinutes,
            moduleId: module.id,
          });
        }

        const progress = Math.round(
          ((i + 1) / planSnapshot.modules.length) * 100,
        );
        await job.updateProgress(progress);
        this.logger.log(
          `Module ${i + 1}/${planSnapshot.modules.length} completed for course ${courseId}`,
        );
      }

      await this.courseRepo.update(courseId, { status: 'completed' });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Course generation failed for ${courseId}: ${error.message}`,
        error.stack,
      );
      await this.courseRepo.update(courseId, { status: 'failed' });
      throw err;
    }
  }
}
