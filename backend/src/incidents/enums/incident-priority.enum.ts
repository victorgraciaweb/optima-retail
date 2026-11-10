/**
 * Operational priority of an incident. Ordered from lowest to highest so the
 * declaration order can be reused for sorting if needed.
 */
export enum IncidentPriority {
  Baja = 'baja',
  Media = 'media',
  Alta = 'alta',
  Critica = 'critica',
}
