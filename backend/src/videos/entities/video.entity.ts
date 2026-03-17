import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  moduleId: string;

  @Column({ nullable: true })
  courseId: string;

  // The video worker job ID (for polling)
  @Column({ nullable: true })
  workerJobId: string;

  // AI-generated script text
  @Column({ type: 'text', nullable: true })
  script: string;

  // Selected avatar ID (avatar_1 through avatar_6)
  @Column({ nullable: true, default: 'avatar_1' })
  avatarId: string;

  // Final .mp4 URL once completed
  @Column({ nullable: true })
  videoUrl: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

  // Human-readable step label for the frontend
  @Column({ nullable: true })
  currentStep: string;

  // 0-100
  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
