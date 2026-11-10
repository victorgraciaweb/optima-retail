import { Injectable } from '@nestjs/common';
import { ArticleResponseDto } from '../../articles/dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { SearchQueryDto } from '../dto';
import { SearchArticlesService } from './search-articles.service';

@Injectable()
export class SearchService {
  constructor(private readonly searchArticlesService: SearchArticlesService) {}

  search(
    query: SearchQueryDto,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    return this.searchArticlesService.execute(query);
  }
}
