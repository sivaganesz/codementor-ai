import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video } from './entities/video.entity';
import { CourseModule } from '../courses/entities/module.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, CourseModule]),
    AiModule,
  ],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}