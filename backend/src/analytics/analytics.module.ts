import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../articles/entities/article.entity';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { ArticlesOverTimeService } from './services/articles-over-time.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ArticlesOverTimeService],
})
export class AnalyticsModule {}
