import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { AiService } from '../ai/ai.service';
import { InjectRepository as IR } from '@nestjs/typeorm';
import { CourseModule } from '../courses/entities/module.entity';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(CourseModule) private moduleRepo: Repository<CourseModule>,
    private aiService: AiService,
  ) {}

  async generateForModule(moduleId: string, userId: string) {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['lessons'],
    });
    if (!mod) throw new NotFoundException('Module not found');

    // Mark as generating immediately so UI can show spinner
    await this.moduleRepo.update(moduleId, { videoStatus: 'generating' });

    try {
      // Generate a script using AI
      const script = await this.aiService.generateVideoScript(mod);

      // Save video record with script (no actual video rendering yet)
      const video = this.videoRepo.create({
        moduleId,
        script,
        status: 'completed',
      });
      await this.videoRepo.save(video);

      await this.moduleRepo.update(moduleId, {
        videoStatus: 'completed',
        videoUrl: `/api/videos/module/${moduleId}/script`,
      });

      return { moduleId, status: 'completed', script };
    } catch (err) {
      await this.moduleRepo.update(moduleId, { videoStatus: 'pending' });
      throw err;
    }
  }

  async getModuleScript(moduleId: string) {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
    });
    if (!mod) throw new NotFoundException('Module not found');

    const video = await this.videoRepo.findOne({ where: { moduleId } });
    if (!video) throw new NotFoundException('No script generated yet');

    return { moduleId, script: video.script, status: video.status };
  }

  async getStatus(moduleId: string) {
    const mod = await this.moduleRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    return { moduleId, videoStatus: mod.videoStatus };
  }
}