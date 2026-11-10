import { api } from '@/api/api';
import type {
  ChangeIncidentStatusPayload,
  Incident,
} from '@/interfaces/incident.interface';

interface Options extends ChangeIncidentStatusPayload {
  id: string;
}

export const changeIncidentStatusAction = async ({
  id,
  ...payload
}: Options): Promise<Incident> => {
  const { data } = await api.patch<Incident>(
    `/incidents/${id}/status`,
    payload,
  );

  return data;
};
