import { PlayCircle, RefreshCw } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFixConsistency } from '@/hooks/useConsistency';
import type { ConsistencyReport } from '@/interfaces/maintenance.interface';

interface Props {
  report: ConsistencyReport;
}

/**
 * Totals plus the two ways to act on them: the dry run, which writes nothing,
 * and the real fix, gated behind a confirmation that spells out its effect.
 */
export const ConsistencySummaryCard = ({ report }: Props) => {
  const { mutate: runFix, data: plan, isPending } = useFixConsistency();

  const totals = [
    { label: 'Hallazgos', value: report.totalFindings },
    { label: 'Auto-corregibles', value: report.autoFixableFindings },
    { label: 'Revisión manual', value: report.manualReviewFindings },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Resumen</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="grid grid-cols-3 gap-3 text-center">
          {totals.map(({ label, value }) => (
            <div key={label} className="border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => runFix(true)}
          >
            <PlayCircle aria-hidden />
            Simular corrección (dry-run)
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={isPending || report.totalFindings === 0}
              >
                <RefreshCw aria-hidden />
                Aplicar correcciones
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Aplicar las correcciones?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Se escribirán las trazas que faltan, se eliminarán los logs
                  duplicados exactos y el resto se marcará para revisión manual.
                  Cada operación queda auditada con tu nombre.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => runFix(false)}>
                  Aplicar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {plan && (
          <div className="space-y-2 border p-3">
            <p className="text-xs font-medium">
              {plan.dryRun
                ? 'Plan simulado (no se ha escrito nada)'
                : 'Correcciones aplicadas'}
              {' · '}
              {plan.totalOperations} operación(es)
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {plan.operations.map((operation, index) => (
                <li key={`${operation.incidentId}-${index}`}>
                  <span className="font-medium text-foreground">
                    {operation.kind}
                  </span>{' '}
                  · {operation.incidentTitle} · {operation.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
