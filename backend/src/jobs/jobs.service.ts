import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue, Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('course-generation') private queue: Queue,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  async getStatus(jobId: string) {
    const course = await this.courseRepo.findOne({ where: { jobId } });
    const job = (await this.queue.getJob(jobId)) as
      | Job<{ courseId: string }>
      | undefined;

    if (job) {
      const state = await job.getState();
      const progress = job.progress as number;

      return {
        jobId,
        courseId: course?.id || job.data.courseId,
        status: this.mapJobState(state),
        progress: progress || 0,
        failReason: job.failedReason ?? null,
      };
    }

    // Job cleaned from queue — fall back to DB
    if (!course) throw new NotFoundException('Job not found');

    return {
      jobId,
      courseId: course.id,
      status: course.status,
      progress: course.status === 'completed' ? 100 : 0,
    };
  }

  private mapJobState(
    state: string,
  ): 'pending' | 'processing' | 'completed' | 'failed' {
    const map: Record<
      string,
      'pending' | 'processing' | 'completed' | 'failed'
    > = {
      waiting: 'pending',
      active: 'processing',
      completed: 'completed',
      failed: 'failed',
    };
    return map[state] ?? 'pending';
  }
}
