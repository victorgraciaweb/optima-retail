import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { brokenLogChainCheck } from './broken-log-chain.query';
import { duplicatedLogsCheck } from './duplicated-logs.query';
import { resolvedWithoutResolutionLogCheck } from './resolved-without-resolution-log.query';
import { statusMismatchWithLastLogCheck } from './status-mismatch-with-last-log.query';
import { ConsistencyCheckDefinition } from './types';

export type { ConsistencyCheckDefinition, ConsistencyFinding } from './types';
export { resolvedWithoutResolutionLogCheck } from './resolved-without-resolution-log.query';
export { statusMismatchWithLastLogCheck } from './status-mismatch-with-last-log.query';
export { duplicatedLogsCheck } from './duplicated-logs.query';
export { brokenLogChainCheck } from './broken-log-chain.query';

/**
 * Registry of every check, in execution order.
 *
 * Auto-fixable checks come first on purpose: repairing them can remove the
 * cause of a later finding (a reconstructed resolution log makes check 2
 * consistent; deduplicating logs repairs the chain for check 3b), so running
 * them first keeps the fix plan from touching rows that no longer need it.
 */
export const CONSISTENCY_CHECKS: readonly ConsistencyCheckDefinition[] = [
  resolvedWithoutResolutionLogCheck,
  duplicatedLogsCheck,
  statusMismatchWithLastLogCheck,
  brokenLogChainCheck,
];

export const CONSISTENCY_CHECKS_BY_KEY: Readonly<
  Record<ConsistencyCheck, ConsistencyCheckDefinition>
> = Object.fromEntries(
  CONSISTENCY_CHECKS.map((definition) => [definition.check, definition]),
) as Record<ConsistencyCheck, ConsistencyCheckDefinition>;
