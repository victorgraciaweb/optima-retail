import { useQuery } from '@tanstack/react-query';

import { listIncidentsAction } from '@/actions/list-incidents.action';
import {
  INCIDENTS_PAGE_SIZE,
  useIncidentFilters,
} from '@/hooks/useIncidentFilters';

/**
 * Server data for the list. The filters come from the URL, so a filter change
 * produces a new queryKey and React Query refetches without a page reload.
 */
export const useIncidents = () => {
  const { filters } = useIncidentFilters();
  const { page, ...rest } = filters;

  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () =>
      listIncidentsAction({
        ...rest,
        limit: INCIDENTS_PAGE_SIZE,
        offset: (page - 1) * INCIDENTS_PAGE_SIZE,
      }),
    staleTime: 1000 * 30,
    placeholderData: (previous) => previous,
  });
};
