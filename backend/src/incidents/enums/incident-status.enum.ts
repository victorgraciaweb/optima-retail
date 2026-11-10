/**
 * Lifecycle states of an incident.
 *
 * Keys are English (code convention), values are Spanish because they are
 * domain values surfaced verbatim in the UI and persisted in the database.
 * This enum is the single source of truth: no status literal may be written
 * by hand anywhere else in the backend.
 */
export enum IncidentStatus {
  Abierta = 'abierta',
  EnRevision = 'en_revision',
  Bloqueada = 'bloqueada',
  Resuelta = 'resuelta',
}
