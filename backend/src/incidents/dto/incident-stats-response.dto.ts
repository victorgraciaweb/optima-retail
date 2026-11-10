import { ApiProperty } from '@nestjs/swagger';
import { IncidentStatus } from '../enums';

export class IncidentStatsResponseDto {
  @ApiProperty({
    example: {
      abierta: 4,
      en_revision: 2,
      bloqueada: 1,
      resuelta: 7,
    },
    description:
      'Count of incidents per status. Every status is always present, with 0 when empty, so the UI counters never flicker between renders.',
  })
  byStatus: Record<IncidentStatus, number>;

  @ApiProperty({ example: 14, description: 'Total number of incidents.' })
  total: number;

  @ApiProperty({
    example: 2,
    description:
      'Incidents past their due date and not yet resolved. Drives the "overdue" highlight.',
  })
  overdue: number;

  @ApiProperty({
    example: 1,
    description:
      'Incidents flagged for manual review by the consistency check.',
  })
  needsReview: number;

  constructor(
    byStatus: Record<IncidentStatus, number>,
    overdue: number,
    needsReview: number,
  ) {
    this.byStatus = byStatus;
    this.total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    this.overdue = overdue;
    this.needsReview = needsReview;
  }
}
