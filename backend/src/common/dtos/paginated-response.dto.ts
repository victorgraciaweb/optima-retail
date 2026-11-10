import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiProperty({ example: 20, description: 'Total number of matching items.' })
  count: number;

  @ApiProperty({ example: 2, description: 'Total number of pages available.' })
  pages: number;

  constructor(data: T[], count: number, pages: number) {
    this.data = data;
    this.count = count;
    this.pages = pages;
  }
}
