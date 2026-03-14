import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgress } from './lesson-progress.entity';
import { Course } from '../courses/entities/course.entity';

export interface CourseProgressResult {
  courseId: string;
  percentage: number;
  completedLessons: number;
  totalLessons: number;
  level: number;
  levelLabel: string;
  moduleProgress: ModuleProgressItem[];
  completedLessonIds: string[];
}

export interface ModuleProgressItem {
  moduleId: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  completed: boolean;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(LessonProgress)
    private progressRepo: Repository<LessonProgress>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  async markLessonComplete(
    userId: string,
    lessonId: string,
    courseId: string,
    moduleId: string,
  ): Promise<CourseProgressResult> {
    // Upsert — handle already completed
    const existing = await this.progressRepo.findOne({
      where: { userId, lessonId },
    });
    if (!existing) {
      await this.progressRepo.save({
        userId,
        lessonId,
        courseId,
        moduleId,
        completed: true,
      });
    }
    return this.getCourseProgress(userId, courseId);
  }

  async getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressResult> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });

    if (!course) {
      return {
        courseId,
        percentage: 0,
        completedLessons: 0,
        totalLessons: 0,
        level: 1,
        levelLabel: 'Beginner',
        moduleProgress: [],
        completedLessonIds: [],
      };
    }

    const allLessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;

    const completedRecords = await this.progressRepo.find({
      where: { userId, courseId, completed: true },
    });

    const completedLessonIds = completedRecords.map((r) => r.lessonId);
    const completedLessons = completedRecords.length;
    const percentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const moduleProgress: ModuleProgressItem[] = course.modules.map((mod) => {
      const modCompleted = completedRecords.filter(
        (p) => p.moduleId === mod.id,
      ).length;
      return {
        moduleId: mod.id,
        title: mod.title,
        completedLessons: modCompleted,
        totalLessons: mod.lessons.length,
        completed:
          mod.lessons.length > 0 && modCompleted === mod.lessons.length,
      };
    });

    const level = this.calculateLevel(completedLessons);
    return {
      courseId,
      percentage,
      completedLessons,
      totalLessons,
      level,
      levelLabel: this.getLevelLabel(level),
      moduleProgress,
      completedLessonIds,
    };
  }

  async getCompletedLessonIds(
    userId: string,
    courseId: string,
  ): Promise<string[]> {
    const records = await this.progressRepo.find({
      where: { userId, courseId, completed: true },
    });
    return records.map((r) => r.lessonId);
  }

  private calculateLevel(completedLessons: number): number {
    // Every 3 lessons = 1 level, min level 1
    return Math.max(1, Math.floor(completedLessons / 3) + 1);
  }

  private getLevelLabel(level: number): string {
    if (level <= 2) return 'Beginner';
    if (level <= 5) return 'Learner';
    if (level <= 10) return 'Explorer';
    if (level <= 15) return 'Practitioner';
    if (level <= 20) return 'Expert';
    return 'Master';
  }
}
