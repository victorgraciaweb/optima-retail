import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ArticleResponseDto } from '../dto';
import { ArticlesService } from '../services/articles.service';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ListArticlesQueryDto } from '../dto/list-articles-query.dto';

/**
 * Articles HTTP controller
 *
 * Handles article-related endpoints
 * Delegates business logic to ArticlesService
 */
@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Get all articles
   *
   * @returns ArticleResponseDto[]
   */
  @Get()
  @ApiOperation({
    summary: 'List articles',
    description:
      'Returns a paginated list of articles, optionally filtered by source, language and publication date range.',
  })
  @ApiExtraModels(PaginatedResponseDto, ArticleResponseDto)
  @ApiOkResponse({
    description: 'Paginated list of articles matching the given filters.',
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
  findAll(
    @Query() query: ListArticlesQueryDto,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    return this.articlesService.findAll(query);
  }

  /**
   * Get an article by its ID
   *
   * @param id Article ID
   * @returns ArticleResponseDto
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get an article by ID',
    description: 'Returns a single article identified by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID.',
    example: 44,
  })
  @ApiOkResponse({
    description: 'The article matching the given ID.',
    type: ArticleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No article exists with the given ID.',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ArticleResponseDto> {
    return this.articlesService.findOne(id);
  }
}
