import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { GenerateTopicDto } from './dto/generate-topic.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    private aiService: AiService,
  ) {}

  async generate(dto: GenerateTopicDto, user: any): Promise<Topic> {
    const content = await this.aiService.generateTopicContent(
      dto.topic,
      dto.preferredDepth ?? 'intermediate'
    );

    const topic = this.topicRepo.create({
      topicName: dto.topic,
      overview: content.overview,
      realWorldExamples: content.realWorldExamples,
      codeExamples: content.codeExamples,
      whenToUse: content.whenToUse,
      commonPitfalls: content.commonPitfalls,
      keyTakeaways: content.keyTakeaways,
      relatedTopics: content.relatedTopics,
      userId: user.id,
    });

    return this.topicRepo.save(topic);
  }

  async search(query: string): Promise<Topic[]> {
    return this.topicRepo
      .createQueryBuilder('topic')
      .where('topic.topicName ILIKE :query', { query: `%${query}%` })
      .orderBy('topic.createdAt', 'DESC')
      .limit(20)
      .getMany();
  }

  async findOne(topicId: string, userId: string): Promise<Topic> {
    const topic = await this.topicRepo.findOne({
      where: { id: topicId, userId },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }
}