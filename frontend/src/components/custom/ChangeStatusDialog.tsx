import { useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';

import { ConfirmStatusChangeDialog } from '@/components/custom/ConfirmStatusChangeDialog';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useChangeIncidentStatus } from '@/hooks/useIncidentMutations';
import type { Incident, IncidentStatus } from '@/interfaces/incident.interface';
import { STATUSES_NEEDING_CONFIRMATION, STATUS_UI } from '@/lib/incident-ui';

interface Props {
  incident: Incident;
  size?: 'xs' | 'sm';
}

const isReopening = (from: IncidentStatus, to: IncidentStatus) =>
  from === 'resuelta' && to === 'abierta';

/**
 * Two sequential steps instead of a nested dialog: pick the target status, then
 * confirm it. The reachable statuses come from the API (`allowedTransitions`),
 * so the state machine is never duplicated in the client.
 */
export const ChangeStatusDialog = ({ incident, size = 'sm' }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<IncidentStatus | null>(null);

  const { mutate, isPending } = useChangeIncidentStatus();

  if (incident.allowedTransitions.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">Sin transiciones</span>
    );
  }

  const select = (status: IncidentStatus) => {
    setIsOpen(false);

    if (STATUSES_NEEDING_CONFIRMATION.includes(status)) {
      setPending(status);
      return;
    }

    mutate({ id: incident.id, status });
  };

  const confirm = (reason: string | undefined) => {
    if (!pending) return;

    mutate(
      { id: incident.id, status: pending, reason },
      { onSuccess: () => setPending(null) },
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size={size}>
            <RefreshCw aria-hidden />
            Cambiar estado
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
            <DialogDescription>{incident.title}</DialogDescription>
          </DialogHeader>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            Estado actual: <StatusBadge status={incident.status} />
          </p>

          <div className="flex flex-col gap-2">
            {incident.allowedTransitions.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="lg"
                className="justify-between"
                onClick={() => select(status)}
              >
                <span className="flex items-center gap-2">
                  <ArrowRight aria-hidden />
                  {STATUS_UI[status].label}
                </span>
                {isReopening(incident.status, status) && (
                  <span className="text-xs text-muted-foreground">
                    requiere motivo
                  </span>
                )}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remounted per target so the reason draft never leaks between changes. */}
      <ConfirmStatusChangeDialog
        key={pending ?? 'none'}
        target={pending}
        reasonRequired={pending ? isReopening(incident.status, pending) : false}
        isPending={isPending}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
};
