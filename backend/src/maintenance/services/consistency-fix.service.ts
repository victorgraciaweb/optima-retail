import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Incident, IncidentLog } from '../../incidents/entities';
import { IncidentLogAction, IncidentStatus } from '../../incidents/enums';
import {
  ConsistencyFixOperationDto,
  ConsistencyFixResultDto,
  FixConsistencyDto,
  FixOperationKind,
} from '../dto';
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import {
  CONSISTENCY_CHECKS,
  ConsistencyCheckDefinition,
  ConsistencyFinding,
} from '../queries';

/** Actor recorded on reconstructed rows: they were written by the system, not by a person. */
const SYSTEM_ACTOR = 'system';

@Injectable()
export class ConsistencyFixService {
  private readonly logger = new Logger(ConsistencyFixService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Builds and (unless this is a dry run) applies the correction plan.
   *
   * Three deliberate properties:
   *
   *  - **Dry run by default.** `dryRun` has to be sent explicitly as `false` to
   *    write anything, so an accidental POST can never mutate data. On a dry
   *    run the checks still run against live data, so the preview is the real
   *    plan and not an estimate.
   *
   *  - **One transaction for detection and correction.** Re-detecting inside
   *    the transaction means the plan is built from the same snapshot it is
   *    applied to; nothing can change in between. It also lets the checks run
   *    in order, so a repair made by an earlier check is visible to the later
   *    ones (a reconstructed resolution log removes the mismatch that check 2
   *    would otherwise report).
   *
   *  - **Prudence over completeness.** Only the two checks whose repair adds no
   *    new information are applied. The other two just raise `needs_review`,
   *    because the data does not say what the correct value is and guessing
   *    would destroy evidence.
   */
  async execute(dto: FixConsistencyDto): Promise<ConsistencyFixResultDto> {
    const dryRun = dto.dryRun ?? true;
    const selected = this.selectChecks(dto.checks);

    const operations = await this.dataSource.transaction(async (manager) => {
      const planned: ConsistencyFixOperationDto[] = [];

      for (const definition of selected) {
        const findings = await definition.run(manager);

        for (const finding of findings) {
          planned.push(
            await this.handle(manager, definition, finding, dto, dryRun),
          );
        }
      }

      return planned;
    });

    this.logger.log(
      `${dryRun ? 'Planned' : 'Applied'} ${operations.length} consistency operation(s) for actor "${dto.actorName}".`,
    );

    return new ConsistencyFixResultDto(
      dryRun,
      dto.actorName,
      new Date(),
      operations,
    );
  }

  /**
   * Keeps the registry order (auto-fixable checks first) regardless of the
   * order the caller listed them in, so the dependency between checks holds.
   */
  private selectChecks(
    checks?: ConsistencyCheck[],
  ): readonly ConsistencyCheckDefinition[] {
    if (!checks?.length) return CONSISTENCY_CHECKS;

    const requested = new Set(checks);
    return CONSISTENCY_CHECKS.filter((definition) =>
      requested.has(definition.check),
    );
  }

  private handle(
    manager: EntityManager,
    definition: ConsistencyCheckDefinition,
    finding: ConsistencyFinding,
    dto: FixConsistencyDto,
    dryRun: boolean,
  ): Promise<ConsistencyFixOperationDto> {
    switch (definition.check) {
      case ConsistencyCheck.ResolvedWithoutResolutionLog:
        return this.reconstructResolutionLog(manager, finding, dto, dryRun);

      case ConsistencyCheck.DuplicatedLogs:
        return this.deleteDuplicateLogs(manager, finding, dto, dryRun);

      // Both remaining checks are unfixable for the same reason — the missing
      // information cannot be derived — so they share the flagging path.
      case ConsistencyCheck.StatusMismatchWithLastLog:
      case ConsistencyCheck.BrokenLogChain:
        return this.flagForReview(manager, definition, finding, dto, dryRun);
    }
  }

  /**
   * Check 1 — writes the log that the resolution never left.
   *
   * `user_name` is 'system' and the metadata says `reconstructed: true`, so the
   * row is readable as what it is: an inference from `incidents.status`, not a
   * record of someone's action.
   */
  private async reconstructResolutionLog(
    manager: EntityManager,
    finding: ConsistencyFinding,
    dto: FixConsistencyDto,
    dryRun: boolean,
  ): Promise<ConsistencyFixOperationDto> {
    const description = `Crear log consistency_fix con new_value="${IncidentStatus.Resuelta}", user_name="${SYSTEM_ACTOR}" y metadata.reconstructed=true.`;

    if (!dryRun) {
      await manager.save(
        manager.create(IncidentLog, {
          incidentId: finding.incidentId,
          action: IncidentLogAction.ConsistencyFix,
          oldValue: null,
          newValue: IncidentStatus.Resuelta,
          userName: SYSTEM_ACTOR,
          metadata: {
            reconstructed: true,
            inferredFrom: 'incidents.status',
            check: ConsistencyCheck.ResolvedWithoutResolutionLog,
            appliedBy: dto.actorName,
          },
        }),
      );
    }

    return {
      check: ConsistencyCheck.ResolvedWithoutResolutionLog,
      kind: FixOperationKind.ReconstructLog,
      incidentId: finding.incidentId,
      incidentTitle: finding.incidentTitle,
      description,
      applied: !dryRun,
    };
  }

  /**
   * Check 3a — keeps the oldest row of each duplicate group and deletes the
   * copies. The surviving row carries the original timestamp, so the history
   * still shows when the change really happened.
   */
  private async deleteDuplicateLogs(
    manager: EntityManager,
    finding: ConsistencyFinding,
    dto: FixConsistencyDto,
    dryRun: boolean,
  ): Promise<ConsistencyFixOperationDto> {
    const keepLogId = finding.detail.keepLogId as string;
    const removeLogIds = finding.detail.removeLogIds as string[];

    const description = `Conservar el log ${keepLogId} y borrar ${removeLogIds.length} copia(s) idéntica(s): ${removeLogIds.join(', ')}.`;

    if (!dryRun && removeLogIds.length) {
      await manager.delete(IncidentLog, { id: In(removeLogIds) });

      await manager.save(
        manager.create(IncidentLog, {
          incidentId: finding.incidentId,
          action: IncidentLogAction.ConsistencyFix,
          oldValue: null,
          newValue: null,
          userName: SYSTEM_ACTOR,
          metadata: {
            check: ConsistencyCheck.DuplicatedLogs,
            removedLogIds: removeLogIds,
            keptLogId: keepLogId,
            appliedBy: dto.actorName,
          },
        }),
      );
    }

    return {
      check: ConsistencyCheck.DuplicatedLogs,
      kind: FixOperationKind.DeleteDuplicateLogs,
      incidentId: finding.incidentId,
      incidentTitle: finding.incidentTitle,
      description,
      applied: !dryRun,
    };
  }

  /**
   * Checks 2 and 3b — raises `needs_review` and records why.
   *
   * No operational field is touched: the status, the logs and the comments stay
   * exactly as found. The only change is making the problem visible to whoever
   * can actually resolve it.
   *
   * Flagging is idempotent on purpose. Unlike the two repairs, this one does
   * not remove the finding — the incident keeps being reported until a human
   * resolves it — so re-running the fix would otherwise append an identical
   * audit entry on every call and bury the real history in noise.
   */
  private async flagForReview(
    manager: EntityManager,
    definition: ConsistencyCheckDefinition,
    finding: ConsistencyFinding,
    dto: FixConsistencyDto,
    dryRun: boolean,
  ): Promise<ConsistencyFixOperationDto> {
    const reviewReason = this.buildReviewReason(definition, finding);

    const alreadyFlagged = await manager.exists(Incident, {
      where: { id: finding.incidentId, needsReview: true, reviewReason },
    });

    if (alreadyFlagged) {
      return {
        check: definition.check,
        kind: FixOperationKind.FlagForReview,
        incidentId: finding.incidentId,
        incidentTitle: finding.incidentTitle,
        description:
          'Ya estaba marcada para revisión con este mismo motivo: no se vuelve a escribir.',
        applied: false,
      };
    }

    const description = `Marcar needs_review=true con el motivo: "${reviewReason}". No se modifica ningún dato operativo.`;

    if (!dryRun) {
      await manager.update(
        Incident,
        { id: finding.incidentId },
        { needsReview: true, reviewReason },
      );

      await manager.save(
        manager.create(IncidentLog, {
          incidentId: finding.incidentId,
          action: IncidentLogAction.ConsistencyFix,
          oldValue: null,
          newValue: null,
          userName: SYSTEM_ACTOR,
          metadata: {
            check: definition.check,
            flaggedForReview: true,
            reviewReason,
            evidence: finding.detail,
            appliedBy: dto.actorName,
          },
        }),
      );
    }

    return {
      check: definition.check,
      kind: FixOperationKind.FlagForReview,
      incidentId: finding.incidentId,
      incidentTitle: finding.incidentTitle,
      description,
      applied: !dryRun,
    };
  }

  private buildReviewReason(
    definition: ConsistencyCheckDefinition,
    finding: ConsistencyFinding,
  ): string {
    if (definition.check === ConsistencyCheck.StatusMismatchWithLastLog) {
      return `El estado actual ("${finding.detail.currentStatus}") no coincide con el último log registrado ("${finding.detail.lastLoggedStatus}"). No se corrige automáticamente: no hay información para saber cuál de los dos es la verdad.`;
    }

    return `El log ${finding.detail.logId} parte de "${finding.detail.actualOldValue}" cuando el log anterior dejó la incidencia en "${finding.detail.expectedOldValue}": falta un log intermedio. No se reconstruye porque exigiría inventar actor y fecha.`;
  }
}
