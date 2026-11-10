import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  initialValue: string;
  onSearch: (value: string) => void;
}

/**
 * The typed term is a draft: it only reaches the URL on submit, so every
 * keystroke does not trigger a request. The parent remounts this component with
 * a `key` when the URL term changes, which resets the draft without an effect.
 */
export const IncidentSearchForm = ({ initialValue, onSearch }: Props) => {
  const [term, setTerm] = useState(initialValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(term.trim());
  };

  return (
    <form className="flex flex-1 items-center gap-2" onSubmit={handleSubmit}>
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar en título y descripción…"
        aria-label="Buscar incidencias"
        maxLength={120}
      />
      <Button type="submit" variant="outline" size="sm">
        <Search aria-hidden />
        Buscar
      </Button>
    </form>
  );
};
