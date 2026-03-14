import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseGenerationService } from './course-generation.service';
import { CourseGenerationProcessor } from './processors/course-generation.processor';
import { Course } from './entities/course.entity';
import { CourseModule as CourseModuleEntity } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModuleEntity, Lesson]),
    BullModule.registerQueue({ name: 'course-generation' }),
    AiModule,
    JobsModule,
    ProgressModule,
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CourseGenerationService,
    CourseGenerationProcessor,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
