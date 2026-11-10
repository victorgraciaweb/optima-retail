import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useActor } from '@/hooks/useActor';
import { useAddIncidentComment } from '@/hooks/useIncidentMutations';
import { INCIDENT_LIMITS } from '@/interfaces/incident.interface';

interface Props {
  incidentId: string;
}

export const CommentForm = ({ incidentId }: Props) => {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { actor } = useActor();
  const { mutate, isPending } = useAddIncidentComment(incidentId);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!body.trim()) {
      setError('Escribe un comentario antes de enviarlo.');
      return;
    }

    setError(null);
    mutate(body.trim(), { onSuccess: () => setBody('') });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={INCIDENT_LIMITS.commentBody}
        placeholder={`Comentario operativo como ${actor}…`}
        aria-label="Nuevo comentario"
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          {body.length}/{INCIDENT_LIMITS.commentBody}
        </span>
        <Button type="submit" size="sm" disabled={isPending}>
          <Send aria-hidden />
          Comentar
        </Button>
      </div>
    </form>
  );
};
