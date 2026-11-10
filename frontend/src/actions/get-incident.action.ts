import { api } from '@/api/api';
import type { Incident } from '@/interfaces/incident.interface';

export const getIncidentAction = async (id: string): Promise<Incident> => {
  const { data } = await api.get<Incident>(`/incidents/${id}`);

  return data;
};
