import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { StatusCounters } from '@/components/custom/StatusCounters';
import { renderWithProviders } from '@/tests/render-with-providers';
import type { IncidentStats } from '@/interfaces/incident.interface';

const stats: IncidentStats = {
  byStatus: { abierta: 4, en_revision: 2, bloqueada: 1, resuelta: 7 },
  total: 14,
  overdue: 3,
  needsReview: 2,
};

vi.mock('@/hooks/useIncidentStats', () => ({
  useIncidentStats: () => ({ data: stats, isLoading: false }),
}));

describe('StatusCounters', () => {
  it('renders one counter per status with its count', () => {
    renderWithProviders(<StatusCounters />);

    const counters = screen.getAllByRole('button');

    expect(counters).toHaveLength(4);
    expect(counters[0]).toHaveTextContent('Abierta');
    expect(counters[0]).toHaveTextContent('4');
    expect(counters[1]).toHaveTextContent('En revisión');
    expect(counters[1]).toHaveTextContent('2');
    expect(counters[2]).toHaveTextContent('Bloqueada');
    expect(counters[3]).toHaveTextContent('7');
  });

  it('shows the totals, the overdue count and the pending-review link', () => {
    renderWithProviders(<StatusCounters />);

    expect(screen.getByText('14 en total')).toBeInTheDocument();
    expect(screen.getByText(/3 vencida/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /2 pendiente\(s\) de revisión/ }),
    ).toHaveAttribute('href', '/maintenance');
  });
});
