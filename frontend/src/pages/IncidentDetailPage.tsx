import { Link, useParams } from 'react-router';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { ActivityTimeline } from '@/components/custom/ActivityTimeline';
import { ChangeStatusDialog } from '@/components/custom/ChangeStatusDialog';
import { CommentForm } from '@/components/custom/CommentForm';
import { PriorityBadge } from '@/components/custom/PriorityBadge';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/api/api';
import { useIncident } from '@/hooks/useIncident';
import { useIncidentActivity } from '@/hooks/useIncidentActivity';
import { formatDateTime, isOverdue } from '@/lib/incident-ui';

export const IncidentDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: incident, isLoading, isError, error } = useIncident(id);
  const { data: activity, isLoading: isActivityLoading } =
    useIncidentActivity(id);

  if (isLoading) return <Skeleton className="h-64" />;

  if (isError || !incident) {
    return (
      <div className="space-y-4">
        <p className="border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {isError ? getApiErrorMessage(error) : 'Incidencia no encontrada.'}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <ArrowLeft aria-hidden />
            Volver al listado
          </Link>
        </Button>
      </div>
    );
  }

  const overdue = isOverdue(incident);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/">
          <ArrowLeft aria-hidden />
          Volver al listado
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{incident.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <StatusBadge status={incident.status} />
              <PriorityBadge priority={incident.priority} />
              {overdue && (
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Vencida
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {incident.needsReview && (
              <p className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  Marcada para revisión manual.
                  {incident.reviewReason ? ` ${incident.reviewReason}` : ''}
                </span>
              </p>
            )}

            <p className="text-sm whitespace-pre-wrap">
              {incident.description}
            </p>

            <Separator />

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <dt className="text-muted-foreground">Solicitante</dt>
              <dd>{incident.requesterName}</dd>
              <dt className="text-muted-foreground">Responsable</dt>
              <dd>{incident.assignedTo ?? 'Sin asignar'}</dd>
              <dt className="text-muted-foreground">Creada</dt>
              <dd>{formatDateTime(incident.createdAt)}</dd>
              <dt className="text-muted-foreground">Última actualización</dt>
              <dd>{formatDateTime(incident.updatedAt)}</dd>
              {incident.dueAt && (
                <>
                  <dt className="text-muted-foreground">Vencimiento</dt>
                  <dd>{formatDateTime(incident.dueAt)}</dd>
                </>
              )}
            </dl>

            <ChangeStatusDialog incident={incident} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historial y comentarios
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <CommentForm incidentId={incident.id} />
            <Separator />
            <ActivityTimeline
              entries={activity}
              isLoading={isActivityLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
