import { Link } from 'react-router';
import { AlertTriangle, History } from 'lucide-react';

import { ChangeStatusDialog } from '@/components/custom/ChangeStatusDialog';
import { PriorityBadge } from '@/components/custom/PriorityBadge';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Incident } from '@/interfaces/incident.interface';
import { STATUS_UI, formatDate, isOverdue } from '@/lib/incident-ui';
import { cn } from '@/lib/utils';

interface Props {
  incidents: Incident[];
}

/** Desktop presentation. Same data as IncidentCardList, different layout. */
export const IncidentsTable = ({ incidents }: Props) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Incidencia</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Prioridad</TableHead>
        <TableHead>Solicitante / responsable</TableHead>
        <TableHead>Fechas</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      {incidents.map((incident) => {
        const overdue = isOverdue(incident);

        return (
          <TableRow
            key={incident.id}
            className={cn(
              STATUS_UI[incident.status].rowClassName,
              overdue &&
                'bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/50',
            )}
          >
            <TableCell className="max-w-[320px] align-top">
              <Link
                to={`/incidents/${incident.id}`}
                className="font-medium hover:underline"
              >
                {incident.title}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {incident.description}
              </p>
              {incident.needsReview && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="size-3" aria-hidden />
                  Pendiente de revisión
                </span>
              )}
            </TableCell>

            <TableCell className="align-top">
              <StatusBadge status={incident.status} />
            </TableCell>

            <TableCell className="align-top">
              <PriorityBadge priority={incident.priority} />
            </TableCell>

            <TableCell className="align-top text-xs">
              <p>{incident.requesterName}</p>
              <p className="text-muted-foreground">
                {incident.assignedTo ?? 'Sin asignar'}
              </p>
            </TableCell>

            <TableCell className="align-top text-xs whitespace-nowrap">
              <p>Creada {formatDate(incident.createdAt)}</p>
              {incident.dueAt && (
                <p className={cn(overdue && 'font-medium text-amber-700 dark:text-amber-300')}>
                  Vence {formatDate(incident.dueAt)}
                </p>
              )}
            </TableCell>

            <TableCell className="align-top">
              <div className="flex items-center justify-end gap-2">
                <ChangeStatusDialog incident={incident} size="xs" />
                <Button asChild variant="ghost" size="xs">
                  <Link to={`/incidents/${incident.id}`}>
                    <History aria-hidden />
                    Historial
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);
