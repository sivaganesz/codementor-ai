import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { CourseModule } from '../entities/module.entity';
import { Lesson } from '../entities/lesson.entity';
import { AiService } from '../../ai/ai.service';

@Processor('course-generation')
export class CourseGenerationProcessor extends WorkerHost {
  constructor(
    private aiService: AiService,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseModule) private moduleRepo: Repository<CourseModule>,
    @InjectRepository(Lesson) private lessonRepo: Repository<Lesson>,
  ) {
    super();
  }

  async process(job: Job<{ courseId: string; planSnapshot: any }>) {
    const { courseId, planSnapshot } = job.data;

    try {
      for (let i = 0; i < planSnapshot.modules.length; i++) {
        const planModule = planSnapshot.modules[i];

        const moduleContent = await this.aiService.generateModuleContent(planModule);

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

        const progress = Math.round(((i + 1) / planSnapshot.modules.length) * 100);
        await job.updateProgress(progress);
      }

      await this.courseRepo.update(courseId, { status: 'completed' });
    } catch (err) {
      await this.courseRepo.update(courseId, { status: 'failed' });
      throw err;
    }
  }
}