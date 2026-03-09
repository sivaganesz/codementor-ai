import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post('generate-plan')
  @ApiOperation({ summary: 'Generate a course plan from a prompt' })
  generatePlan(@Body() dto: GeneratePlanDto, @CurrentUser() user: any) {
    return this.coursesService.generatePlan(dto, user);
  }

  @Post(':planId/confirm')
  @ApiOperation({ summary: 'Confirm a plan and start full generation' })
  confirmPlan(@Param('planId') planId: string, @CurrentUser() user: any) {
    return this.coursesService.confirmPlan(planId, user);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get the generation status of a job' })
  getStatus(@Param('jobId') jobId: string) {
    return this.coursesService.getJobStatus(jobId);
  }

  @Get('me')
  @ApiOperation({ summary: 'User course library' })
  getMyCourses(@CurrentUser() user: any) {
    return this.coursesService.findAllByUser(user.id);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get full course' })
  getCourse(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.coursesService.findOne(courseId, user.id);
  }
}