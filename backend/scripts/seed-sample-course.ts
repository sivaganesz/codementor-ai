import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Course } from '../src/courses/entities/course.entity';
import { CourseModule } from '../src/courses/entities/module.entity';
import { Lesson } from '../src/courses/entities/lesson.entity';
import { Topic } from '../src/topics/entities/topic.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME || 'course_platform',
    entities: [User, Course, CourseModule, Lesson, Topic],
    synchronize: true,
  });

  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Course);

    // 1. Create Test User
    let user = await userRepo.findOne({ where: { email: 'test@example.com' } });
    if (!user) {
      const passwordHash = await bcrypt.hash('password123', 10);
      user = userRepo.create({
        email: 'test@example.com',
        passwordHash,
        plan: 'pro',
      });
      user = await userRepo.save(user);
      console.log('Test user created');
    }

    // 2. Create Sample Course
    const sampleCourse = courseRepo.create({
      title: 'TypeScript Fundamentals',
      description: 'Master the basics of TypeScript for modern web development.',
      status: 'completed',
      estimatedHours: 5,
      userId: user.id,
      modules: [
        {
          title: 'Introduction to Types',
          description: 'Learn about basic types in TypeScript.',
          order: 1,
          lessons: [
            {
              title: 'Primitive Types',
              content: 'TypeScript supports several primitive types like string, number, and boolean.',
              order: 1,
              estimatedMinutes: 15,
              codeExamples: [{ language: 'typescript', code: 'let name: string = "John";' }],
            },
            {
              title: 'Arrays and Tuples',
              content: 'Learn how to define array types and fixed-length tuples.',
              order: 2,
              estimatedMinutes: 20,
              codeExamples: [{ language: 'typescript', code: 'let list: number[] = [1, 2, 3];' }],
            },
          ],
        },
        {
          title: 'Interfaces and Classes',
          description: 'Deep dive into Object-Oriented Programming with TypeScript.',
          order: 2,
          lessons: [
            {
              title: 'Defining Interfaces',
              content: 'Interfaces define the structure of an object.',
              order: 1,
              estimatedMinutes: 25,
              codeExamples: [{ language: 'typescript', code: 'interface User { name: string; age: number; }' }],
            },
          ],
        },
      ],
    });

    await courseRepo.save(sampleCourse);
    console.log('Sample course seeded successfully!');

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();