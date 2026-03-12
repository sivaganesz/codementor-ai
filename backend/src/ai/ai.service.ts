import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { coursePlanPrompt } from './prompts/course-plan.prompt';
import { courseContentPrompt } from './prompts/course-content.prompt';
import { topicPrompt } from './prompts/topic.prompt';

export interface CoursePlan {
  title: string;
  description: string;
  estimatedHours: number;
  modules: {
    title: string;
    description: string;
    order: number;
    lessons: { title: string; order: number }[];
  }[];
}

export interface ModuleContent {
  lessons: {
    title: string;
    content: string;
    codeExamples: { language: string; code: string; description: string }[];
    order: number;
    estimatedMinutes: number;
  }[];
}

export interface TopicContent {
  overview: string;
  realWorldExamples: {
    title: string;
    scenario: string;
    solution: string;
    outcome: string;
  }[];
  codeExamples: { language: string; code: string; description: string }[];
  whenToUse: string;
  commonPitfalls: string[];
  keyTakeaways: string[];
  relatedTopics: string[];
}

@Injectable()
export class AiService {
  private model: GenerativeModel;

  constructor(private config: ConfigService) {
    const genAI = new GoogleGenerativeAI(
      this.config.get<string>('gemini.apiKey'),
    );
    this.model = genAI.getGenerativeModel({
      model: this.config.get<string>('gemini.model') || 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  async generateCoursePlan(prompt: string): Promise<CoursePlan> {
    const systemPrompt = coursePlanPrompt();
    try {
      const result = await this.model.generateContent(`${systemPrompt}

Generate a course plan for: ${prompt}`);
      const text = result.response.text();
      return JSON.parse(text) as CoursePlan;
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Course Plan generation failed: ${(err as Error).message}`,
      );
    }
  }

  async generateModuleContent(planModule: unknown): Promise<ModuleContent> {
    const systemPrompt = courseContentPrompt();
    try {
      const result = await this.model.generateContent(`${systemPrompt}

${JSON.stringify(planModule)}`);
      const text = result.response.text();
      return JSON.parse(text) as ModuleContent;
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Module Content generation failed: ${(err as Error).message}`,
      );
    }
  }

  async generateTopicContent(
    topic: string,
    depth: string,
  ): Promise<TopicContent> {
    const systemPrompt = topicPrompt();
    try {
      const result = await this.model.generateContent(`${systemPrompt}

Topic: ${topic}
Depth: ${depth}`);
      const text = result.response.text();
      return JSON.parse(text) as TopicContent;
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Topic Content generation failed: ${(err as Error).message}`,
      );
    }
  }
}
