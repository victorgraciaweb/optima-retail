import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentComment, IncidentLog } from '../entities';
import { IncidentLogAction } from '../enums';

export enum ActivityEntryType {
  Log = 'log',
  Comment = 'comment',
}

/**
 * One entry of the unified activity feed.
 *
 * Logs and comments live in separate tables but are presented as a single
 * chronological timeline, so they are normalised into one shape here rather
 * than leaving the frontend to merge and sort two lists.
 */
export class IncidentActivityEntryDto {
  @ApiProperty({ enum: ActivityEntryType, example: ActivityEntryType.Log })
  type: ActivityEntryType;

  @ApiProperty({ example: 'a3f1c8e0-5b2d-4c7a-9e11-6d0b2f4a8c33' })
  id: string;

  @ApiPropertyOptional({
    enum: IncidentLogAction,
    nullable: true,
    description: 'Log action. Null for comment entries.',
  })
  action: IncidentLogAction | null;

  @ApiPropertyOptional({ example: 'abierta', nullable: true })
  oldValue: string | null;

  @ApiPropertyOptional({ example: 'en_revision', nullable: true })
  newValue: string | null;

  @ApiProperty({
    example: 'Marco Díaz',
    description: 'Actor of the change or author of the comment.',
  })
  actorName: string;

  @ApiPropertyOptional({
    example: 'Pedido recambio al proveedor, llega el jueves.',
    nullable: true,
    description: 'Comment text. Null for log entries.',
  })
  body: string | null;

  @ApiPropertyOptional({
    example: { reason: 'Vuelve a reproducirse' },
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-11-10T09:12:00.000Z' })
  createdAt: Date;

  static fromLog(log: IncidentLog): IncidentActivityEntryDto {
    const entry = new IncidentActivityEntryDto();
    entry.type = ActivityEntryType.Log;
    entry.id = log.id;
    entry.action = log.action;
    entry.oldValue = log.oldValue;
    entry.newValue = log.newValue;
    entry.actorName = log.userName;
    entry.body = null;
    entry.metadata = log.metadata;
    entry.createdAt = log.createdAt;
    return entry;
  }

  static fromComment(comment: IncidentComment): IncidentActivityEntryDto {
    const entry = new IncidentActivityEntryDto();
    entry.type = ActivityEntryType.Comment;
    entry.id = comment.id;
    entry.action = null;
    entry.oldValue = null;
    entry.newValue = null;
    entry.actorName = comment.authorName;
    entry.body = comment.body;
    entry.metadata = null;
    entry.createdAt = comment.createdAt;
    return entry;
  }
}
