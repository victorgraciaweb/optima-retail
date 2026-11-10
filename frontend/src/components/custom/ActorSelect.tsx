import { UserRound } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActor } from '@/hooks/useActor';
import { ACTORS } from '@/lib/actors';

/**
 * Stand-in for authentication: the chosen name travels in the body of every
 * mutation and is what the audit trail records.
 */
export const ActorSelect = () => {
  const { actor, setActor } = useActor();

  return (
    <div className="flex items-center gap-2">
      <UserRound className="size-4 text-muted-foreground" aria-hidden />
      <label htmlFor="actor" className="sr-only">
        Operario
      </label>
      <Select value={actor} onValueChange={setActor}>
        <SelectTrigger id="actor" className="w-[190px]" size="sm">
          <SelectValue placeholder="Operario" />
        </SelectTrigger>
        <SelectContent>
          {ACTORS.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
