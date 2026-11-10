import { Link } from 'react-router';
import { AlertTriangle, History } from 'lucide-react';

import { ChangeStatusDialog } from '@/components/custom/ChangeStatusDialog';
import { PriorityBadge } from '@/components/custom/PriorityBadge';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Incident } from '@/interfaces/incident.interface';
import { STATUS_UI, formatDate, isOverdue } from '@/lib/incident-ui';
import { cn } from '@/lib/utils';

interface Props {
  incidents: Incident[];
}

/** Mobile presentation of the same list. */
export const IncidentCardList = ({ incidents }: Props) => (
  <ul className="space-y-3">
    {incidents.map((incident) => {
      const overdue = isOverdue(incident);

      return (
        <li key={incident.id}>
          <Card
            className={cn(
              STATUS_UI[incident.status].rowClassName,
              overdue && 'bg-amber-50/70 dark:bg-amber-950/30',
            )}
          >
            <CardHeader>
              <CardTitle className="text-sm">
                <Link
                  to={`/incidents/${incident.id}`}
                  className="hover:underline"
                >
                  {incident.title}
                </Link>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge status={incident.status} />
                <PriorityBadge priority={incident.priority} />
                {incident.needsReview && (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="size-3" aria-hidden />
                    Revisión
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <p className="line-clamp-3 text-muted-foreground">
                {incident.description}
              </p>

              <dl className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground">Solicitante</dt>
                <dd>{incident.requesterName}</dd>
                <dt className="text-muted-foreground">Responsable</dt>
                <dd>{incident.assignedTo ?? 'Sin asignar'}</dd>
                <dt className="text-muted-foreground">Creada</dt>
                <dd>{formatDate(incident.createdAt)}</dd>
                {incident.dueAt && (
                  <>
                    <dt className="text-muted-foreground">Vence</dt>
                    <dd
                      className={cn(
                        overdue && 'font-medium text-amber-700 dark:text-amber-300',
                      )}
                    >
                      {formatDate(incident.dueAt)}
                    </dd>
                  </>
                )}
              </dl>

              <div className="flex flex-wrap items-center gap-2">
                <ChangeStatusDialog incident={incident} size="xs" />
                <Button asChild variant="ghost" size="xs">
                  <Link to={`/incidents/${incident.id}`}>
                    <History aria-hidden />
                    Historial
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      );
    })}
  </ul>
);
