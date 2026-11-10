import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

export class SearchQueryDto extends PaginationDto {
  @ApiProperty({
    example: 'AI AND ("healthcare" OR "diagnostic")',
    description:
      'Boolean search query. Supports AND, OR, AND NOT, nested parentheses, quoted phrases and * wildcards.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  q: string;
}
