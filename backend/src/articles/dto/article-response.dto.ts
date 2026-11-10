import { ApiProperty } from '@nestjs/swagger';
import { Article } from '../entities/article.entity';

export class ArticleResponseDto {
  @ApiProperty({
    example: 44,
    description: 'Article unique identifier.',
  })
  id: number;

  @ApiProperty({
    example: 'Renewable energy investments hit record high',
    description: 'Article headline.',
  })
  headline: string;

  @ApiProperty({
    example: 'Global investments in renewable energy reached...',
    description: 'Full article body text.',
  })
  body: string;

  @ApiProperty({
    example: 'Reuters',
    description: 'Source that published the article.',
  })
  source: string;

  @ApiProperty({
    example: '2026-01-15',
    description: 'Publication date of the article (YYYY-MM-DD).',
  })
  publishedAt: string;

  @ApiProperty({
    example: 'en',
    description: 'Language code of the article content.',
  })
  language: string;

  @ApiProperty({
    example: 'A brief summary of the article.',
    description: 'Factual summary of the article.',
  })
  summary: string;

  @ApiProperty({
    example: 'Positive',
    description: 'Overall sentiment of the events reported in the article.',
  })
  sentiment: string;

  @ApiProperty({
    example: ['technology', 'innovation'],
    description: 'List of topics related to the article.',
  })
  topics: string[];

  @ApiProperty({
    example: '2026-07-22T21:35:42.158Z',
    description: 'Timestamp when the article was ingested.',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-07-22T21:35:42.158Z',
    description: 'Timestamp when the article was last updated.',
  })
  updatedAt: Date;

  constructor(article: Article) {
    this.id = article.id;
    this.headline = article.headline;
    this.body = article.body;
    this.source = article.source;
    this.publishedAt = article.publishedAt;
    this.language = article.language;
    this.summary = article.summary;
    this.sentiment = article.sentiment;
    this.topics = article.topics;
    this.createdAt = article.createdAt;
    this.updatedAt = article.updatedAt;
  }
}
