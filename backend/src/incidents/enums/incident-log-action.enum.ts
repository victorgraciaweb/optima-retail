/**
 * Kind of traceable event recorded in `incident_logs`.
 *
 * `Reopened` is kept apart from `StatusChanged` on purpose: reopening a
 * resolved incident is the only transition that walks the lifecycle backwards,
 * so it must be auditable without parsing old/new values.
 *
 * `ConsistencyFix` marks rows written by the maintenance endpoints rather than
 * by a real user action, so a reconstructed trace is never mistaken for a
 * genuine one.
 */
export enum IncidentLogAction {
  Created = 'created',
  StatusChanged = 'status_changed',
  Reopened = 'reopened',
  Commented = 'commented',
  ConsistencyFix = 'consistency_fix',
}
