import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

interface Props {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

/**
 * Label + control + inline error. Keeps every form field in the app wired the
 * same way, including the aria-describedby that points at the error text.
 */
export const FormField = ({ id, label, error, children }: Props) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {error && (
      <p id={`${id}-error`} className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);
