import { EntityManager } from 'typeorm';
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { ConsistencyCheckDefinition, ConsistencyFinding } from './types';

/**
 * Check 3b — the log chain does not link up.
 *
 * Why this detects a real problem: each status change records where it came
 * from, so a log's `old_value` must equal the `new_value` of the previous log
 * of that incident. When it does not, an intermediate log is missing or one of
 * them was written with the wrong values.
 *
 * Why it is NOT auto-fixable: repairing the chain means inventing the missing
 * transition — who made it, when, and from which state. Writing a log nobody
 * can vouch for is worse than an acknowledged gap, because it looks like
 * evidence. The incident is flagged for manual review instead.
 *
 * The `duplicated` CTE excludes logs that belong to an exact-duplicate group:
 * a duplicate inevitably breaks the chain (the copy's `old_value` no longer
 * follows its twin's `new_value`), and that is already reported — and
 * repaired — by check 3a. Without the exclusion every duplicate would also
 * show up here as an unfixable problem.
 */
export const BROKEN_LOG_CHAIN_SQL = `
  WITH duplicated AS (
    SELECT l.id
    FROM incident_logs l
    JOIN (
      SELECT incident_id, action, old_value, new_value
      FROM incident_logs
      GROUP BY incident_id, action, old_value, new_value
      HAVING COUNT(*) > 1
    ) d
      ON d.incident_id = l.incident_id
     AND d.action = l.action
     AND d.old_value IS NOT DISTINCT FROM l.old_value
     AND d.new_value IS NOT DISTINCT FROM l.new_value
  ),
  chain AS (
    SELECT
      l.id,
      l.incident_id,
      l.old_value,
      l.created_at,
      LAG(l.new_value) OVER (
        PARTITION BY l.incident_id ORDER BY l.created_at, l.id
      ) AS previous_new_value
    FROM incident_logs l
    WHERE l.new_value IS NOT NULL
      AND l.id NOT IN (SELECT id FROM duplicated)
  )
  SELECT
    c.incident_id         AS "incidentId",
    i.title               AS "incidentTitle",
    c.id                  AS "logId",
    c.old_value           AS "oldValue",
    c.previous_new_value  AS "previousNewValue",
    c.created_at          AS "loggedAt"
  FROM chain c
  JOIN incidents i ON i.id = c.incident_id
  WHERE c.previous_new_value IS NOT NULL
    AND c.old_value <> c.previous_new_value
  ORDER BY c.created_at
`;

interface Row {
  incidentId: string;
  incidentTitle: string;
  logId: string;
  oldValue: string;
  previousNewValue: string;
  loggedAt: Date;
}

export const brokenLogChainCheck: ConsistencyCheckDefinition = {
  check: ConsistencyCheck.BrokenLogChain,
  title: 'Cadena de logs rota',
  description:
    'El old_value de un log no coincide con el new_value del log anterior de esa incidencia: falta un log intermedio o alguno se escribió con valores erróneos.',
  autoFixable: false,
  proposedAction:
    'No se corrige automáticamente: reconstruir el log ausente exigiría inventar actor, fecha y estado de origen. Se marca needs_review=true con el motivo.',

  async run(manager: EntityManager): Promise<ConsistencyFinding[]> {
    const rows = await manager.query<Row[]>(BROKEN_LOG_CHAIN_SQL);

    return rows.map((row) => ({
      incidentId: row.incidentId,
      incidentTitle: row.incidentTitle,
      detail: {
        logId: row.logId,
        expectedOldValue: row.previousNewValue,
        actualOldValue: row.oldValue,
        loggedAt: row.loggedAt,
      },
    }));
  },
};
