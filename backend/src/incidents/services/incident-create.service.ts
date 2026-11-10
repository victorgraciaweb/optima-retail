import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateIncidentDto, IncidentResponseDto } from '../dto';
import { Incident, IncidentLog } from '../entities';
import { IncidentLogAction } from '../enums';

@Injectable()
export class IncidentCreateService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates an incident together with its `created` log entry.
   *
   * Both writes share one transaction: an incident without its opening log
   * would start the audit trail already broken, and the consistency check
   * would report it as corrupt data.
   */
  async execute(dto: CreateIncidentDto): Promise<IncidentResponseDto> {
    const incident = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(Incident, {
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          requesterName: dto.requesterName,
          assignedTo: dto.assignedTo ?? null,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        }),
      );

      await manager.save(
        manager.create(IncidentLog, {
          incidentId: created.id,
          action: IncidentLogAction.Created,
          oldValue: null,
          newValue: created.status,
          userName: dto.actorName,
          metadata: null,
        }),
      );

      return created;
    });

    return new IncidentResponseDto(incident);
  }
}
