import { EntityManager } from 'typeorm';
import { ConsistencyCheck } from '../enums/consistency-check.enum';

/**
 * One detected inconsistency.
 *
 * `incidentId` is always present so the report can link straight to the
 * incident; `detail` carries the check-specific evidence (conflicting values,
 * affected log ids) and is rendered as-is by the maintenance screen.
 */
export interface ConsistencyFinding {
  incidentId: string;
  incidentTitle: string;
  detail: Record<string, unknown>;
}

/**
 * A check is a pure read: a SQL query plus the metadata the report needs to
 * explain what it found and what, if anything, can be done about it.
 *
 * Keeping them as plain objects (not Nest providers) means each one can be
 * executed against any EntityManager — the request's, or the one inside the
 * fix transaction — without the DI container getting in the way.
 */
export interface ConsistencyCheckDefinition {
  check: ConsistencyCheck;
  /** Short human-readable name, shown as the group heading. */
  title: string;
  /** What the query detects and why that indicates corruption. */
  description: string;
  /** Whether the inconsistency can be repaired without inventing data. */
  autoFixable: boolean;
  /** What the fix does, or why it is left to a human. */
  proposedAction: string;
  run(manager: EntityManager): Promise<ConsistencyFinding[]>;
}
