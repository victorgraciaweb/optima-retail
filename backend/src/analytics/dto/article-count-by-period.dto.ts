import { ApiProperty } from '@nestjs/swagger';

export class ArticleCountByPeriodDto {
  @ApiProperty({
    example: '2026-01',
    description: 'Month bucket the count belongs to (YYYY-MM).',
  })
  period: string;

  @ApiProperty({
    example: 12,
    description: 'Number of articles published within the period.',
  })
  count: number;

  constructor(period: string, count: number) {
    this.period = period;
    this.count = count;
  }
}
