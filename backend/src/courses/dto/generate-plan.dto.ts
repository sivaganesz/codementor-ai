import { IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePlanDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  @ApiProperty({ example: 'I want to learn React.js' })
  prompt: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @ApiProperty({ required: false, enum: ['beginner', 'intermediate', 'advanced'] })
  level?: 'beginner' | 'intermediate' | 'advanced';
}