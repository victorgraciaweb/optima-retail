import { useQuery } from '@tanstack/react-query';

import { listIncidentsAction } from '@/actions/list-incidents.action';

/**
 * Incidents the consistency check flagged for a human. Independent of the URL
 * filters: the maintenance screen always shows the full pending-review set.
 */
export const useIncidentsNeedingReview = () =>
  useQuery({
    queryKey: ['incidents', 'needs-review'],
    queryFn: () =>
      listIncidentsAction({
        status: [],
        priority: [],
        q: '',
        assignedTo: '',
        sort: 'updated_at:desc',
        needsReview: true,
        limit: 50,
        offset: 0,
      }),
  });
