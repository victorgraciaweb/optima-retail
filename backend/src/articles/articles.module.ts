import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { ArticlesController } from './controllers/articles.controller';
import { ArticlesService } from './services/articles.service';
import { ArticleFindAllService } from './services/article-find-all.service';
import { ArticleFindOneService } from './services/article-find-one.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleFindAllService, ArticleFindOneService],
  exports: [TypeOrmModule],
})
export class ArticlesModule {}
