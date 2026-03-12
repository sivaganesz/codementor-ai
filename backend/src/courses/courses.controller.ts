import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CoursesService } from './courses.service';
import { JobsService } from '../jobs/jobs.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user.interface';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private jobsService: JobsService,
  ) {}

  @Post('generate-plan')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a course plan from a prompt' })
  generatePlan(@Body() dto: GeneratePlanDto, @CurrentUser() user: UserPayload) {
    return this.coursesService.generatePlan(dto, user);
  }

  @Post(':planId/confirm')
  @ApiOperation({ summary: 'Confirm a plan and start full generation' })
  confirmPlan(
    @Param('planId') planId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.coursesService.confirmPlan(planId, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'User course library' })
  getMyCourses(@CurrentUser() user: UserPayload) {
    return this.coursesService.findAllByUser(user.id);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get the generation status of a job' })
  getStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getStatus(jobId);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get full course' })
  getCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.coursesService.findOne(courseId, user.id);
  }
}
