import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsQueryDto, ArticleCountByPeriodDto } from '../dto';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('articles-over-time')
  @ApiOperation({
    summary: 'Article counts over time',
    description:
      'Returns article counts grouped by publication month, optionally filtered by sentiment.',
  })
  @ApiOkResponse({
    description: 'Article counts per month, ordered chronologically.',
    type: [ArticleCountByPeriodDto],
  })
  articlesOverTime(
    @Query() query: AnalyticsQueryDto,
  ): Promise<ArticleCountByPeriodDto[]> {
    return this.analyticsService.articlesOverTime(query);
  }
}
