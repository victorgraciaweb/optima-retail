import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';

import { AppLayout } from '@/components/custom/AppLayout';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { IncidentDetailPage } from '@/pages/IncidentDetailPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  {
    element: (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
    children: [
      { path: '/', element: <IncidentsPage /> },
      { path: '/incidents/:id', element: <IncidentDetailPage /> },
      { path: '/maintenance', element: <MaintenancePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
