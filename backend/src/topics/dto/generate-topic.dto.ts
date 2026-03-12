import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTopicDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty({ example: 'React State Management' })
  topic: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @ApiProperty({
    required: false,
    enum: ['beginner', 'intermediate', 'advanced'],
  })
  preferredDepth?: 'beginner' | 'intermediate' | 'advanced';
}
