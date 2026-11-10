import { useQuery } from '@tanstack/react-query';

import { getIncidentAction } from '@/actions/get-incident.action';

export const useIncident = (id: string | undefined) =>
  useQuery({
    queryKey: ['incidents', id],
    queryFn: () => getIncidentAction(id!),
    enabled: !!id,
  });
