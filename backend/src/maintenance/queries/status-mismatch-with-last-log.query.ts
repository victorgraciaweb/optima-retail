import { EntityManager } from 'typeorm';
import { IncidentStatus } from '../../incidents/enums';
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { ConsistencyCheckDefinition, ConsistencyFinding } from './types';

/**
 * Check 2 — current status differs from the status set by the last log.
 *
 * Why this detects a real problem: the most recent log that carries a
 * `new_value` is, by definition, the one that set the current status. If the
 * two disagree, either a log was lost or the status column was overwritten
 * without recording it.
 *
 * Why it is NOT auto-fixable: the data does not say which side is the truth.
 * Trusting the status would discard a transition that may really have
 * happened; trusting the log would silently revert an incident that an
 * operator may have moved on purpose. Picking either one destroys information,
 * so the incident is flagged (`needs_review`) for a human to resolve.
 *
 * The `NOT (...)` clause excludes rows already reported by check 1: there the
 * mismatch is a *consequence* of the missing resolution log, and reconstructing
 * that log makes the row consistent again. Without the exclusion the same
 * incident would appear in two groups with contradictory advice.
 *
 * `i.status::text` is required: `status` is a Postgres enum and `new_value` is
 * varchar, and there is no implicit operator between the two types.
 */
export const STATUS_MISMATCH_WITH_LAST_LOG_SQL = `
  SELECT
    i.id            AS "incidentId",
    i.title         AS "incidentTitle",
    i.status::text  AS "currentStatus",
    last_log.new_value  AS "lastLoggedStatus",
    last_log.created_at AS "lastLoggedAt"
  FROM incidents i
  JOIN LATERAL (
    SELECT l.new_value, l.created_at
    FROM incident_logs l
    WHERE l.incident_id = i.id AND l.new_value IS NOT NULL
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT 1
  ) AS last_log ON TRUE
  WHERE i.status::text <> last_log.new_value
    AND NOT (
      i.status::text = $1
      AND NOT EXISTS (
        SELECT 1 FROM incident_logs l2
        WHERE l2.incident_id = i.id AND l2.new_value = $1
      )
    )
  ORDER BY last_log.created_at
`;

interface Row {
  incidentId: string;
  incidentTitle: string;
  currentStatus: string;
  lastLoggedStatus: string;
  lastLoggedAt: Date;
}

export const statusMismatchWithLastLogCheck: ConsistencyCheckDefinition = {
  check: ConsistencyCheck.StatusMismatchWithLastLog,
  title: 'Estado actual distinto del último log',
  description:
    'El último log con valor de estado no coincide con el estado de la incidencia: o se perdió un log, o se modificó el estado sin registrarlo.',
  autoFixable: false,
  proposedAction:
    'No se corrige automáticamente: no hay información para saber si la verdad es el estado o el log. Se marca needs_review=true con el motivo para revisión manual.',

  async run(manager: EntityManager): Promise<ConsistencyFinding[]> {
    const rows = await manager.query<Row[]>(STATUS_MISMATCH_WITH_LAST_LOG_SQL, [
      IncidentStatus.Resuelta,
    ]);

    return rows.map((row) => ({
      incidentId: row.incidentId,
      incidentTitle: row.incidentTitle,
      detail: {
        currentStatus: row.currentStatus,
        lastLoggedStatus: row.lastLoggedStatus,
        lastLoggedAt: row.lastLoggedAt,
      },
    }));
  },
};
