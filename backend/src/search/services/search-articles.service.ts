import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { ArticleResponseDto } from '../../articles/dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { SearchQueryDto } from '../dto';
import { parseBooleanQuery } from '../parser/boolean-query.parser';

/**
 * Service to search articles by boolean query
 *
 * Queries are translated to PostgreSQL `tsquery` by `parseBooleanQuery` and
 * matched against the pre-computed `search_vector` column, which is backed by a
 * GIN index. The `simple` configuration is used on both sides: the corpus is
 * multilingual (en, ar, zh), so language-specific stemming would be wrong for
 * most of it, and `simple` keeps stop words indexed so a lowercase `and` really
 * is searchable as a term.
 */
@Injectable()
export class SearchArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async execute(
    query: SearchQueryDto,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    const { q, limit = 10, offset = 0 } = query;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .skip(offset);

    queryBuilder.andWhere(
      `article.search_vector @@ to_tsquery('simple', :query)`,
      { query: parseBooleanQuery(q) },
    );

    const [articles, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto<ArticleResponseDto>(
      articles.map((article) => new ArticleResponseDto(article)),
      total,
      Math.ceil(total / limit),
    );
  }
}
