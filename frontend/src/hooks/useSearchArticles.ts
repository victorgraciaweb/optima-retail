import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { searchArticlesAction } from '@/actions/search-articles.action';

const LIMIT = 3;

export const useSearchArticles = () => {
  const [searchParams] = useSearchParams();

  const q = searchParams.get('q')?.trim() || '';
  const queryPage = searchParams.get('page') ?? '1';
  const page = isNaN(+queryPage) ? 1 : Number(queryPage);
  const offset = (page - 1) * LIMIT;

  return useQuery({
    queryKey: ['search', { q, page }],
    queryFn: () => searchArticlesAction({ q, limit: LIMIT, offset }),
    enabled: q.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
