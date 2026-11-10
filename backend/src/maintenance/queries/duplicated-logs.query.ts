import { EntityManager } from 'typeorm';
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { ConsistencyCheckDefinition, ConsistencyFinding } from './types';

/**
 * Check 3a — exact duplicate log entries.
 *
 * Why this detects a real problem: a transition is a unique event. The same
 * incident cannot have moved from the same origin to the same destination
 * twice in a row, so two rows sharing
 * (incident_id, action, old_value, new_value) are a retried or double-submitted
 * write, not two facts.
 *
 * Why it is auto-fixable: the duplicates are demonstrable noise. Keeping the
 * oldest row preserves the original timestamp — the moment the change actually
 * happened — and deleting the rest removes only redundant copies, so no
 * information is lost.
 *
 * `IS NOT DISTINCT FROM` instead of `=` on the value columns: `old_value` is
 * NULL for `created` entries, and `NULL = NULL` would not group them.
 */
export const DUPLICATED_LOGS_SQL = `
  SELECT
    l.incident_id AS "incidentId",
    i.title       AS "incidentTitle",
    l.action::text AS "action",
    l.old_value   AS "oldValue",
    l.new_value   AS "newValue",
    COUNT(*)::int AS "occurrences",
    ARRAY_AGG(l.id ORDER BY l.created_at, l.id)         AS "logIds",
    ARRAY_AGG(l.created_at ORDER BY l.created_at, l.id) AS "timestamps"
  FROM incident_logs l
  JOIN incidents i ON i.id = l.incident_id
  GROUP BY l.incident_id, i.title, l.action, l.old_value, l.new_value
  HAVING COUNT(*) > 1
  ORDER BY i.title
`;

interface Row {
  incidentId: string;
  incidentTitle: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  occurrences: number;
  logIds: string[];
  timestamps: Date[];
}

export const duplicatedLogsCheck: ConsistencyCheckDefinition = {
  check: ConsistencyCheck.DuplicatedLogs,
  title: 'Logs duplicados exactos',
  description:
    'Dos o más logs idénticos (misma incidencia, acción, valor anterior y valor nuevo). Una misma transición no puede haber ocurrido dos veces.',
  autoFixable: true,
  proposedAction:
    'Conservar el log más antiguo de cada grupo (mantiene el momento real del cambio) y borrar las copias restantes.',

  async run(manager: EntityManager): Promise<ConsistencyFinding[]> {
    const rows = await manager.query<Row[]>(DUPLICATED_LOGS_SQL);

    return rows.map((row) => {
      const [keep, ...remove] = row.logIds;

      return {
        incidentId: row.incidentId,
        incidentTitle: row.incidentTitle,
        detail: {
          action: row.action,
          oldValue: row.oldValue,
          newValue: row.newValue,
          occurrences: row.occurrences,
          timestamps: row.timestamps,
          keepLogId: keep,
          removeLogIds: remove,
        },
      };
    });
  },
};
