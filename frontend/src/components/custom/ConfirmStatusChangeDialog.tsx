import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  INCIDENT_LIMITS,
  type IncidentStatus,
} from '@/interfaces/incident.interface';
import { STATUS_UI } from '@/lib/incident-ui';

/** Why each sensitive transition deserves an explicit confirmation. */
const CONFIRMATION_COPY: Partial<Record<IncidentStatus, string>> = {
  bloqueada:
    'La incidencia dejará de avanzar y se destacará en el listado hasta que alguien la desbloquee.',
  resuelta:
    'Se cerrará la incidencia. Reabrirla después exigirá indicar un motivo.',
  abierta:
    'Es una reapertura: se registrará como tal en el historial y el motivo es obligatorio.',
};

interface Props {
  /** Target status, or null when there is nothing to confirm. */
  target: IncidentStatus | null;
  /** The reason is mandatory when reopening a resolved incident. */
  reasonRequired: boolean;
  isPending: boolean;
  onConfirm: (reason: string | undefined) => void;
  onCancel: () => void;
}

export const ConfirmStatusChangeDialog = ({
  target,
  reasonRequired,
  isPending,
  onConfirm,
  onCancel,
}: Props) => {
  const [reason, setReason] = useState('');

  const reasonMissing = reasonRequired && reason.trim().length === 0;

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (open) return;
        setReason('');
        onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Pasar a "{target ? STATUS_UI[target].label : ''}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {target ? CONFIRMATION_COPY[target] : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="reason">
            Motivo {reasonRequired ? '(obligatorio)' : '(opcional)'}
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={INCIDENT_LIMITS.reason}
            rows={3}
            placeholder="Queda registrado en el historial del cambio"
            aria-invalid={reasonMissing}
          />
          {reasonMissing && (
            <p className="text-xs text-destructive">
              Una reapertura exige indicar el motivo.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isPending || reasonMissing}
          >
            Confirmar cambio
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
