/**
 * Identifier of each consistency check.
 *
 * Used as the grouping key in the report and as the filter accepted by the fix
 * endpoint, so an operator can apply one check at a time instead of all of them.
 */
export enum ConsistencyCheck {
  ResolvedWithoutResolutionLog = 'resolved_without_resolution_log',
  StatusMismatchWithLastLog = 'status_mismatch_with_last_log',
  DuplicatedLogs = 'duplicated_logs',
  BrokenLogChain = 'broken_log_chain',
}
