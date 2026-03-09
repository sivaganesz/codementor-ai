import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { CourseGenerationService } from './course-generation.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    private generationService: CourseGenerationService,
  ) {}

  generatePlan(dto: GeneratePlanDto, user: any) {
    return this.generationService.generatePlan(dto.prompt, user.id);
  }

  confirmPlan(planId: string, user: any) {
    return this.generationService.confirmAndQueue(planId, user.id);
  }

  async getJobStatus(jobId: string) {
    const course = await this.courseRepo.findOne({ where: { jobId } });
    if (!course) throw new NotFoundException('Course job not found');
    return { jobId, status: course.status };
  }

  async findOne(courseId: string, userId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, userId },
      relations: ['modules', 'modules.lessons'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  findAllByUser(userId: string) {
    return this.courseRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}