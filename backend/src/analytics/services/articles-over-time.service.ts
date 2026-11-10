import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { AnalyticsQueryDto, ArticleCountByPeriodDto } from '../dto';

/**
 * Aggregates article counts grouped by publication month.
 *
 * The grouping is pushed down to PostgreSQL (`date_trunc` + `COUNT`) instead of
 * counting in memory, so the work scales with the number of months rather than
 * the number of articles. The optional `sentiment` filter is applied as a
 * parameterized predicate — no user input is interpolated into the SQL string.
 */
@Injectable()
export class ArticlesOverTimeService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async execute(query: AnalyticsQueryDto): Promise<ArticleCountByPeriodDto[]> {
    const { sentiment } = query;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .select(
        `to_char(date_trunc('month', article.publishedAt), 'YYYY-MM')`,
        'period',
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC');

    if (sentiment) {
      queryBuilder.where('article.sentiment = :sentiment', { sentiment });
    }

    const rows = await queryBuilder.getRawMany<{
      period: string;
      count: string;
    }>();

    return rows.map(
      (row) => new ArticleCountByPeriodDto(row.period, Number(row.count)),
    );
  }
}
