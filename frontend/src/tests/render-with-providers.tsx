import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';

/**
 * The hooks under test read the URL (useSearchParams) and the query cache, so
 * every render needs both providers. Retries are off so a failing request fails
 * the test immediately instead of timing out.
 */
export const renderWithProviders = (
  element: ReactElement,
  { path = '/', route = '/' } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const router = createMemoryRouter([{ path: route, element }], {
    initialEntries: [path],
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...result, router, queryClient };
};
