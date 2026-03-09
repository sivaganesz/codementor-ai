import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CourseModule } from './module.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  codeExamples: any[];

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int', default: 10 })
  estimatedMinutes: number;

  @ManyToOne(() => CourseModule, (m) => m.lessons, { onDelete: 'CASCADE' })
  module: CourseModule;

  @Column()
  moduleId: string;
}