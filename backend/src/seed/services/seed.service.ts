import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  Incident,
  IncidentComment,
  IncidentLog,
} from '../../incidents/entities';
import {
  IncidentLogAction,
  IncidentPriority,
  IncidentStatus,
} from '../../incidents/enums';
import { isReopening } from '../../incidents/domain/incident-status.transitions';
import { CLEAN_INCIDENTS, CleanIncidentSeed } from '../data/clean-incidents';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Loads the sample dataset.
 *
 * Two clearly separated blocks:
 *
 *  1. `seedCleanIncidents` — coherent data: every status change has its log,
 *     and each log's `old_value` chains with the previous `new_value`. This is
 *     what the consistency checks must report as clean (no false positives).
 *
 *  2. `seedInconsistencies` — the three corrupted cases required by exercise 5.
 *     Written with raw SQL on purpose: none of them can be produced through the
 *     API, because every mutation there is transactional. Simulating them means
 *     writing behind the application's back, which is exactly how this kind of
 *     corruption appears in production (a manual UPDATE, a partial import, a
 *     retried job).
 *
 * Re-runnable: the whole dataset is deleted first, so `yarn seed` twice does
 * not accumulate duplicates.
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.clear(manager);

      const clean = await this.seedCleanIncidents(manager);
      const corrupted = await this.seedInconsistencies(manager);

      this.logger.log(`Seeded ${clean} coherent incidents.`);
      this.logger.log(
        `Seeded ${corrupted} deliberately inconsistent incidents (exercise 5).`,
      );
    });

    this.logger.log(
      'Run GET /api/maintenance/consistency to see the inconsistency report.',
    );
  }

  /**
   * Truncating `incidents` cascades to logs and comments through the FKs, so
   * one statement is enough. `delete({})` is rejected by TypeORM as an empty
   * criteria, and a bare DELETE would still need the cascade anyway.
   */
  private async clear(manager: EntityManager): Promise<void> {
    await manager.query('TRUNCATE TABLE incidents CASCADE');
  }

  private async seedCleanIncidents(manager: EntityManager): Promise<number> {
    const now = Date.now();

    for (const seed of CLEAN_INCIDENTS) {
      const createdAt = new Date(now - seed.createdHoursAgo * HOUR_MS);

      const incident = await manager.save(
        manager.create(Incident, {
          title: seed.title,
          description: seed.description,
          status: seed.path.at(-1) ?? IncidentStatus.Abierta,
          priority: seed.priority,
          requesterName: seed.requesterName,
          assignedTo: seed.assignedTo,
          dueAt:
            seed.dueInDays === null
              ? null
              : new Date(now + seed.dueInDays * DAY_MS),
          createdAt,
          updatedAt: createdAt,
        }),
      );

      await this.seedLogChain(manager, incident, seed, createdAt);

      for (const comment of seed.comments) {
        const commentedAt = new Date(now - comment.hoursAgo * HOUR_MS);

        const saved = await manager.save(
          manager.create(IncidentComment, {
            incidentId: incident.id,
            authorName: comment.authorName,
            body: comment.body,
            createdAt: commentedAt,
            updatedAt: commentedAt,
          }),
        );

        await manager.save(
          manager.create(IncidentLog, {
            incidentId: incident.id,
            action: IncidentLogAction.Commented,
            oldValue: null,
            newValue: null,
            userName: comment.authorName,
            metadata: { commentId: saved.id },
            createdAt: commentedAt,
          }),
        );
      }
    }

    return CLEAN_INCIDENTS.length;
  }

  /**
   * Replays the seeded status path as a coherent log chain: a `created` entry
   * followed by one entry per transition, each one spaced an hour apart so the
   * timeline has a stable order.
   */
  private async seedLogChain(
    manager: EntityManager,
    incident: Incident,
    seed: CleanIncidentSeed,
    createdAt: Date,
  ): Promise<void> {
    await manager.save(
      manager.create(IncidentLog, {
        incidentId: incident.id,
        action: IncidentLogAction.Created,
        oldValue: null,
        newValue: IncidentStatus.Abierta,
        userName: seed.actorName,
        metadata: null,
        createdAt,
      }),
    );

    let previous = IncidentStatus.Abierta;

    for (const [index, next] of seed.path.entries()) {
      const reopening = isReopening(previous, next);

      await manager.save(
        manager.create(IncidentLog, {
          incidentId: incident.id,
          action: reopening
            ? IncidentLogAction.Reopened
            : IncidentLogAction.StatusChanged,
          oldValue: previous,
          newValue: next,
          userName: seed.actorName,
          metadata: reopening
            ? { reason: 'El proveedor confirma el envío completo.' }
            : null,
          createdAt: new Date(createdAt.getTime() + (index + 1) * HOUR_MS),
        }),
      );

      previous = next;
    }
  }

  // ---------------------------------------------------------------------------
  // Exercise 5 — deliberately corrupted data
  //
  // Raw SQL, not the entity layer: these rows must bypass every guarantee the
  // application provides. The INSERTs are parameterised; nothing is
  // interpolated.
  // ---------------------------------------------------------------------------

  private async seedInconsistencies(manager: EntityManager): Promise<number> {
    await this.seedResolvedWithoutResolutionLog(manager);
    await this.seedStatusAheadOfLastLog(manager);
    await this.seedDuplicatedLog(manager);
    await this.seedBrokenLogChain(manager);

    return 4;
  }

  /**
   * Case 1 — resolved incident with no log introducing 'resuelta'.
   *
   * Simulates a status written outside the transaction that guarantees
   * traceability (a manual UPDATE on the database, for instance): the final
   * state is observable but the resolution left no trace.
   */
  private async seedResolvedWithoutResolutionLog(
    manager: EntityManager,
  ): Promise<void> {
    const createdAt = new Date(Date.now() - 5 * DAY_MS);

    const incidentId = await this.insertIncident(manager, {
      title: '[Inconsistencia 1] Devolución 2026-10-0217 sin abonar',
      description:
        'Caso sembrado a propósito: la incidencia está resuelta pero ningún log registra la resolución.',
      status: IncidentStatus.Resuelta,
      priority: IncidentPriority.Media,
      requesterName: 'Carmen Vidal',
      assignedTo: 'Iván Serrano',
      createdAt,
    });

    // The chain stops at 'en_revision'; the log that should carry
    // 'en_revision' -> 'resuelta' was never written.
    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.Created,
      oldValue: null,
      newValue: IncidentStatus.Abierta,
      userName: 'Carmen Vidal',
      createdAt,
    });
    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.StatusChanged,
      oldValue: IncidentStatus.Abierta,
      newValue: IncidentStatus.EnRevision,
      userName: 'Iván Serrano',
      createdAt: new Date(createdAt.getTime() + HOUR_MS),
    });
  }

  /**
   * Case 2 — current status does not match the last logged status.
   *
   * The trail says the incident ended up resolved; the row says it is blocked.
   * Either a log was lost or the status was overwritten, and nothing in the
   * data says which — hence it is never auto-corrected.
   */
  private async seedStatusAheadOfLastLog(
    manager: EntityManager,
  ): Promise<void> {
    const createdAt = new Date(Date.now() - 4 * DAY_MS);

    const incidentId = await this.insertIncident(manager, {
      title: '[Inconsistencia 2] Alarma de incendios en revisión anual',
      description:
        'Caso sembrado a propósito: el estado actual es "bloqueada" pero el último log dice "resuelta".',
      status: IncidentStatus.Bloqueada,
      priority: IncidentPriority.Alta,
      requesterName: 'Rubén Castaño',
      assignedTo: 'Marco Díaz',
      createdAt,
    });

    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.Created,
      oldValue: null,
      newValue: IncidentStatus.Abierta,
      userName: 'Rubén Castaño',
      createdAt,
    });
    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.StatusChanged,
      oldValue: IncidentStatus.Abierta,
      newValue: IncidentStatus.EnRevision,
      userName: 'Marco Díaz',
      createdAt: new Date(createdAt.getTime() + HOUR_MS),
    });
    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.StatusChanged,
      oldValue: IncidentStatus.EnRevision,
      newValue: IncidentStatus.Resuelta,
      userName: 'Marco Díaz',
      createdAt: new Date(createdAt.getTime() + 2 * HOUR_MS),
    });
  }

  /**
   * Case 3a — exact duplicate log entries.
   *
   * Simulates a retried write: the same transition recorded twice, seconds
   * apart. The incident's status still matches the trail, so only the
   * duplicate check fires.
   */
  private async seedDuplicatedLog(manager: EntityManager): Promise<void> {
    const createdAt = new Date(Date.now() - 3 * DAY_MS);

    const incidentId = await this.insertIncident(manager, {
      title: '[Inconsistencia 3a] Mantenimiento de carros de la compra',
      description:
        'Caso sembrado a propósito: la transición "abierta" -> "en_revision" aparece registrada dos veces.',
      status: IncidentStatus.EnRevision,
      priority: IncidentPriority.Baja,
      requesterName: 'Paula Lamas',
      assignedTo: 'Iván Serrano',
      createdAt,
    });

    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.Created,
      oldValue: null,
      newValue: IncidentStatus.Abierta,
      userName: 'Paula Lamas',
      createdAt,
    });

    // Same (incident, action, old_value, new_value) twice, 4 seconds apart.
    for (const offsetMs of [HOUR_MS, HOUR_MS + 4_000]) {
      await this.insertLog(manager, {
        incidentId,
        action: IncidentLogAction.StatusChanged,
        oldValue: IncidentStatus.Abierta,
        newValue: IncidentStatus.EnRevision,
        userName: 'Iván Serrano',
        createdAt: new Date(createdAt.getTime() + offsetMs),
      });
    }
  }

  /**
   * Case 3b — broken log chain.
   *
   * The last entry starts from 'en_revision', but the previous one left the
   * incident in 'abierta': the intermediate log is missing. The current status
   * does match the trail, so only the chain check fires.
   */
  private async seedBrokenLogChain(manager: EntityManager): Promise<void> {
    const createdAt = new Date(Date.now() - 2 * DAY_MS);

    const incidentId = await this.insertIncident(manager, {
      title: '[Inconsistencia 3b] Fuga de agua en el aseo de personal',
      description:
        'Caso sembrado a propósito: falta el log intermedio, así que la cadena de estados no encadena.',
      status: IncidentStatus.Bloqueada,
      priority: IncidentPriority.Media,
      requesterName: 'Lucía Ortega',
      assignedTo: 'Marco Díaz',
      createdAt,
    });

    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.Created,
      oldValue: null,
      newValue: IncidentStatus.Abierta,
      userName: 'Lucía Ortega',
      createdAt,
    });
    // The 'abierta' -> 'en_revision' log is missing here.
    await this.insertLog(manager, {
      incidentId,
      action: IncidentLogAction.StatusChanged,
      oldValue: IncidentStatus.EnRevision,
      newValue: IncidentStatus.Bloqueada,
      userName: 'Marco Díaz',
      createdAt: new Date(createdAt.getTime() + 2 * HOUR_MS),
    });
  }

  private async insertIncident(
    manager: EntityManager,
    row: {
      title: string;
      description: string;
      status: IncidentStatus;
      priority: IncidentPriority;
      requesterName: string;
      assignedTo: string | null;
      createdAt: Date;
    },
  ): Promise<string> {
    const [{ id }] = await manager.query<{ id: string }[]>(
      `INSERT INTO incidents
         (title, description, status, priority, requester_name, assigned_to, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING id`,
      [
        row.title,
        row.description,
        row.status,
        row.priority,
        row.requesterName,
        row.assignedTo,
        row.createdAt,
      ],
    );

    return id;
  }

  private async insertLog(
    manager: EntityManager,
    row: {
      incidentId: string;
      action: IncidentLogAction;
      oldValue: string | null;
      newValue: string | null;
      userName: string;
      createdAt: Date;
    },
  ): Promise<void> {
    await manager.query(
      `INSERT INTO incident_logs
         (incident_id, action, old_value, new_value, user_name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        row.incidentId,
        row.action,
        row.oldValue,
        row.newValue,
        row.userName,
        row.createdAt,
      ],
    );
  }
}
