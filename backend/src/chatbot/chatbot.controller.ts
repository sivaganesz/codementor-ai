import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

export class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  context?: string;
}

@ApiTags('chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with CodeMentor AI assistant' })
  chat(@Body() dto: ChatDto) {
    return this.chatbotService.chat(dto.message, dto.context);
  }
}
