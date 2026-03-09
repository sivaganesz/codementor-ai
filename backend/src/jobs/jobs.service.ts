import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('course-generation') private queue: Queue,
  ) {}

  async getStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) throw new NotFoundException('Job not found in queue');

    const state = await job.getState();
    const progress = job.progress as number;

    return {
      jobId,
      status: this.mapJobState(state),
      progress: progress || 0,
      failReason: job.failedReason ?? null,
    };
  }

  private mapJobState(state: string | unknown): 'pending' | 'processing' | 'completed' | 'failed' {
    const map: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      waiting: 'pending',
      active: 'processing',
      completed: 'completed',
      failed: 'failed',
    };
    return map[state as string] ?? 'pending';
  }
}