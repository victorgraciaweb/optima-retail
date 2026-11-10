import { api } from '@/api/api';
import type { Incident, IncidentFilters } from '@/interfaces/incident.interface';
import type { PaginatedResponse } from '@/interfaces/paginated-response.interface';

interface Options extends Omit<IncidentFilters, 'page'> {
  limit: number;
  offset: number;
}

export const listIncidentsAction = async ({
  status,
  priority,
  q,
  assignedTo,
  sort,
  needsReview,
  limit,
  offset,
}: Options): Promise<PaginatedResponse<Incident>> => {
  const { data } = await api.get<PaginatedResponse<Incident>>('/incidents', {
    params: {
      status: status.length ? status : undefined,
      priority: priority.length ? priority : undefined,
      q: q || undefined,
      assignedTo: assignedTo || undefined,
      needsReview: needsReview || undefined,
      sort,
      limit,
      offset,
    },
  });

  return data;
};
