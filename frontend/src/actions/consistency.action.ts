import { api } from '@/api/api';
import type {
  ConsistencyFixResult,
  ConsistencyReport,
  FixConsistencyPayload,
} from '@/interfaces/maintenance.interface';

export const getConsistencyReportAction =
  async (): Promise<ConsistencyReport> => {
    const { data } = await api.get<ConsistencyReport>(
      '/maintenance/consistency',
    );

    return data;
  };

/**
 * `dryRun` defaults to true on the API as well: the preview is the safe path and
 * applying changes has to be requested explicitly.
 */
export const fixConsistencyAction = async (
  payload: FixConsistencyPayload,
): Promise<ConsistencyFixResult> => {
  const { data } = await api.post<ConsistencyFixResult>(
    '/maintenance/consistency/fix',
    { dryRun: true, ...payload },
  );

  return data;
};
