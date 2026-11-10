import { api } from '@/api/api';
import type {
  AddIncidentCommentPayload,
  IncidentComment,
} from '@/interfaces/incident.interface';

interface Options extends AddIncidentCommentPayload {
  id: string;
}

export const addIncidentCommentAction = async ({
  id,
  ...payload
}: Options): Promise<IncidentComment> => {
  const { data } = await api.post<IncidentComment>(
    `/incidents/${id}/comments`,
    payload,
  );

  return data;
};
