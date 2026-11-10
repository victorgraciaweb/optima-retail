export type ConsistencyCheck =
  | 'resolved_without_resolution_log'
  | 'status_mismatch_with_last_log'
  | 'duplicated_logs'
  | 'broken_log_chain';

export type FixOperationKind =
  | 'reconstruct_log'
  | 'delete_duplicate_logs'
  | 'flag_for_review';

export interface ConsistencyFinding {
  incidentId: string;
  incidentTitle: string;
  detail: Record<string, unknown>;
}

export interface ConsistencyCheckReport {
  check: ConsistencyCheck;
  title: string;
  description: string;
  autoFixable: boolean;
  proposedAction: string;
  count: number;
  findings: ConsistencyFinding[];
}

export interface ConsistencyReport {
  generatedAt: string;
  totalFindings: number;
  autoFixableFindings: number;
  manualReviewFindings: number;
  checks: ConsistencyCheckReport[];
  note: string;
}

export interface ConsistencyFixOperation {
  check: ConsistencyCheck;
  kind: FixOperationKind;
  incidentId: string;
  incidentTitle: string;
  description: string;
  applied: boolean;
}

export interface ConsistencyFixResult {
  dryRun: boolean;
  actorName: string;
  executedAt: string;
  totalOperations: number;
  flaggedForReview: number;
  operations: ConsistencyFixOperation[];
}

export interface FixConsistencyPayload {
  actorName: string;
  dryRun?: boolean;
  checks?: ConsistencyCheck[];
}
