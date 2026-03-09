import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { GenerateTopicDto } from './dto/generate-topic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('topics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('topics')
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate topic learning content' })
  generate(@Body() dto: GenerateTopicDto, @CurrentUser() user: any) {
    return this.topicsService.generate(dto, user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search saved topics' })
  search(@Query('q') query: string) {
    return this.topicsService.search(query || '');
  }

  @Get(':topicId')
  @ApiOperation({ summary: 'Get single topic content' })
  findOne(@Param('topicId') topicId: string, @CurrentUser() user: any) {
    return this.topicsService.findOne(topicId, user.id);
  }
}