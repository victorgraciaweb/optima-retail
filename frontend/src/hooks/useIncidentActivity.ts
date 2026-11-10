import { useQuery } from '@tanstack/react-query';

import { getIncidentActivityAction } from '@/actions/get-incident-activity.action';

export const useIncidentActivity = (id: string | undefined) =>
  useQuery({
    queryKey: ['incidents', id, 'activity'],
    queryFn: () => getIncidentActivityAction(id!),
    enabled: !!id,
  });
