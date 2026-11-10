import type {
  IncidentLogAction,
  IncidentPriority,
  IncidentSort,
  IncidentStatus,
} from '@/interfaces/incident.interface';

/**
 * Single source of truth for how the domain is shown.
 *
 * Every label, colour and icon hint for a status or priority is resolved here,
 * so no page or component ever writes a status colour by hand and adding a
 * status is a one-file change.
 */
interface StatusPresentation {
  label: string;
  /** Classes for the status badge. Kept here, never inline in a view. */
  badgeClassName: string;
  /** Classes for the row/card of an incident in this status. */
  rowClassName: string;
}

export const STATUS_UI: Record<IncidentStatus, StatusPresentation> = {
  abierta: {
    label: 'Abierta',
    badgeClassName:
      'border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
    rowClassName: '',
  },
  en_revision: {
    label: 'En revisión',
    badgeClassName:
      'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    rowClassName: '',
  },
  bloqueada: {
    label: 'Bloqueada',
    badgeClassName:
      'border-red-300 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
    rowClassName:
      'bg-red-50/70 hover:bg-red-100/70 dark:bg-red-950/30 dark:hover:bg-red-950/50',
  },
  resuelta: {
    label: 'Resuelta',
    badgeClassName:
      'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    rowClassName: 'opacity-75',
  },
};

interface PriorityPresentation {
  label: string;
  badgeClassName: string;
}

export const PRIORITY_UI: Record<IncidentPriority, PriorityPresentation> = {
  baja: {
    label: 'Baja',
    badgeClassName: 'border-border bg-muted text-muted-foreground',
  },
  media: {
    label: 'Media',
    badgeClassName:
      'border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  },
  alta: {
    label: 'Alta',
    badgeClassName:
      'border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200',
  },
  critica: {
    label: 'Crítica',
    badgeClassName:
      'border-red-400 bg-red-200 text-red-950 dark:border-red-800 dark:bg-red-900 dark:text-red-100',
  },
};

export const LOG_ACTION_LABELS: Record<IncidentLogAction, string> = {
  created: 'Incidencia creada',
  status_changed: 'Cambio de estado',
  reopened: 'Reapertura',
  commented: 'Comentario',
  consistency_fix: 'Corrección de consistencia',
};

export const SORT_LABELS: Record<IncidentSort, string> = {
  'created_at:desc': 'Más recientes primero',
  'created_at:asc': 'Más antiguas primero',
  'updated_at:desc': 'Actualizadas recientemente',
  'due_at:asc': 'Vencimiento más próximo',
  'priority:desc': 'Prioridad más alta',
};

/** Statuses whose transition is irreversible enough to deserve a confirmation. */
export const STATUSES_NEEDING_CONFIRMATION: IncidentStatus[] = [
  'bloqueada',
  'resuelta',
  'abierta',
];

/**
 * An incident is overdue when its deadline has passed and it is still open in
 * any form. A resolved incident past its due date is history, not a problem.
 */
export const isOverdue = (incident: {
  dueAt: string | null;
  status: IncidentStatus;
}): boolean =>
  incident.dueAt !== null &&
  incident.status !== 'resuelta' &&
  new Date(incident.dueAt).getTime() < Date.now();

export const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
