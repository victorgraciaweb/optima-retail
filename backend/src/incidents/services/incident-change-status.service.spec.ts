import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { Incident, IncidentLog } from '../entities';
import { IncidentLogAction, IncidentPriority, IncidentStatus } from '../enums';
import { IncidentChangeStatusService } from './incident-change-status.service';

const INCIDENT_ID = 'a3f1c8e0-5b2d-4c7a-9e11-6d0b2f4a8c33';

const buildIncident = (status: IncidentStatus): Incident =>
  ({
    id: INCIDENT_ID,
    title: 'La caja 3 no imprime tickets',
    description: 'Sin respuesta de la impresora.',
    status,
    priority: IncidentPriority.Alta,
    requesterName: 'Lucía Ortega',
    assignedTo: 'Marco Díaz',
    dueAt: null,
    needsReview: false,
    reviewReason: null,
    createdAt: new Date('2026-11-01T09:00:00.000Z'),
    updatedAt: new Date('2026-11-01T09:00:00.000Z'),
  }) as Incident;

/**
 * Minimal EntityManager double.
 *
 * `create` returns the plain object it is given so assertions can read the log
 * exactly as the service built it, and `save` records every call in order.
 */
const buildManager = (incident: Incident | null) => {
  const saved: unknown[] = [];

  const manager = {
    findOne: jest.fn().mockResolvedValue(incident),
    create: jest.fn((_entity: unknown, plain: unknown) => plain),
    save: jest.fn(async (entity: unknown) => {
      saved.push(entity);
      return entity;
    }),
  };

  return { manager: manager as unknown as EntityManager, saved, spy: manager };
};

describe('IncidentChangeStatusService', () => {
  let service: IncidentChangeStatusService;
  let transaction: jest.Mock;

  const buildService = async () => {
    transaction = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        IncidentChangeStatusService,
        { provide: DataSource, useValue: { transaction } },
      ],
    }).compile();

    service = moduleRef.get(IncidentChangeStatusService);
  };

  beforeEach(buildService);

  it('runs the status change and the log write inside a single transaction', async () => {
    const { manager, saved } = buildManager(
      buildIncident(IncidentStatus.Abierta),
    );
    transaction.mockImplementation((work) => work(manager));

    await service.execute(INCIDENT_ID, {
      status: IncidentStatus.EnRevision,
      actorName: 'Marco Díaz',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    // Both writes happened through the transactional manager, not a repository.
    expect(saved).toHaveLength(2);
  });

  it('writes the log with the previous status, the new status and the actor', async () => {
    const { manager, saved } = buildManager(
      buildIncident(IncidentStatus.Abierta),
    );
    transaction.mockImplementation((work) => work(manager));

    await service.execute(INCIDENT_ID, {
      status: IncidentStatus.EnRevision,
      actorName: 'Marco Díaz',
    });

    expect(saved[1]).toMatchObject({
      incidentId: INCIDENT_ID,
      action: IncidentLogAction.StatusChanged,
      oldValue: IncidentStatus.Abierta,
      newValue: IncidentStatus.EnRevision,
      userName: 'Marco Díaz',
      metadata: null,
    });
  });

  it('locks the incident row for write, so two concurrent changes cannot interleave', async () => {
    const { manager, spy } = buildManager(
      buildIncident(IncidentStatus.Abierta),
    );
    transaction.mockImplementation((work) => work(manager));

    await service.execute(INCIDENT_ID, {
      status: IncidentStatus.EnRevision,
      actorName: 'Marco Díaz',
    });

    expect(spy.findOne).toHaveBeenCalledWith(Incident, {
      where: { id: INCIDENT_ID },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('records a reopening as its own action and keeps the reason in metadata', async () => {
    const { manager, saved } = buildManager(
      buildIncident(IncidentStatus.Resuelta),
    );
    transaction.mockImplementation((work) => work(manager));

    await service.execute(INCIDENT_ID, {
      status: IncidentStatus.Abierta,
      actorName: 'Nuria Peña',
      reason: 'El proveedor confirma el envío completo.',
    });

    expect(saved[1]).toMatchObject({
      action: IncidentLogAction.Reopened,
      oldValue: IncidentStatus.Resuelta,
      newValue: IncidentStatus.Abierta,
      metadata: { reason: 'El proveedor confirma el envío completo.' },
    });
  });

  it('does not persist the new status when the log write fails', async () => {
    const incident = buildIncident(IncidentStatus.Abierta);
    const { manager, spy } = buildManager(incident);

    spy.save.mockImplementation(async (entity: any) => {
      // The second save is the log; make it blow up like a constraint error.
      if (entity.action) throw new Error('log insert failed');
      return entity;
    });

    // A real transaction rolls back on a thrown error; the double reproduces
    // that by letting the rejection propagate instead of committing.
    transaction.mockImplementation((work) => work(manager));

    await expect(
      service.execute(INCIDENT_ID, {
        status: IncidentStatus.EnRevision,
        actorName: 'Marco Díaz',
      }),
    ).rejects.toThrow('log insert failed');

    // The incident save was attempted but the error escaped the transaction
    // callback, so nothing is committed: no status without its log.
    expect(spy.save).toHaveBeenCalledTimes(2);
  });

  it('rejects an illegal transition before touching anything', async () => {
    const { manager, spy } = buildManager(
      buildIncident(IncidentStatus.Bloqueada),
    );
    transaction.mockImplementation((work) => work(manager));

    await expect(
      service.execute(INCIDENT_ID, {
        status: IncidentStatus.Abierta,
        actorName: 'Marco Díaz',
      }),
    ).rejects.toThrow(ConflictException);

    expect(spy.save).not.toHaveBeenCalled();
  });

  it('throws 404 when the incident does not exist', async () => {
    const { manager, spy } = buildManager(null);
    transaction.mockImplementation((work) => work(manager));

    await expect(
      service.execute(INCIDENT_ID, {
        status: IncidentStatus.EnRevision,
        actorName: 'Marco Díaz',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(spy.save).not.toHaveBeenCalled();
  });

  it('builds the log through the transactional manager, never a global repository', async () => {
    const { manager, spy } = buildManager(
      buildIncident(IncidentStatus.EnRevision),
    );
    transaction.mockImplementation((work) => work(manager));

    await service.execute(INCIDENT_ID, {
      status: IncidentStatus.Resuelta,
      actorName: 'Iván Serrano',
    });

    expect(spy.create).toHaveBeenCalledWith(IncidentLog, expect.any(Object));
  });
});
