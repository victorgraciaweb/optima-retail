import { X } from 'lucide-react';

import { IncidentSearchForm } from '@/components/custom/IncidentSearchForm';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import {
  INCIDENT_PRIORITIES,
  INCIDENT_STATUSES,
  type IncidentSort,
} from '@/interfaces/incident.interface';
import { PRIORITY_UI, SORT_LABELS, STATUS_UI } from '@/lib/incident-ui';
import { cn } from '@/lib/utils';

const ALL_STATUSES = 'todas';

/**
 * Status is a single-choice quick filter (tabs), priority is multi-choice
 * (chips). Both only write to the URL: the refetch is React Query's job.
 */
export const IncidentFilters = () => {
  const {
    filters,
    hasActiveFilters,
    setStatus,
    togglePriority,
    setQ,
    setSort,
    clear,
  } = useIncidentFilters();

  const activeStatus =
    filters.status.length === 1 ? filters.status[0] : ALL_STATUSES;

  return (
    <section aria-label="Filtros" className="space-y-3">
      <Tabs
        value={activeStatus}
        onValueChange={(value) =>
          setStatus(
            value === ALL_STATUSES
              ? []
              : [value as (typeof INCIDENT_STATUSES)[number]],
          )
        }
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value={ALL_STATUSES}>Todas</TabsTrigger>
          {INCIDENT_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {STATUS_UI[status].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <IncidentSearchForm
          key={filters.q}
          initialValue={filters.q}
          onSearch={setQ}
        />

        <Select
          value={filters.sort}
          onValueChange={(value) => setSort(value as IncidentSort)}
        >
          <SelectTrigger className="w-full md:w-[230px]" aria-label="Ordenar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Prioridad:</span>
        {INCIDENT_PRIORITIES.map((priority) => {
          const isActive = filters.priority.includes(priority);

          return (
            <button
              key={priority}
              type="button"
              aria-pressed={isActive}
              onClick={() => togglePriority(priority)}
              className={cn(
                'border px-2 py-0.5 text-xs transition-colors',
                isActive
                  ? PRIORITY_UI[priority].badgeClassName
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {PRIORITY_UI[priority].label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <Button variant="ghost" size="xs" onClick={clear}>
            <X aria-hidden />
            Limpiar filtros
          </Button>
        )}
      </div>
    </section>
  );
};
