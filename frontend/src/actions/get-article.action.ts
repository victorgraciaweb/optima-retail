import { api } from '@/api/api';
import type { Article } from '@/interfaces/article.interface';

export const getArticleAction = async (id: string): Promise<Article> => {
  const { data } = await api.get<Article>(`/articles/${id}`);

  return data;
};
