import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  moduleId: string;

  @Column({ type: 'text', nullable: true })
  script: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'generating' | 'completed' | 'failed';

  @CreateDateColumn()
  createdAt: Date;
}