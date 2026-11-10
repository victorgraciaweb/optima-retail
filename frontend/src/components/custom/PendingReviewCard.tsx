import { Link } from 'react-router';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIncidentsNeedingReview } from '@/hooks/useIncidentsNeedingReview';

/**
 * Incidents the fix deliberately did not repair: there was not enough
 * information to decide the truth, so a human has to look at them.
 */
export const PendingReviewCard = () => {
  const { data } = useIncidentsNeedingReview();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-destructive" aria-hidden />
          Pendientes de revisión manual
        </CardTitle>
      </CardHeader>

      <CardContent>
        {!data?.data.length ? (
          <p className="text-xs text-muted-foreground">
            Ninguna incidencia marcada para revisión.
          </p>
        ) : (
          <ul className="space-y-2 text-xs">
            {data.data.map((incident) => (
              <li key={incident.id} className="border p-2">
                <Link
                  to={`/incidents/${incident.id}`}
                  className="font-medium hover:underline"
                >
                  {incident.title}
                </Link>
                <p className="text-muted-foreground">
                  {incident.reviewReason ?? 'Sin motivo registrado'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
