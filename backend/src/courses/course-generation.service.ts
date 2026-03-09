import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Course } from './entities/course.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CourseGenerationService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    private aiService: AiService,
    @InjectQueue('course-generation') private courseGenerationQueue: Queue,
  ) {}

  async generatePlan(prompt: string, userId: string): Promise<Course> {
    const plan = await this.aiService.generateCoursePlan(prompt);

    const course = this.courseRepo.create({
      title: plan.title,
      description: plan.description,
      estimatedHours: plan.estimatedHours,
      planSnapshot: plan,
      status: 'draft',
      userId,
    });
    return this.courseRepo.save(course);
  }

  async confirmAndQueue(courseId: string, userId: string): Promise<{ jobId: string }> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, userId },
    });

    if (!course || course.status !== 'draft') {
      throw new NotFoundException('Course plan not found or already confirmed');
    }

    const job = await this.courseGenerationQueue.add(
      'generate-full-course',
      { courseId, planSnapshot: course.planSnapshot },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );

    await this.courseRepo.update(courseId, {
      jobId: String(job.id),
      status: 'generating',
    });

    return { jobId: String(job.id) };
  }
}