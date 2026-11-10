import { CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConsistencyCheckReport } from '@/interfaces/maintenance.interface';

interface Props {
  report: ConsistencyCheckReport;
}

/**
 * One block per check. The report always states whether a finding is
 * auto-fixable and, when it is not, why it is left to a human.
 */
export const ConsistencyCheckCard = ({ report }: Props) => {
  const isClean = report.count === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          {isClean ? (
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
          ) : (
            <ShieldAlert className="size-4 text-destructive" aria-hidden />
          )}
          {report.title}
          <Badge variant="outline" className="tabular-nums">
            {report.count}
          </Badge>
          <Badge variant={report.autoFixable ? 'secondary' : 'outline'}>
            {report.autoFixable ? 'Auto-corregible' : 'Revisión manual'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        <p className="text-muted-foreground">{report.description}</p>

        <p className="flex items-start gap-2">
          <Wrench className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{report.proposedAction}</span>
        </p>

        {report.findings.length > 0 && (
          <ul className="space-y-2">
            {report.findings.map((finding) => (
              <li key={`${finding.incidentId}-${finding.incidentTitle}`} className="border p-2">
                <p className="font-medium">{finding.incidentTitle}</p>
                <p className="text-muted-foreground">{finding.incidentId}</p>
                <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
                  {Object.entries(finding.detail).map(([key, value]) => (
                    <div key={key} className="col-span-2 flex gap-2">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="break-all">{JSON.stringify(value)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
