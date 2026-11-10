import type { PaginatedResponse } from './paginated-response.interface';

export interface Article {
  id: number;
  headline: string;
  body: string;
  source: string;
  publishedAt: string;
  language: string;
  summary: string;
  sentiment: string;
  topics: string[];
  createdAt: string;
  updatedAt: string;
}

export type ArticlesResponse = PaginatedResponse<Article>;
