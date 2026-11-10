import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentStatsResponseDto } from '../dto';
import { Incident } from '../entities';
import { IncidentStatus } from '../enums';

@Injectable()
export class IncidentStatsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  /**
   * Counts used by the visual status counters.
   *
   * Three aggregates in a single round trip rather than one query per status:
   * the grouped count is a single index scan, and the UI needs all of them
   * together anyway.
   */
  async execute(): Promise<IncidentStatsResponseDto> {
    const grouped = await this.incidentRepository
      .createQueryBuilder('incident')
      .select('incident.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('incident.status')
      .getRawMany<{ status: IncidentStatus; count: number }>();

    // Start from every status at zero: a status with no rows is absent from
    // the GROUP BY result, and the counters must not show gaps.
    const byStatus = Object.values(IncidentStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<IncidentStatus, number>,
    );

    for (const row of grouped) {
      byStatus[row.status] = row.count;
    }

    const overdue = await this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.due_at IS NOT NULL')
      .andWhere('incident.due_at < NOW()')
      .andWhere('incident.status != :resolved', {
        resolved: IncidentStatus.Resuelta,
      })
      .getCount();

    const needsReview = await this.incidentRepository.countBy({
      needsReview: true,
    });

    return new IncidentStatsResponseDto(byStatus, overdue, needsReview);
  }
}
