import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topicName: string;

  @Column({ type: 'text' })
  overview: string;

  @Column({ type: 'jsonb' })
  realWorldExamples: any[];

  @Column({ type: 'jsonb' })
  codeExamples: any[];

  @Column({ type: 'text' })
  whenToUse: string;

  @Column({ type: 'jsonb', default: [] })
  commonPitfalls: string[];

  @Column({ type: 'jsonb', default: [] })
  keyTakeaways: string[];

  @Column({ type: 'jsonb', default: [] })
  relatedTopics: string[];

  @ManyToOne(() => User, (u) => u.topics, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
