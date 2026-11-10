import { Badge } from '@/components/ui/badge';
import type { IncidentStatus } from '@/interfaces/incident.interface';
import { STATUS_UI } from '@/lib/incident-ui';
import { cn } from '@/lib/utils';

interface Props {
  status: IncidentStatus;
  className?: string;
}

/** Colours and labels come from STATUS_UI; nothing is written here by hand. */
export const StatusBadge = ({ status, className }: Props) => (
  <Badge
    variant="outline"
    className={cn(STATUS_UI[status].badgeClassName, className)}
  >
    {STATUS_UI[status].label}
  </Badge>
);
