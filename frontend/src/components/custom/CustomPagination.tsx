import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Presentational only: the current page lives in the URL and is owned by
 * useIncidentFilters, so this component just reports the intent.
 */
export const CustomPagination = ({ page, totalPages, onPageChange }: Props) => {
  if (totalPages <= 1) return null;

  const go = (next: number) => {
    if (next < 1 || next > totalPages) return;
    onPageChange(next);
  };

  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Paginación"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => go(page - 1)}
      >
        <ChevronLeft aria-hidden />
        Anteriores
      </Button>

      <span className="text-xs text-muted-foreground tabular-nums">
        Página {page} de {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => go(page + 1)}
      >
        Siguientes
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
};
