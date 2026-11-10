import { IncidentPriority, IncidentStatus } from '../../incidents/enums';

/**
 * One seeded incident: the incident itself plus the status path it walked.
 *
 * `path` lists the statuses *after* creation, in order. The seed replays it to
 * build a coherent log chain (each entry's old value is the previous new
 * value), which is exactly what the consistency checks expect to find.
 */
export interface CleanIncidentSeed {
  title: string;
  description: string;
  priority: IncidentPriority;
  requesterName: string;
  assignedTo: string | null;
  /** Days from now. Negative is already overdue; null means no deadline. */
  dueInDays: number | null;
  /** Hours ago the incident was created. */
  createdHoursAgo: number;
  path: IncidentStatus[];
  actorName: string;
  comments: { authorName: string; body: string; hoursAgo: number }[];
}

export const CLEAN_INCIDENTS: CleanIncidentSeed[] = [
  {
    title: 'La caja 3 no imprime tickets',
    description:
      'Desde la apertura, la impresora de la caja 3 no responde. Se ha reiniciado el terminal sin efecto y los clientes salen sin ticket.',
    priority: IncidentPriority.Alta,
    requesterName: 'Lucía Ortega',
    assignedTo: 'Marco Díaz',
    dueInDays: 2,
    createdHoursAgo: 30,
    path: [IncidentStatus.EnRevision],
    actorName: 'Lucía Ortega',
    comments: [
      {
        authorName: 'Marco Díaz',
        body: 'Confirmado: el cabezal de impresión está bloqueado. Pido recambio al proveedor.',
        hoursAgo: 26,
      },
    ],
  },
  {
    title: 'Diferencia de stock en la referencia 884120',
    description:
      'El inventario del sistema marca 42 unidades y en el almacén hay 37. La diferencia aparece tras la recepción del lunes.',
    priority: IncidentPriority.Media,
    requesterName: 'Nuria Peña',
    assignedTo: 'Iván Serrano',
    dueInDays: 5,
    createdHoursAgo: 72,
    path: [IncidentStatus.EnRevision, IncidentStatus.Resuelta],
    actorName: 'Nuria Peña',
    comments: [
      {
        authorName: 'Iván Serrano',
        body: 'Cinco unidades estaban en la zona de devoluciones sin registrar. Regularizado.',
        hoursAgo: 48,
      },
    ],
  },
  {
    title: 'El TPV de la tienda de Chamberí pierde conexión',
    description:
      'Cortes intermitentes de red durante las horas punta. Cada corte obliga a reiniciar el cobro y duplica la cola.',
    priority: IncidentPriority.Critica,
    requesterName: 'Rubén Castaño',
    assignedTo: 'Marco Díaz',
    // Deliberately in the past: exercises the "overdue" highlight in the UI.
    dueInDays: -1,
    createdHoursAgo: 96,
    path: [IncidentStatus.EnRevision, IncidentStatus.Bloqueada],
    actorName: 'Rubén Castaño',
    comments: [
      {
        authorName: 'Marco Díaz',
        body: 'Bloqueada: depende de la visita del operador de fibra, prevista para el viernes.',
        hoursAgo: 60,
      },
    ],
  },
  {
    title: 'Etiquetas de precio desactualizadas en lineal de bebidas',
    description:
      'Las etiquetas del lineal 12 muestran el precio de la promoción anterior, ya finalizada.',
    priority: IncidentPriority.Baja,
    requesterName: 'Paula Lamas',
    assignedTo: null,
    dueInDays: null,
    createdHoursAgo: 12,
    path: [],
    actorName: 'Paula Lamas',
    comments: [],
  },
  {
    title: 'El lector de códigos de la caja 1 falla con códigos largos',
    description:
      'Los EAN de 13 dígitos se leen bien, pero los códigos internos de 18 dígitos devuelven error de lectura.',
    priority: IncidentPriority.Media,
    requesterName: 'Lucía Ortega',
    assignedTo: 'Iván Serrano',
    dueInDays: -3,
    createdHoursAgo: 120,
    path: [IncidentStatus.EnRevision],
    actorName: 'Lucía Ortega',
    comments: [],
  },
  {
    title: 'Solicitud de alta de proveedor: Frutas del Sur S.L.',
    description:
      'Alta de proveedor con contrato firmado el 2 de noviembre. Falta cargar los datos fiscales en el ERP.',
    priority: IncidentPriority.Baja,
    requesterName: 'Carmen Vidal',
    assignedTo: 'Carmen Vidal',
    dueInDays: 9,
    createdHoursAgo: 8,
    path: [],
    actorName: 'Carmen Vidal',
    comments: [],
  },
  {
    title: 'Cámara frigorífica 2 por encima de temperatura',
    description:
      'La sonda marca 6 °C sostenidos frente a los 4 °C de consigna. Producto fresco en riesgo.',
    priority: IncidentPriority.Critica,
    requesterName: 'Rubén Castaño',
    assignedTo: 'Marco Díaz',
    dueInDays: 1,
    createdHoursAgo: 20,
    path: [IncidentStatus.EnRevision, IncidentStatus.Bloqueada],
    actorName: 'Rubén Castaño',
    comments: [
      {
        authorName: 'Marco Díaz',
        body: 'Compresor averiado. Producto trasladado a la cámara 1 mientras llega el técnico.',
        hoursAgo: 14,
      },
    ],
  },
  {
    title: 'Pedido 2026-11-0041 recibido incompleto',
    description:
      'Faltan 3 de las 12 cajas del albarán. El transportista no registra incidencia en su parte.',
    priority: IncidentPriority.Alta,
    requesterName: 'Nuria Peña',
    assignedTo: 'Carmen Vidal',
    dueInDays: 4,
    createdHoursAgo: 50,
    // Reopened after resolution: gives the timeline a `reopened` entry to show.
    path: [
      IncidentStatus.EnRevision,
      IncidentStatus.Resuelta,
      IncidentStatus.Abierta,
    ],
    actorName: 'Nuria Peña',
    comments: [
      {
        authorName: 'Nuria Peña',
        body: 'El proveedor confirma que las 3 cajas salieron. Reabro para reclamar al transportista.',
        hoursAgo: 10,
      },
    ],
  },
];
