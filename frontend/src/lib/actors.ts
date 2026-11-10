/**
 * There is no authentication in this project, so traceability relies on a
 * simulated actor chosen in the header and attached to every mutation.
 * The list mirrors the names used by the seed so the activity feed reads
 * consistently from the first run.
 */
export const ACTORS = [
  'Marco Díaz',
  'Lucía Ortega',
  'Carmen Vidal',
  'Iván Serrano',
  'Nuria Peña',
  'Paula Lamas',
  'Rubén Castaño',
] as const;

export const DEFAULT_ACTOR = ACTORS[0];

export const ACTOR_STORAGE_KEY = 'optima-retail.actor';
