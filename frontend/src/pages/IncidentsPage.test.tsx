import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IncidentsPage } from '@/pages/IncidentsPage';
import { renderWithProviders } from '@/tests/render-with-providers';
import type { Incident } from '@/interfaces/incident.interface';

const incident: Incident = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'La caja 3 no imprime tickets',
  description: 'La impresora no responde desde la apertura.',
  status: 'abierta',
  priority: 'alta',
  requesterName: 'Lucía Ortega',
  assignedTo: 'Marco Díaz',
  dueAt: null,
  needsReview: false,
  reviewReason: null,
  createdAt: '2026-11-01T08:00:00.000Z',
  updatedAt: '2026-11-01T08:00:00.000Z',
  allowedTransitions: ['en_revision'],
};

const listIncidentsAction = vi.fn();

vi.mock('@/actions/list-incidents.action', () => ({
  listIncidentsAction: (options: unknown) => listIncidentsAction(options),
}));

vi.mock('@/hooks/useIncidentStats', () => ({
  useIncidentStats: () => ({ data: undefined, isLoading: false }),
}));

describe('IncidentsPage quick status filter', () => {
  beforeEach(() => {
    listIncidentsAction.mockReset();
    listIncidentsAction.mockResolvedValue({
      count: 1,
      pages: 1,
      data: [incident],
    });
  });

  it('writes the status to the URL and refetches with it, without a reload', async () => {
    const user = userEvent.setup();
    const { router } = renderWithProviders(<IncidentsPage />);

    await waitFor(() => expect(listIncidentsAction).toHaveBeenCalledTimes(1));
    expect(listIncidentsAction.mock.calls[0][0]).toMatchObject({ status: [] });

    await user.click(screen.getByRole('tab', { name: 'Bloqueada' }));

    await waitFor(() =>
      expect(router.state.location.search).toBe('?status=bloqueada'),
    );

    await waitFor(() => expect(listIncidentsAction).toHaveBeenCalledTimes(2));
    expect(listIncidentsAction.mock.calls[1][0]).toMatchObject({
      status: ['bloqueada'],
      offset: 0,
    });
  });
});
