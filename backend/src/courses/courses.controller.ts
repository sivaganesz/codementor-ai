import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString } from 'class-validator';
import { CoursesService } from './courses.service';
import { JobsService } from '../jobs/jobs.service';
import { ProgressService } from '../progress/progress.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user.interface';

export class MarkLessonCompleteDto {
  @IsString()
  moduleId: string;
}

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private jobsService: JobsService,
    private progressService: ProgressService,
  ) {}

  @Post('generate-plan')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a course plan from a prompt' })
  generatePlan(@Body() dto: GeneratePlanDto, @CurrentUser() user: UserPayload) {
    return this.coursesService.generatePlan(dto, user);
  }

  // ——— Static routes MUST come before :courseId param route ———

  @Get('me')
  @ApiOperation({ summary: 'Get all courses for the authenticated user' })
  getMyCourses(@CurrentUser() user: UserPayload) {
    return this.coursesService.findAllByUser(user.id);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Poll generation job status' })
  getStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getStatus(jobId);
  }

  // ——— Param routes ———

  @Post(':planId/confirm')
  @ApiOperation({ summary: 'Confirm a plan and start full course generation' })
  confirmPlan(
    @Param('planId') planId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.coursesService.confirmPlan(planId, user);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get full course with modules and lessons' })
  getCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.coursesService.findOne(courseId, user.id);
  }

  // ——— Progress endpoints ———

  @Post(':courseId/lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Mark a lesson as completed' })
  markComplete(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkLessonCompleteDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.progressService.markLessonComplete(
      user.id,
      lessonId,
      courseId,
      dto.moduleId,
    );
  }

  @Get(':courseId/progress')
  @ApiOperation({ summary: 'Get course progress for current user' })
  getProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Get(':courseId/completed-lessons')
  @ApiOperation({ summary: 'Get list of completed lesson IDs' })
  getCompletedLessons(
    @Param('courseId') courseId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.progressService.getCompletedLessonIds(user.id, courseId);
  }
}
