import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Topic } from '../../topics/entities/topic.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'free' })
  plan: 'free' | 'pro';

  @OneToMany(() => Course, (c) => c.user)
  courses: Course[];

  @OneToMany(() => Topic, (t) => t.user)
  topics: Topic[];

  @CreateDateColumn()
  createdAt: Date;
}