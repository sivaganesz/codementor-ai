import { ApiProperty } from '@nestjs/swagger';

export class TopicResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  topicName: string;
  @ApiProperty()
  overview: string;
  @ApiProperty()
  whenToUse: string;
  @ApiProperty()
  keyTakeaways: string[];
}