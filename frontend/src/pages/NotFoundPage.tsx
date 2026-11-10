import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const NotFoundPage = () => (
  <div className="space-y-4 py-16 text-center">
    <p className="text-4xl font-semibold">404</p>
    <p className="text-sm text-muted-foreground">
      La página que buscas no existe.
    </p>
    <Button asChild variant="outline" size="sm">
      <Link to="/">
        <ArrowLeft aria-hidden />
        Volver al panel
      </Link>
    </Button>
  </div>
);
