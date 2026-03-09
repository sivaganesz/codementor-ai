import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Poll generation job status directly from BullMQ' })
  getStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getStatus(jobId);
  }
}