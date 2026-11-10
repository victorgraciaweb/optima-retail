import 'dotenv/config';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
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
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { CONSISTENCY_CHECKS_BY_KEY, ConsistencyFinding } from './index';

/**
 * Integration spec: the consistency checks are SQL, so verifying them against
 * mocks would only test the mocks. It needs the Postgres container to be
 * running (`docker compose up -d` plus `yarn migration:run`).
 *
 * Everything happens inside one transaction that is always rolled back, so the
 * development dataset is left exactly as it was.
 */
describe('consistency checks (integration)', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let manager: EntityManager;

  const ids: Record<string, string> = {};

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      entities: [Incident, IncidentLog, IncidentComment],
      synchronize: false,
    });

    try {
      await dataSource.initialize();
    } catch (error) {
      throw new Error(
        'No se pudo conectar a Postgres. Levanta la base de datos antes de los tests: ' +
          `docker compose up -d && yarn migration:run. Causa: ${(error as Error).message}`,
      );
    }

    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    manager = queryRunner.manager;

    await manager.query('TRUNCATE TABLE incidents CASCADE');
    await seedFixtures();
  });

  // A single afterAll, in order: roll the fixtures back, then close the pool.
  // Splitting them across two hooks made the pool close before the rollback.
  afterAll(async () => {
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    if (queryRunner && !queryRunner.isReleased) await queryRunner.release();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  const insertIncident = async (
    key: string,
    status: IncidentStatus,
    title: string,
  ): Promise<string> => {
    const [{ id }] = await manager.query<{ id: string }[]>(
      `INSERT INTO incidents (title, description, status, priority, requester_name, created_at, updated_at)
       VALUES ($1, 'fixture', $2, $3, 'Tester', NOW(), NOW()) RETURNING id`,
      [title, status, IncidentPriority.Media],
    );
    ids[key] = id;
    return id;
  };

  const insertLog = (
    incidentId: string,
    action: IncidentLogAction,
    oldValue: string | null,
    newValue: string | null,
    secondsOffset: number,
  ) =>
    manager.query(
      `INSERT INTO incident_logs (incident_id, action, old_value, new_value, user_name, created_at)
       VALUES ($1, $2, $3, $4, 'Tester', NOW() + ($5 || ' seconds')::interval)`,
      [incidentId, action, oldValue, newValue, String(secondsOffset)],
    );

  async function seedFixtures(): Promise<void> {
    // --- clean: a coherent incident that must not be reported by any check ---
    const clean = await insertIncident(
      'clean',
      IncidentStatus.Resuelta,
      'limpia',
    );
    await insertLog(
      clean,
      IncidentLogAction.Created,
      null,
      IncidentStatus.Abierta,
      0,
    );
    await insertLog(
      clean,
      IncidentLogAction.StatusChanged,
      IncidentStatus.Abierta,
      IncidentStatus.EnRevision,
      10,
    );
    await insertLog(
      clean,
      IncidentLogAction.StatusChanged,
      IncidentStatus.EnRevision,
      IncidentStatus.Resuelta,
      20,
    );
    // A comment log carries no status values and must not break the chain.
    await insertLog(clean, IncidentLogAction.Commented, null, null, 30);

    // --- case 1: resolved, but no log ever set 'resuelta' ---
    const noLog = await insertIncident(
      'case1',
      IncidentStatus.Resuelta,
      'caso 1',
    );
    await insertLog(
      noLog,
      IncidentLogAction.Created,
      null,
      IncidentStatus.Abierta,
      0,
    );
    await insertLog(
      noLog,
      IncidentLogAction.StatusChanged,
      IncidentStatus.Abierta,
      IncidentStatus.EnRevision,
      10,
    );

    // --- case 2: status disagrees with the last logged status ---
    const mismatch = await insertIncident(
      'case2',
      IncidentStatus.Bloqueada,
      'caso 2',
    );
    await insertLog(
      mismatch,
      IncidentLogAction.Created,
      null,
      IncidentStatus.Abierta,
      0,
    );
    await insertLog(
      mismatch,
      IncidentLogAction.StatusChanged,
      IncidentStatus.Abierta,
      IncidentStatus.EnRevision,
      10,
    );
    await insertLog(
      mismatch,
      IncidentLogAction.StatusChanged,
      IncidentStatus.EnRevision,
      IncidentStatus.Resuelta,
      20,
    );

    // --- case 3a: the same transition recorded twice ---
    const duplicated = await insertIncident(
      'case3a',
      IncidentStatus.EnRevision,
      'caso 3a',
    );
    await insertLog(
      duplicated,
      IncidentLogAction.Created,
      null,
      IncidentStatus.Abierta,
      0,
    );
    await insertLog(
      duplicated,
      IncidentLogAction.StatusChanged,
      IncidentStatus.Abierta,
      IncidentStatus.EnRevision,
      10,
    );
    await insertLog(
      duplicated,
      IncidentLogAction.StatusChanged,
      IncidentStatus.Abierta,
      IncidentStatus.EnRevision,
      14,
    );

    // --- case 3b: the intermediate log is missing, so the chain does not link ---
    const broken = await insertIncident(
      'case3b',
      IncidentStatus.Bloqueada,
      'caso 3b',
    );
    await insertLog(
      broken,
      IncidentLogAction.Created,
      null,
      IncidentStatus.Abierta,
      0,
    );
    await insertLog(
      broken,
      IncidentLogAction.StatusChanged,
      IncidentStatus.EnRevision,
      IncidentStatus.Bloqueada,
      20,
    );
  }

  const run = (check: ConsistencyCheck): Promise<ConsistencyFinding[]> =>
    CONSISTENCY_CHECKS_BY_KEY[check].run(manager);

  const incidentIds = (findings: ConsistencyFinding[]) =>
    findings.map((finding) => finding.incidentId).sort();

  it('detects only the resolved incident with no resolution log', async () => {
    const findings = await run(ConsistencyCheck.ResolvedWithoutResolutionLog);

    expect(incidentIds(findings)).toEqual([ids.case1]);
    expect(findings[0].detail).toMatchObject({
      currentStatus: IncidentStatus.Resuelta,
      missingLogValue: IncidentStatus.Resuelta,
    });
  });

  it('detects only the status/last-log mismatch, and reports both values', async () => {
    const findings = await run(ConsistencyCheck.StatusMismatchWithLastLog);

    expect(incidentIds(findings)).toEqual([ids.case2]);
    expect(findings[0].detail).toMatchObject({
      currentStatus: IncidentStatus.Bloqueada,
      lastLoggedStatus: IncidentStatus.Resuelta,
    });
  });

  it('does not report case 1 as a mismatch, since reconstructing its log repairs it', async () => {
    const findings = await run(ConsistencyCheck.StatusMismatchWithLastLog);

    expect(incidentIds(findings)).not.toContain(ids.case1);
  });

  it('detects only the duplicated log pair, and names which row to keep', async () => {
    const findings = await run(ConsistencyCheck.DuplicatedLogs);

    expect(incidentIds(findings)).toEqual([ids.case3a]);
    expect(findings[0].detail).toMatchObject({
      action: IncidentLogAction.StatusChanged,
      oldValue: IncidentStatus.Abierta,
      newValue: IncidentStatus.EnRevision,
      occurrences: 2,
    });
    expect(findings[0].detail.removeLogIds).toHaveLength(1);
  });

  it('detects only the genuinely broken chain, not the one caused by a duplicate', async () => {
    const findings = await run(ConsistencyCheck.BrokenLogChain);

    expect(incidentIds(findings)).toEqual([ids.case3b]);
    expect(findings[0].detail).toMatchObject({
      expectedOldValue: IncidentStatus.Abierta,
      actualOldValue: IncidentStatus.EnRevision,
    });
  });

  it('reports no false positives on the coherent incident', async () => {
    const all = await Promise.all(
      Object.values(ConsistencyCheck).map((check) => run(check)),
    );

    expect(all.flat().map((finding) => finding.incidentId)).not.toContain(
      ids.clean,
    );
  });
});
