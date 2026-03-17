import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

export class GenerateVideoDto {
  @IsString()
  moduleId: string;

  @IsOptional()
  @IsString()
  avatarId?: string;
}

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Get('avatars')
  @ApiOperation({ summary: 'List available preset avatars' })
  getAvatars() {
    return this.videosService.getAvatars();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a talking-head video for a module' })
  generate(@Body() dto: GenerateVideoDto) {
    return this.videosService.generateForModule(dto.moduleId, dto.avatarId);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Get video status and URL for a module' })
  getModuleVideo(@Param('moduleId') moduleId: string) {
    return this.videosService.getModuleVideo(moduleId);
  }
}
