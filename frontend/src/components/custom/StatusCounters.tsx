import { Link } from 'react-router';
import { AlertTriangle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIncidentStats } from '@/hooks/useIncidentStats';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import { INCIDENT_STATUSES } from '@/interfaces/incident.interface';
import { STATUS_UI } from '@/lib/incident-ui';
import { cn } from '@/lib/utils';

/**
 * Visual counter per status. Doubles as a quick filter: clicking a counter sets
 * the status filter in the URL, which is what drives the list.
 */
export const StatusCounters = () => {
  const { data, isLoading } = useIncidentStats();
  const { filters, setStatus } = useIncidentFilters();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {INCIDENT_STATUSES.map((status) => (
          <Skeleton key={status} className="h-20" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section aria-label="Resumen por estado" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {INCIDENT_STATUSES.map((status) => {
          const isActive =
            filters.status.length === 1 && filters.status[0] === status;

          return (
            <button
              key={status}
              type="button"
              aria-pressed={isActive}
              onClick={() => setStatus(isActive ? [] : [status])}
              className={cn(
                'border bg-card p-3 text-left transition-colors hover:bg-muted',
                isActive && 'border-foreground bg-muted',
              )}
            >
              <p className="text-xs text-muted-foreground">
                {STATUS_UI[status].label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {data.byStatus[status]}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{data.total} en total</span>

        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {data.overdue} vencida(s)
        </span>

        {data.needsReview > 0 && (
          <Button asChild variant="ghost" size="xs" className="text-destructive">
            <Link to="/maintenance">
              <AlertTriangle aria-hidden />
              {data.needsReview} pendiente(s) de revisión
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
};
