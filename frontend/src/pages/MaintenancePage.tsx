import { ConsistencyCheckCard } from '@/components/custom/ConsistencyCheckCard';
import { ConsistencySummaryCard } from '@/components/custom/ConsistencySummaryCard';
import { PendingReviewCard } from '@/components/custom/PendingReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/api/api';
import { useConsistencyReport } from '@/hooks/useConsistency';

export const MaintenancePage = () => {
  const { data: report, isLoading, isError, error } = useConsistencyReport();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Consistencia de datos</h2>
        <p className="max-w-2xl text-xs text-muted-foreground">
          Diagnóstico de las incidencias cuyo estado y trazabilidad no
          concuerdan. El informe es de solo lectura; la corrección se
          previsualiza antes de aplicarse y nunca inventa información que falte.
        </p>
      </div>

      {isLoading && <Skeleton className="h-40" />}

      {isError && (
        <p className="border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {getApiErrorMessage(error)}
        </p>
      )}

      {report && (
        <>
          <ConsistencySummaryCard report={report} />

          <div className="grid gap-4 lg:grid-cols-2">
            {report.checks.map((check) => (
              <ConsistencyCheckCard key={check.check} report={check} />
            ))}
          </div>
        </>
      )}

      <PendingReviewCard />
    </div>
  );
};
