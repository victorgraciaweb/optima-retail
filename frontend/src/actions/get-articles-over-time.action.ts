import { api } from '@/api/api';
import type { ArticleCountByPeriod } from '@/interfaces/analytics.interface';

interface Options {
  sentiment?: string;
}

export const getArticlesOverTimeAction = async ({
  sentiment,
}: Options): Promise<ArticleCountByPeriod[]> => {
  const { data } = await api.get<ArticleCountByPeriod[]>(
    '/analytics/articles-over-time',
    { params: { sentiment } },
  );

  return data;
};
