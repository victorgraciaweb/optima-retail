import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import {
  INCIDENT_PRIORITIES,
  INCIDENT_STATUSES,
  type IncidentFilters,
  type IncidentPriority,
  type IncidentSort,
  type IncidentStatus,
} from '@/interfaces/incident.interface';
import { SORT_LABELS } from '@/lib/incident-ui';

export const INCIDENTS_PAGE_SIZE = 8;

const DEFAULT_SORT: IncidentSort = 'created_at:desc';

/** Only values the API accepts survive: a hand-edited URL can never reach it. */
const parseList = <T extends string>(values: string[], allowed: readonly T[]) =>
  values.filter((value): value is T => (allowed as readonly string[]).includes(value));

/**
 * Filters, sorting and pagination live in the URL, so the current view is
 * shareable and survives a reload. This hook is the only place that reads or
 * writes those params; components receive values and setters.
 */
export const useIncidentFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSort = searchParams.get('sort') ?? '';
  const rawPage = Number(searchParams.get('page') ?? '1');

  const filters: IncidentFilters = {
    status: parseList(searchParams.getAll('status'), INCIDENT_STATUSES),
    priority: parseList(searchParams.getAll('priority'), INCIDENT_PRIORITIES),
    q: searchParams.get('q')?.trim() ?? '',
    assignedTo: searchParams.get('assignedTo')?.trim() ?? '',
    sort: rawSort in SORT_LABELS ? (rawSort as IncidentSort) : DEFAULT_SORT,
    needsReview: searchParams.get('needsReview') === 'true',
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1,
  };

  /**
   * Any filter change resets pagination: staying on page 4 of a narrower result
   * set would show an empty table.
   */
  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, { keepPage = false } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          mutate(next);
          if (!keepPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setStatus = useCallback(
    (status: IncidentStatus[]) =>
      update((params) => {
        params.delete('status');
        status.forEach((value) => params.append('status', value));
      }),
    [update],
  );

  const togglePriority = useCallback(
    (priority: IncidentPriority) =>
      update((params) => {
        const current = params.getAll('priority');
        const next = current.includes(priority)
          ? current.filter((value) => value !== priority)
          : [...current, priority];
        params.delete('priority');
        next.forEach((value) => params.append('priority', value));
      }),
    [update],
  );

  const setSingle = useCallback(
    (key: 'q' | 'assignedTo' | 'sort', value: string) =>
      update((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      }),
    [update],
  );

  const setNeedsReview = useCallback(
    (value: boolean) =>
      update((params) => {
        if (value) params.set('needsReview', 'true');
        else params.delete('needsReview');
      }),
    [update],
  );

  const setPage = useCallback(
    (page: number) =>
      update((params) => params.set('page', String(page)), { keepPage: true }),
    [update],
  );

  const clear = useCallback(
    () => setSearchParams(new URLSearchParams(), { replace: true }),
    [setSearchParams],
  );

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.q !== '' ||
    filters.assignedTo !== '' ||
    filters.needsReview;

  return {
    filters,
    hasActiveFilters,
    setStatus,
    togglePriority,
    setQ: (value: string) => setSingle('q', value),
    setAssignedTo: (value: string) => setSingle('assignedTo', value),
    setSort: (value: IncidentSort) => setSingle('sort', value),
    setNeedsReview,
    setPage,
    clear,
  };
};
