import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

export class ListArticlesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Reuters',
    description: 'Filter articles by exact source name.',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Filter articles by exact language code.',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description:
      'Return articles published on or after this date (YYYY-MM-DD).',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description:
      'Return articles published on or before this date (YYYY-MM-DD).',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
