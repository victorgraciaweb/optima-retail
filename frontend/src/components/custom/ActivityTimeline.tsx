import {
  ArrowRight,
  MessageSquare,
  PlusCircle,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { StatusBadge } from '@/components/custom/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  IncidentActivityEntry,
  IncidentLogAction,
  IncidentStatus,
} from '@/interfaces/incident.interface';
import { INCIDENT_STATUSES } from '@/interfaces/incident.interface';
import { LOG_ACTION_LABELS, formatDateTime } from '@/lib/incident-ui';

interface Props {
  entries: IncidentActivityEntry[] | undefined;
  isLoading: boolean;
}

const ACTION_ICONS: Record<IncidentLogAction, LucideIcon> = {
  created: PlusCircle,
  status_changed: ArrowRight,
  reopened: RotateCcw,
  commented: MessageSquare,
  consistency_fix: Wrench,
};

/** Log values are plain strings in the API; only known statuses get a badge. */
const asStatus = (value: string | null): IncidentStatus | null =>
  value && (INCIDENT_STATUSES as readonly string[]).includes(value)
    ? (value as IncidentStatus)
    : null;

const reasonOf = (metadata: Record<string, unknown> | null): string | null =>
  typeof metadata?.reason === 'string' ? metadata.reason : null;

/**
 * Unified history: the API already merges logs and comments into one
 * chronological feed, so this component only renders.
 */
export const ActivityTimeline = ({ entries, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Todavía no hay actividad registrada.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const Icon = entry.action ? ACTION_ICONS[entry.action] : MessageSquare;
        const from = asStatus(entry.oldValue);
        const to = asStatus(entry.newValue);
        const reason = reasonOf(entry.metadata);
        const reconstructed = entry.metadata?.reconstructed === true;

        return (
          <li key={entry.id} className="border-l-2 border-border pl-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Icon className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="font-medium">
                {entry.action
                  ? LOG_ACTION_LABELS[entry.action]
                  : LOG_ACTION_LABELS.commented}
              </span>
              <span className="text-muted-foreground">
                · {entry.actorName} · {formatDateTime(entry.createdAt)}
              </span>
              {reconstructed && (
                <span className="text-muted-foreground italic">
                  (traza reconstruida)
                </span>
              )}
            </div>

            {to && (
              <div className="mt-1.5 flex items-center gap-2">
                {from && <StatusBadge status={from} />}
                {from && <ArrowRight className="size-3" aria-hidden />}
                <StatusBadge status={to} />
              </div>
            )}

            {entry.body && (
              <p className="mt-1.5 text-sm whitespace-pre-wrap">{entry.body}</p>
            )}

            {reason && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Motivo: {reason}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};
