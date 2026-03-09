import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CourseModule } from './module.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'generating' | 'completed' | 'failed';

  @Column({ nullable: true })
  jobId: string;

  @Column({ type: 'int', default: 0 })
  estimatedHours: number;

  @Column({ type: 'jsonb', nullable: true })
  planSnapshot: any;

  @ManyToOne(() => User, (u) => u.courses)
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => CourseModule, (m) => m.course, { cascade: true })
  @JoinColumn()
  modules: CourseModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}