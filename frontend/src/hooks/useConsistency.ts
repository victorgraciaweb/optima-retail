import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  fixConsistencyAction,
  getConsistencyReportAction,
} from '@/actions/consistency.action';
import { getApiErrorMessage } from '@/api/api';
import { useActor } from '@/hooks/useActor';

export const useConsistencyReport = () =>
  useQuery({
    queryKey: ['maintenance', 'consistency'],
    queryFn: getConsistencyReportAction,
  });

/**
 * Both the preview and the real run go through here. `dryRun: false` is the only
 * difference, and only it invalidates incident data — a dry run writes nothing.
 */
export const useFixConsistency = () => {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: (dryRun: boolean) =>
      fixConsistencyAction({ actorName: actor, dryRun }),
    onSuccess: (result) => {
      if (result.dryRun) {
        toast.info(
          `Simulación: ${result.totalOperations} operación(es) previstas. No se ha escrito nada.`,
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success(
        `${result.totalOperations} operación(es) aplicadas · ${result.flaggedForReview} marcadas para revisión manual`,
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
};
