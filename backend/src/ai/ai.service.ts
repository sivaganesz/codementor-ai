import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { coursePlanPrompt } from './prompts/course-plan.prompt';
import { courseContentPrompt } from './prompts/course-content.prompt';
import { topicPrompt } from './prompts/topic.prompt';

@Injectable()
export class AiService {
  private model: any;

  constructor(private config: ConfigService) {
    const genAI = new GoogleGenerativeAI(this.config.get<string>('gemini.apiKey'));
    this.model = genAI.getGenerativeModel({
      model: this.config.get<string>('gemini.model') || 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  async generateCoursePlan(prompt: string): Promise<any> {
    const systemPrompt = coursePlanPrompt();
    const result = await this.model.generateContent(`${systemPrompt}

Generate a course plan for: ${prompt}`);
    return JSON.parse(result.response.text());
  }

  async generateModuleContent(module: any): Promise<any> {
    const systemPrompt = courseContentPrompt();
    const result = await this.model.generateContent(`${systemPrompt}

${JSON.stringify(module)}`);
    return JSON.parse(result.response.text());
  }

  async generateTopicContent(topic: string, depth: string): Promise<any> {
    const systemPrompt = topicPrompt();
    const result = await this.model.generateContent(`${systemPrompt}

Topic: ${topic}
Depth: ${depth}`);
    return JSON.parse(result.response.text());
  }
}