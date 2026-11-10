import { api } from '@/api/api';
import type { IncidentActivityEntry } from '@/interfaces/incident.interface';

export const getIncidentActivityAction = async (
  id: string,
): Promise<IncidentActivityEntry[]> => {
  const { data } = await api.get<IncidentActivityEntry[]>(
    `/incidents/${id}/activity`,
  );

  return data;
};
