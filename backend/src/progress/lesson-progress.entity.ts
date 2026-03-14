import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('lesson_progress')
@Unique(['userId', 'lessonId'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  lessonId: string;

  @Column()
  courseId: string;

  @Column()
  moduleId: string;

  @Column({ default: true })
  completed: boolean;

  @CreateDateColumn()
  completedAt: Date;
}
