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
  private chatModel: GenerativeModel;

  constructor(private config: ConfigService) {
    const genAI = new GoogleGenerativeAI(
      this.config.get<string>('gemini.apiKey'),
    );
    const modelName =
      this.config.get<string>('gemini.model') || 'gemini-2.0-flash';

    this.model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });
    this.chatModel = genAI.getGenerativeModel({ model: modelName });
  }

  async generateCoursePlan(prompt: string): Promise<CoursePlan> {
    try {
      const result = await this.model.generateContent(
        `${coursePlanPrompt()}\n\nGenerate a course plan for: ${prompt}`,
      );
      return JSON.parse(result.response.text()) as CoursePlan;
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Course Plan generation failed: ${(err as Error).message}`,
      );
    }
  }

  async generateModuleContent(planModule: unknown): Promise<ModuleContent> {
    try {
      const result = await this.model.generateContent(
        `${courseContentPrompt()}\n\n${JSON.stringify(planModule)}`,
      );
      return JSON.parse(result.response.text()) as ModuleContent;
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Module Content generation failed: ${(err as Error).message}`,
      );
    }
  }

  async generateTopicContent(topic: string, depth: string): Promise<TopicContent> {
    try {
      const result = await this.model.generateContent(
        `${topicPrompt()}\n\nTopic: ${topic}\nDepth: ${depth}`,
      );
      return JSON.parse(result.response.text()) as TopicContent;
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Topic Content generation failed: ${(err as Error).message}`,
      );
    }
  }

  async chatbotReply(message: string, context?: string): Promise<string> {
    const system = `You are CodeMentor AI — a friendly, expert software engineering learning assistant.
Answer programming questions clearly and practically. Give code examples when helpful.
Be encouraging. Keep responses concise (3-5 paragraphs max).
${context ? `\nContext: ${context}` : ''}`;

    try {
      const result = await this.chatModel.generateContent(
        `${system}\n\nUser: ${message}`,
      );
      return result.response.text();
    } catch (err) {
      throw new InternalServerErrorException(
        `Chatbot reply failed: ${(err as Error).message}`,
      );
    }
  }
}
