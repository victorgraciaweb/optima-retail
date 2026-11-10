import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  assertTransitionAllowed,
  isReopening,
} from '../domain/incident-status.transitions';
import { ChangeIncidentStatusDto, IncidentResponseDto } from '../dto';
import { Incident, IncidentLog } from '../entities';
import { IncidentLogAction } from '../enums';

@Injectable()
export class IncidentChangeStatusService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Applies a status change and records it in the audit trail atomically.
   *
   * Why a single transaction: a status without its log entry is exactly the
   * corruption the maintenance check hunts for (§8). If the log insert fails,
   * the status change must roll back with it — never a state nobody can trace.
   *
   * Why a pessimistic lock: two concurrent changes reading the same `status`
   * would both validate against a stale value and write two logs whose
   * old/new values no longer chain. Locking the row serialises them, so the
   * second request re-reads the updated status and is rejected by the state
   * machine if it is no longer legal.
   */
  async execute(
    id: string,
    dto: ChangeIncidentStatusDto,
  ): Promise<IncidentResponseDto> {
    const incident = await this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(Incident, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!current) {
        throw new NotFoundException(`Incidencia ${id} no encontrada.`);
      }

      // Throws ConflictException (illegal transition) or BadRequestException
      // (reopening without a reason), aborting the transaction.
      assertTransitionAllowed(current.status, dto.status, dto.reason);

      const previousStatus = current.status;
      const reopening = isReopening(previousStatus, dto.status);

      current.status = dto.status;
      await manager.save(current);

      await manager.save(
        manager.create(IncidentLog, {
          incidentId: current.id,
          action: reopening
            ? IncidentLogAction.Reopened
            : IncidentLogAction.StatusChanged,
          oldValue: previousStatus,
          newValue: dto.status,
          userName: dto.actorName,
          metadata: dto.reason ? { reason: dto.reason } : null,
        }),
      );

      return current;
    });

    return new IncidentResponseDto(incident);
  }
}
