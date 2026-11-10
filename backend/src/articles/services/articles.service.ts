import { Injectable } from '@nestjs/common';
import { ArticleResponseDto } from '../dto';
import { ArticleFindAllService } from './article-find-all.service';
import { ArticleFindOneService } from './article-find-one.service';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ListArticlesQueryDto } from '../dto/list-articles-query.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly findAllService: ArticleFindAllService,
    private readonly findOneService: ArticleFindOneService,
  ) {}

  findAll(
    query: ListArticlesQueryDto,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    return this.findAllService.execute(query);
  }

  findOne(id: number): Promise<ArticleResponseDto> {
    return this.findOneService.execute(id);
  }
}
