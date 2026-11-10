import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ConsistencyCheckReportDto, ConsistencyReportDto } from '../dto';
import { CONSISTENCY_CHECKS } from '../queries';

@Injectable()
export class ConsistencyReportService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Runs every check and returns the grouped report. Read-only by
   * construction: the checks only ever SELECT.
   *
   * Executed inside a single transaction so all checks see the same snapshot —
   * otherwise a concurrent status change could make the report internally
   * contradictory (an incident reported by check 1 and already repaired by the
   * time check 2 runs).
   *
   * @param manager Optional manager, so the fix service can reuse the checks
   *                inside its own transaction instead of opening a second one.
   */
  async execute(manager?: EntityManager): Promise<ConsistencyReportDto> {
    const run = async (em: EntityManager) => {
      const groups: ConsistencyCheckReportDto[] = [];

      for (const definition of CONSISTENCY_CHECKS) {
        groups.push(
          new ConsistencyCheckReportDto(definition, await definition.run(em)),
        );
      }

      return groups;
    };

    const groups = manager
      ? await run(manager)
      : await this.dataSource.transaction(run);

    return new ConsistencyReportDto(new Date(), groups);
  }
}
