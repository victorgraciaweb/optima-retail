import { useQuery } from '@tanstack/react-query';

import { getIncidentStatsAction } from '@/actions/get-incident-stats.action';

export const useIncidentStats = () =>
  useQuery({
    queryKey: ['incidents', 'stats'],
    queryFn: getIncidentStatsAction,
    staleTime: 1000 * 30,
  });
