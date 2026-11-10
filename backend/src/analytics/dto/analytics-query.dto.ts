import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Sentiment } from '../../articles/enums/sentiment.enum';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    enum: Sentiment,
    description: 'Restrict the counts to a single sentiment.',
  })
  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;
}
