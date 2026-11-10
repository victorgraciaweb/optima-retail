import { EntityManager } from 'typeorm';
import { IncidentStatus } from '../../incidents/enums';
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { ConsistencyCheckDefinition, ConsistencyFinding } from './types';

/**
 * Check 1 — resolved incidents with no log introducing 'resuelta'.
 *
 * Why this detects a real problem: every resolution goes through the
 * transactional status change, which writes the incident and its log together.
 * If the final state is 'resuelta' and no log ever set that value, the status
 * was written outside that transaction — a manual UPDATE, a partial import, a
 * job that crashed between the two writes. The trace is simply missing.
 *
 * Why it is auto-fixable: the final state is an observable fact and the only
 * thing lost is its record. Reconstructing the log adds information that is
 * already known to be true, and the reconstructed row is tagged
 * (`action = consistency_fix`, `metadata.reconstructed = true`) so it can never
 * be mistaken for a genuine user action.
 *
 * `i.status::text` is required: `status` is a Postgres enum, and a bound
 * parameter arrives typed as varchar with no implicit operator between the two.
 */
export const RESOLVED_WITHOUT_RESOLUTION_LOG_SQL = `
  SELECT i.id AS "incidentId", i.title AS "incidentTitle", i.updated_at AS "updatedAt"
  FROM incidents i
  WHERE i.status::text = $1
    AND NOT EXISTS (
      SELECT 1 FROM incident_logs l
      WHERE l.incident_id = i.id AND l.new_value = $1
    )
  ORDER BY i.updated_at
`;

interface Row {
  incidentId: string;
  incidentTitle: string;
  updatedAt: Date;
}

export const resolvedWithoutResolutionLogCheck: ConsistencyCheckDefinition = {
  check: ConsistencyCheck.ResolvedWithoutResolutionLog,
  title: 'Incidencias resueltas sin log de resolución',
  description:
    'La incidencia está en estado "resuelta" pero ningún log registra esa transición. El estado se escribió fuera de la transacción que garantiza la trazabilidad.',
  autoFixable: true,
  proposedAction:
    'Reconstruir el log que falta con action="consistency_fix", new_value="resuelta" y metadata.reconstructed=true, para no confundirlo con una traza real.',

  async run(manager: EntityManager): Promise<ConsistencyFinding[]> {
    const rows = await manager.query<Row[]>(
      RESOLVED_WITHOUT_RESOLUTION_LOG_SQL,
      [IncidentStatus.Resuelta],
    );

    return rows.map((row) => ({
      incidentId: row.incidentId,
      incidentTitle: row.incidentTitle,
      detail: {
        currentStatus: IncidentStatus.Resuelta,
        missingLogValue: IncidentStatus.Resuelta,
        inferredAt: row.updatedAt,
      },
    }));
  },
};
