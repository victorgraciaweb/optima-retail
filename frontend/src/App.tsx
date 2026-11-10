import { AppRouter } from './app.router';
import { Toaster } from '@/components/ui/sonner';

export const App = () => (
  <>
    <AppRouter />
    <Toaster position="bottom-right" />
  </>
);
