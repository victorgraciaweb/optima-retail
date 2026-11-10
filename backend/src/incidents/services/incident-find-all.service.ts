import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { IncidentResponseDto, ListIncidentsQueryDto } from '../dto';
import { Incident } from '../entities';
import { IncidentSort } from '../enums';

/**
 * Maps every whitelisted sort value to a fixed column and direction, so no
 * user-supplied string ever reaches `ORDER BY`.
 *
 * `priority:desc` sorts on the enum's declaration order (baja < media < alta <
 * critica) by casting to text and using the Postgres enum ordering, which
 * matches how the type was created in the migration.
 */
const SORT_CLAUSES: Record<
  IncidentSort,
  { column: string; direction: 'ASC' | 'DESC' }
> = {
  [IncidentSort.CreatedAtDesc]: {
    column: 'incident.createdAt',
    direction: 'DESC',
  },
  [IncidentSort.CreatedAtAsc]: {
    column: 'incident.createdAt',
    direction: 'ASC',
  },
  [IncidentSort.UpdatedAtDesc]: {
    column: 'incident.updatedAt',
    direction: 'DESC',
  },
  [IncidentSort.DueAtAsc]: { column: 'incident.dueAt', direction: 'ASC' },
  [IncidentSort.PriorityDesc]: {
    column: 'incident.priority',
    direction: 'DESC',
  },
};

@Injectable()
export class IncidentFindAllService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async execute(
    query: ListIncidentsQueryDto,
  ): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    const { limit = 10, offset = 0, sort = IncidentSort.CreatedAtDesc } = query;

    const qb = this.incidentRepository.createQueryBuilder('incident');

    this.applyFilters(qb, query);

    const { column, direction } = SORT_CLAUSES[sort];
    qb.orderBy(column, direction, 'NULLS LAST')
      // Deterministic tiebreaker: without it, two incidents sharing a
      // timestamp can swap pages between requests.
      .addOrderBy('incident.id', 'ASC')
      .take(limit)
      .skip(offset);

    const [incidents, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto<IncidentResponseDto>(
      incidents.map((incident) => new IncidentResponseDto(incident)),
      total,
      Math.ceil(total / limit),
    );
  }

  private applyFilters(
    qb: SelectQueryBuilder<Incident>,
    { status, priority, q, assignedTo, needsReview }: ListIncidentsQueryDto,
  ): void {
    if (status?.length) {
      qb.andWhere('incident.status IN (:...status)', { status });
    }

    if (priority?.length) {
      qb.andWhere('incident.priority IN (:...priority)', { priority });
    }

    if (assignedTo) {
      qb.andWhere('incident.assigned_to = :assignedTo', { assignedTo });
    }

    if (needsReview) {
      qb.andWhere('incident.needs_review = true');
    }

    // Full-text search against the stored tsvector column, so the GIN index
    // is used instead of tokenizing every row on each request.
    if (q?.trim()) {
      qb.andWhere(`incident.search_vector @@ plainto_tsquery('spanish', :q)`, {
        q: q.trim(),
      });
    }
  }
}
