import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ArticleResponseDto } from '../../articles/dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { SearchQueryDto } from '../dto';
import { SearchService } from '../services/search.service';

/**
 * Search HTTP controller
 *
 * Handles boolean search endpoints
 * Delegates business logic to SearchService
 */
@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Search articles using boolean query syntax
   *
   * @param query Boolean query and pagination options
   * @returns PaginatedResponseDto<ArticleResponseDto>
   */
  @Get()
  @ApiOperation({
    summary: 'Search articles',
    description:
      'Returns a paginated list of articles matching a boolean search query.',
  })
  @ApiExtraModels(PaginatedResponseDto, ArticleResponseDto)
  @ApiOkResponse({
    description: 'Paginated list of articles matching the given query.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ArticleResponseDto) },
            },
          },
        },
      ],
    },
  })
  search(
    @Query() query: SearchQueryDto,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    return this.searchService.search(query);
  }
}
