import type { ReactNode } from 'react';

import { AppHeader } from '@/components/custom/AppHeader';

interface Props {
  children: ReactNode;
}

export const AppLayout = ({ children }: Props) => (
  <div className="min-h-dvh bg-background">
    <AppHeader />
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
  </div>
);
