import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { getArticlesOverTimeAction } from '@/actions/get-articles-over-time.action';

export const useArticlesOverTime = () => {
  const [searchParams] = useSearchParams();
  const sentiment = searchParams.get('sentiment') || undefined;

  return useQuery({
    queryKey: ['articles-over-time', sentiment],
    queryFn: () => getArticlesOverTimeAction({ sentiment }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
