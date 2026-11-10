import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { ArticleResponseDto } from '../dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ListArticlesQueryDto } from '../dto/list-articles-query.dto';

/**
 * Service to find all articles
 *
 * Plain listing for now — keyset pagination and filters
 * (date range, source, language) are added in a later phase.
 */
@Injectable()
export class ArticleFindAllService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async execute(
    query: ListArticlesQueryDto,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    const { limit = 10, offset = 0, source, language, from, to } = query;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (source) {
      queryBuilder.andWhere('article.source = :source', { source });
    }

    if (language) {
      queryBuilder.andWhere('article.language = :language', { language });
    }

    if (from) {
      queryBuilder.andWhere('article.publishedAt >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('article.publishedAt <= :to', { to });
    }

    const [articles, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto<ArticleResponseDto>(
      articles.map((article) => new ArticleResponseDto(article)),
      total,
      Math.ceil(total / limit),
    );
  }
}
