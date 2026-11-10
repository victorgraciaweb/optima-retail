import { api } from '@/api/api';
import type { ArticlesResponse } from '@/interfaces/article.interface';

interface Options {
  q: string;
  limit?: number;
  offset?: number;
}

export const searchArticlesAction = async ({
  q,
  limit = 10,
  offset = 0,
}: Options): Promise<ArticlesResponse> => {
  const { data } = await api.get<ArticlesResponse>('/search', {
    params: { q, limit, offset },
  });

  return data;
};
