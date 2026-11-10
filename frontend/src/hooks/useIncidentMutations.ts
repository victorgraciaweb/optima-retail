import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { addIncidentCommentAction } from '@/actions/add-incident-comment.action';
import { changeIncidentStatusAction } from '@/actions/change-incident-status.action';
import { createIncidentAction } from '@/actions/create-incident.action';
import { getApiErrorMessage } from '@/api/api';
import { useActor } from '@/hooks/useActor';
import type {
  ChangeIncidentStatusPayload,
  CreateIncidentPayload,
  IncidentStatus,
} from '@/interfaces/incident.interface';
import { STATUS_UI } from '@/lib/incident-ui';

/**
 * Every mutation invalidates the whole `incidents` key: the list, the counters,
 * the detail and the activity feed all derive from the same records, and a
 * status change touches all four. One invalidation keeps the refresh rule in a
 * single place instead of per-call bookkeeping.
 */
const useInvalidateIncidents = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: ['incidents'] });
};

export const useCreateIncident = () => {
  const invalidate = useInvalidateIncidents();

  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => createIncidentAction(payload),
    onSuccess: (incident) => {
      invalidate();
      toast.success('Incidencia creada', { description: incident.title });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
};

export const useChangeIncidentStatus = () => {
  const invalidate = useInvalidateIncidents();
  const { actor } = useActor();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: { id: string; status: IncidentStatus } & Partial<
      Pick<ChangeIncidentStatusPayload, 'reason'>
    >) => changeIncidentStatusAction({ id, status, reason, actorName: actor }),
    onSuccess: (incident) => {
      invalidate();
      toast.success(`Estado actualizado a "${STATUS_UI[incident.status].label}"`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
};

export const useAddIncidentComment = (id: string) => {
  const invalidate = useInvalidateIncidents();
  const { actor } = useActor();

  return useMutation({
    mutationFn: (body: string) =>
      addIncidentCommentAction({ id, body, authorName: actor }),
    onSuccess: () => {
      invalidate();
      toast.success('Comentario añadido');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
};
