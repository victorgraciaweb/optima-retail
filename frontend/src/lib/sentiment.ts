export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const sentimentVariant = (sentiment: string): BadgeVariant => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return 'default';
    case 'negative':
      return 'destructive';
    case 'mixed':
      return 'outline';
    default:
      return 'secondary';
  }
};
