import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateIncidentCommentDto, IncidentCommentResponseDto } from '../dto';
import { Incident, IncidentComment, IncidentLog } from '../entities';
import { IncidentLogAction } from '../enums';

@Injectable()
export class IncidentAddCommentService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Stores a comment and its matching `commented` log entry.
   *
   * The comment itself holds the text; the log entry exists so the activity
   * timeline can be rebuilt from `incident_logs` alone, and so commenting
   * shows up in the audit trail like any other operational action.
   */
  async execute(
    incidentId: string,
    dto: CreateIncidentCommentDto,
  ): Promise<IncidentCommentResponseDto> {
    const comment = await this.dataSource.transaction(async (manager) => {
      // Existence check inside the transaction: the FK would also reject an
      // unknown id, but a 404 is clearer to the client than a constraint error.
      const exists = await manager.exists(Incident, {
        where: { id: incidentId },
      });

      if (!exists) {
        throw new NotFoundException(`Incidencia ${incidentId} no encontrada.`);
      }

      const created = await manager.save(
        manager.create(IncidentComment, {
          incidentId,
          authorName: dto.authorName,
          body: dto.body,
        }),
      );

      await manager.save(
        manager.create(IncidentLog, {
          incidentId,
          action: IncidentLogAction.Commented,
          oldValue: null,
          newValue: null,
          userName: dto.authorName,
          metadata: { commentId: created.id },
        }),
      );

      return created;
    });

    return new IncidentCommentResponseDto(comment);
  }
}
