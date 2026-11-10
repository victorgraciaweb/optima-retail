import { api } from '@/api/api';
import type {
  CreateIncidentPayload,
  Incident,
} from '@/interfaces/incident.interface';

export const createIncidentAction = async (
  payload: CreateIncidentPayload,
): Promise<Incident> => {
  const { data } = await api.post<Incident>('/incidents', payload);

  return data;
};
