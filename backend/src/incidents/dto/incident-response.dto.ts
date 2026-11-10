import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_TRANSITIONS } from '../domain/incident-status.transitions';
import { Incident } from '../entities';
import { IncidentPriority, IncidentStatus } from '../enums';

export class IncidentResponseDto {
  @ApiProperty({
    example: 'a3f1c8e0-5b2d-4c7a-9e11-6d0b2f4a8c33',
    description: 'Incident unique identifier.',
  })
  id: string;

  @ApiProperty({ example: 'La caja 3 no imprime tickets' })
  title: string;

  @ApiProperty({
    example:
      'Desde la apertura, la impresora de la caja 3 no responde. Se ha reiniciado sin efecto.',
  })
  description: string;

  @ApiProperty({ enum: IncidentStatus, example: IncidentStatus.Abierta })
  status: IncidentStatus;

  @ApiProperty({ enum: IncidentPriority, example: IncidentPriority.Alta })
  priority: IncidentPriority;

  @ApiProperty({ example: 'Lucía Ortega' })
  requesterName: string;

  @ApiPropertyOptional({ example: 'Marco Díaz', nullable: true })
  assignedTo: string | null;

  @ApiPropertyOptional({
    example: '2026-11-20T18:00:00.000Z',
    nullable: true,
    description: 'Operational deadline, if any.',
  })
  dueAt: Date | null;

  @ApiProperty({
    example: false,
    description:
      'True when the consistency check flagged this incident for manual review.',
  })
  needsReview: boolean;

  @ApiPropertyOptional({
    example:
      'El estado actual no coincide con el último log registrado (abierta vs resuelta).',
    nullable: true,
  })
  reviewReason: string | null;

  @ApiProperty({ example: '2026-11-10T09:12:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-10T09:12:00.000Z' })
  updatedAt: Date;

  /**
   * Statuses reachable from the current one. Sent to the client so the UI can
   * render only the legal actions instead of duplicating the state machine.
   */
  @ApiProperty({
    enum: IncidentStatus,
    isArray: true,
    example: [IncidentStatus.EnRevision],
  })
  allowedTransitions: readonly IncidentStatus[];

  constructor(incident: Incident) {
    this.id = incident.id;
    this.title = incident.title;
    this.description = incident.description;
    this.status = incident.status;
    this.priority = incident.priority;
    this.requesterName = incident.requesterName;
    this.assignedTo = incident.assignedTo;
    this.dueAt = incident.dueAt;
    this.needsReview = incident.needsReview;
    this.reviewReason = incident.reviewReason;
    this.createdAt = incident.createdAt;
    this.updatedAt = incident.updatedAt;
    this.allowedTransitions = ALLOWED_TRANSITIONS[incident.status] ?? [];
  }
}
