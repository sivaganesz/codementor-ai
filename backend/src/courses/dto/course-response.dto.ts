import { ApiProperty } from '@nestjs/swagger';

export class LessonResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  order: number;
}

export class ModuleResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  order: number;
  @ApiProperty({ type: [LessonResponseDto] })
  lessons: LessonResponseDto[];
}

export class CourseResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  status: string;
  @ApiProperty({ type: [ModuleResponseDto] })
  modules: ModuleResponseDto[];
}
