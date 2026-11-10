import {
  INCIDENT_LIMITS,
  type CreateIncidentPayload,
  type IncidentPriority,
} from '@/interfaces/incident.interface';

export interface NewIncidentFormState {
  title: string;
  description: string;
  priority: IncidentPriority;
  requesterName: string;
  assignedTo: string;
  dueAt: string;
}

export type NewIncidentFormErrors = Partial<
  Record<keyof NewIncidentFormState, string>
>;

export const EMPTY_NEW_INCIDENT_FORM: NewIncidentFormState = {
  title: '',
  description: '',
  priority: 'media',
  requesterName: '',
  assignedTo: '',
  dueAt: '',
};

/**
 * Client-side mirror of the API constraints. Validating here avoids a round
 * trip for obvious mistakes; the API validates again and its errors surface in
 * a toast.
 */
export const validateNewIncident = ({
  title,
  description,
  requesterName,
}: NewIncidentFormState): NewIncidentFormErrors => {
  const errors: NewIncidentFormErrors = {};

  if (!title.trim()) errors.title = 'El título es obligatorio.';
  else if (title.length > INCIDENT_LIMITS.title)
    errors.title = `Máximo ${INCIDENT_LIMITS.title} caracteres.`;

  if (!description.trim())
    errors.description = 'Describe la incidencia para que sea accionable.';

  if (!requesterName.trim())
    errors.requesterName = 'Indica quién reporta la incidencia.';

  return errors;
};

/** Trims, drops the empty optionals and turns the local datetime into ISO. */
export const toCreateIncidentPayload = (
  form: NewIncidentFormState,
  actorName: string,
): CreateIncidentPayload => ({
  title: form.title.trim(),
  description: form.description.trim(),
  priority: form.priority,
  requesterName: form.requesterName.trim(),
  assignedTo: form.assignedTo.trim() || undefined,
  dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
  actorName,
});
