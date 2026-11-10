import { Injectable } from '@nestjs/common';
import { AnalyticsQueryDto, ArticleCountByPeriodDto } from '../dto';
import { ArticlesOverTimeService } from './articles-over-time.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly articlesOverTimeService: ArticlesOverTimeService,
  ) {}

  articlesOverTime(
    query: AnalyticsQueryDto,
  ): Promise<ArticleCountByPeriodDto[]> {
    return this.articlesOverTimeService.execute(query);
  }
}
