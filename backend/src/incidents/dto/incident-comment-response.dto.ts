import { ApiProperty } from '@nestjs/swagger';
import { IncidentComment } from '../entities';

export class IncidentCommentResponseDto {
  @ApiProperty({ example: 'c1d2e3f4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: 'a3f1c8e0-5b2d-4c7a-9e11-6d0b2f4a8c33' })
  incidentId: string;

  @ApiProperty({ example: 'Lucía Ortega' })
  authorName: string;

  @ApiProperty({ example: 'Pedido recambio al proveedor, llega el jueves.' })
  body: string;

  @ApiProperty({ example: '2026-11-10T09:12:00.000Z' })
  createdAt: Date;

  constructor(comment: IncidentComment) {
    this.id = comment.id;
    this.incidentId = comment.incidentId;
    this.authorName = comment.authorName;
    this.body = comment.body;
    this.createdAt = comment.createdAt;
  }
}
