/**
 * Mirror of the backend domain enums (`src/incidents/enums`).
 *
 * Declared as const tuples instead of TS enums: `erasableSyntaxOnly` is on, and
 * the arrays double as the iteration source for filters and selects, so adding a
 * status in one place updates the whole UI.
 */
export const INCIDENT_STATUSES = [
  'abierta',
  'en_revision',
  'bloqueada',
  'resuelta',
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_PRIORITIES = ['baja', 'media', 'alta', 'critica'] as const;

export type IncidentPriority = (typeof INCIDENT_PRIORITIES)[number];

export type IncidentLogAction =
  | 'created'
  | 'status_changed'
  | 'reopened'
  | 'commented'
  | 'consistency_fix';

export type IncidentSort =
  | 'created_at:desc'
  | 'created_at:asc'
  | 'updated_at:desc'
  | 'due_at:asc'
  | 'priority:desc';

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  requesterName: string;
  assignedTo: string | null;
  dueAt: string | null;
  needsReview: boolean;
  reviewReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Statuses reachable from the current one. The state machine lives in the API. */
  allowedTransitions: IncidentStatus[];
}

export interface IncidentActivityEntry {
  type: 'log' | 'comment';
  id: string;
  action: IncidentLogAction | null;
  oldValue: string | null;
  newValue: string | null;
  actorName: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface IncidentStats {
  byStatus: Record<IncidentStatus, number>;
  total: number;
  overdue: number;
  needsReview: number;
}

/** Filters that live in the URL. */
export interface IncidentFilters {
  status: IncidentStatus[];
  priority: IncidentPriority[];
  q: string;
  assignedTo: string;
  sort: IncidentSort;
  needsReview: boolean;
  page: number;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  priority: IncidentPriority;
  requesterName: string;
  assignedTo?: string;
  dueAt?: string;
  actorName: string;
}

export interface ChangeIncidentStatusPayload {
  status: IncidentStatus;
  actorName: string;
  reason?: string;
}

export interface AddIncidentCommentPayload {
  authorName: string;
  body: string;
}

/** Field limits enforced by the API DTOs, re-declared to validate before sending. */
export const INCIDENT_LIMITS = {
  title: 180,
  description: 5000,
  name: 120,
  commentBody: 2000,
  reason: 500,
} as const;
