import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatbotService {
  constructor(private aiService: AiService) {}

  async chat(
    message: string,
    context?: string,
  ): Promise<{ reply: string }> {
    const reply = await this.aiService.chatbotReply(message, context);
    return { reply };
  }
}
