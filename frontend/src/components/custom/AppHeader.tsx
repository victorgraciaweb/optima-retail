import { Link, useLocation } from 'react-router';
import { ClipboardList, Wrench } from 'lucide-react';

import { ActorSelect } from '@/components/custom/ActorSelect';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/', label: 'Incidencias', icon: ClipboardList },
  { to: '/maintenance', label: 'Mantenimiento', icon: Wrench },
];

export const AppHeader = () => {
  const { pathname } = useLocation();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Panel operativo de incidencias
          </h1>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Registra, prioriza y sigue las incidencias de tienda. Cada cambio de
            estado queda trazado con su autor, su motivo y su fecha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1" aria-label="Secciones">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                asChild
                size="sm"
                variant={pathname === to ? 'secondary' : 'ghost'}
              >
                <Link to={to}>
                  <Icon aria-hidden />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>

          <ActorSelect />
        </div>
      </div>
    </header>
  );
};
