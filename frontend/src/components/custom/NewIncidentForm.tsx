import { useState, type FormEvent } from 'react';

import { FormField } from '@/components/custom/FormField';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActor } from '@/hooks/useActor';
import { useCreateIncident } from '@/hooks/useIncidentMutations';
import {
  INCIDENT_LIMITS,
  INCIDENT_PRIORITIES,
  type IncidentPriority,
} from '@/interfaces/incident.interface';
import {
  EMPTY_NEW_INCIDENT_FORM,
  toCreateIncidentPayload,
  validateNewIncident,
  type NewIncidentFormErrors,
  type NewIncidentFormState,
} from '@/lib/incident-form';
import { PRIORITY_UI } from '@/lib/incident-ui';

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export const NewIncidentForm = ({ onCreated, onCancel }: Props) => {
  const [form, setForm] = useState<NewIncidentFormState>(
    EMPTY_NEW_INCIDENT_FORM,
  );
  const [errors, setErrors] = useState<NewIncidentFormErrors>({});

  const { actor } = useActor();
  const { mutate, isPending } = useCreateIncident();

  const set = <K extends keyof NewIncidentFormState>(
    key: K,
    value: NewIncidentFormState[K],
  ) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const found = validateNewIncident(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    mutate(toCreateIncidentPayload(form, actor), {
      onSuccess: () => {
        setForm(EMPTY_NEW_INCIDENT_FORM);
        setErrors({});
        onCreated();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField id="title" label="Título" error={errors.title}>
        <Input
          id="title"
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
          maxLength={INCIDENT_LIMITS.title}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
      </FormField>

      <FormField id="description" label="Descripción" error={errors.description}>
        <Textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          maxLength={INCIDENT_LIMITS.description}
          aria-invalid={!!errors.description}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="priority" label="Prioridad">
          <Select
            value={form.priority}
            onValueChange={(value) => set('priority', value as IncidentPriority)}
          >
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_UI[priority].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="dueAt" label="Vencimiento (opcional)">
          <Input
            id="dueAt"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => set('dueAt', event.target.value)}
          />
        </FormField>

        <FormField
          id="requesterName"
          label="Solicitante"
          error={errors.requesterName}
        >
          <Input
            id="requesterName"
            value={form.requesterName}
            onChange={(event) => set('requesterName', event.target.value)}
            maxLength={INCIDENT_LIMITS.name}
            aria-invalid={!!errors.requesterName}
          />
        </FormField>

        <FormField id="assignedTo" label="Responsable (opcional)">
          <Input
            id="assignedTo"
            value={form.assignedTo}
            onChange={(event) => set('assignedTo', event.target.value)}
            maxLength={INCIDENT_LIMITS.name}
          />
        </FormField>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          Crear incidencia
        </Button>
      </DialogFooter>
    </form>
  );
};
