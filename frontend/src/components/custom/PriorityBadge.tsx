import { Badge } from '@/components/ui/badge';
import type { IncidentPriority } from '@/interfaces/incident.interface';
import { PRIORITY_UI } from '@/lib/incident-ui';
import { cn } from '@/lib/utils';

interface Props {
  priority: IncidentPriority;
  className?: string;
}

export const PriorityBadge = ({ priority, className }: Props) => (
  <Badge
    variant="outline"
    className={cn(PRIORITY_UI[priority].badgeClassName, className)}
  >
    {PRIORITY_UI[priority].label}
  </Badge>
);
