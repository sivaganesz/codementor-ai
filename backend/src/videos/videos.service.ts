import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';

@Injectable()
export class VideosService {
  constructor(@InjectRepository(Video) private videoRepo: Repository<Video>) {}

  async generateForModule(moduleId: string) {
    const video = this.videoRepo.create({
      moduleId,
      status: 'generating',
    });
    // Triggers Remotion process later
    return this.videoRepo.save(video);
  }

  async findByModuleId(moduleId: string) {
    const video = await this.videoRepo.findOne({ where: { moduleId } });
    if (!video) throw new NotFoundException('Video not found for this module');
    return video;
  }
}
