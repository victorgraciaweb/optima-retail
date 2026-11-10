import { CustomPagination } from '@/components/custom/CustomPagination';
import { IncidentCardList } from '@/components/custom/IncidentCardList';
import { IncidentFilters } from '@/components/custom/IncidentFilters';
import { IncidentsTable } from '@/components/custom/IncidentsTable';
import { NewIncidentDialog } from '@/components/custom/NewIncidentDialog';
import { StatusCounters } from '@/components/custom/StatusCounters';
import { Skeleton } from '@/components/ui/skeleton';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import { useIncidents } from '@/hooks/useIncidents';
import { getApiErrorMessage } from '@/api/api';

export const IncidentsPage = () => {
  const { filters, setPage } = useIncidentFilters();
  const { data, isLoading, isError, error, isFetching } = useIncidents();

  return (
    <div className="space-y-6">
      <StatusCounters />

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold">Listado de incidencias</h2>
        <NewIncidentDialog />
      </div>

      <IncidentFilters />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {isError && (
        <p className="border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {getApiErrorMessage(error)}
        </p>
      )}

      {data && data.data.length === 0 && (
        <p className="border p-8 text-center text-sm text-muted-foreground">
          No hay incidencias que cumplan los filtros actuales.
        </p>
      )}

      {data && data.data.length > 0 && (
        <div
          className="space-y-4"
          aria-busy={isFetching}
          data-testid="incidents-list"
        >
          {/* One data source, two presentations: table on desktop, cards on mobile. */}
          <div className="hidden border md:block">
            <IncidentsTable incidents={data.data} />
          </div>
          <div className="md:hidden">
            <IncidentCardList incidents={data.data} />
          </div>

          <CustomPagination
            page={filters.page}
            totalPages={data.pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
