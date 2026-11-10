import { createBrowserRouter, RouterProvider } from 'react-router';
import { SearchPage } from './pages/SearchPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ArticlePage } from './pages/ArticlePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SearchPage />,
  },
  {
    path: '/analytics',
    element: <AnalyticsPage />,
  },
  {
    path: '/articles/:id',
    element: <ArticlePage />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
