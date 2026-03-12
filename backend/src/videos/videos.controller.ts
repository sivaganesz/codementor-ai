import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post(':moduleId/generate')
  @ApiOperation({ summary: 'Trigger Remotion video generation' })
  generate(@Param('moduleId') moduleId: string) {
    return this.videosService.generateForModule(moduleId);
  }

  @Get(':moduleId')
  @ApiOperation({ summary: 'Get video URL & status' })
  findOne(@Param('moduleId') moduleId: string) {
    return this.videosService.findByModuleId(moduleId);
  }
}
