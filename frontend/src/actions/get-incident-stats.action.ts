import { api } from '@/api/api';
import type { IncidentStats } from '@/interfaces/incident.interface';

export const getIncidentStatsAction = async (): Promise<IncidentStats> => {
  const { data } = await api.get<IncidentStats>('/incidents/stats');

  return data;
};
