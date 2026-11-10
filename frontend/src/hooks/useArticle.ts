import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { getArticleAction } from '@/actions/get-article.action';

export const useArticle = () => {
  const { id } = useParams();

  return useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticleAction(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
