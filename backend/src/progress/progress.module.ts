import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonProgress } from './lesson-progress.entity';
import { ProgressService } from './progress.service';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LessonProgress, Course])],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
