import { useState } from 'react';
import { Plus } from 'lucide-react';

import { NewIncidentForm } from '@/components/custom/NewIncidentForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useActor } from '@/hooks/useActor';

export const NewIncidentDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { actor } = useActor();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          Nueva incidencia
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva incidencia</DialogTitle>
          <DialogDescription>
            Se creará en estado "abierta" y con su primer registro de
            trazabilidad a nombre de {actor}.
          </DialogDescription>
        </DialogHeader>

        <NewIncidentForm
          onCreated={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
