import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  order: number;

  @ManyToOne(() => Course, (c) => c.modules, { onDelete: 'CASCADE' })
  course: Course;

  @Column()
  courseId: string;

  @OneToMany(() => Lesson, (l) => l.module, { cascade: true })
  lessons: Lesson[];

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ default: 'pending' })
  videoStatus: 'pending' | 'generating' | 'completed';
}