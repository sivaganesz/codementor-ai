import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user.interface';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post('module/:moduleId/generate')
  @ApiOperation({ summary: 'Generate video script for a module' })
  generate(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.videosService.generateForModule(moduleId, user.id);
  }

  @Get('module/:moduleId/script')
  @ApiOperation({ summary: 'Get generated script for a module' })
  getScript(@Param('moduleId') moduleId: string) {
    return this.videosService.getModuleScript(moduleId);
  }

  @Get('module/:moduleId/status')
  @ApiOperation({ summary: 'Get video generation status' })
  getStatus(@Param('moduleId') moduleId: string) {
    return this.videosService.getStatus(moduleId);
  }
}