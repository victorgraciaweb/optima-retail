import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentActivityEntryDto } from '../dto';
import { Incident, IncidentComment, IncidentLog } from '../entities';

@Injectable()
export class IncidentActivityService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(IncidentLog)
    private readonly logRepository: Repository<IncidentLog>,
    @InjectRepository(IncidentComment)
    private readonly commentRepository: Repository<IncidentComment>,
  ) {}

  /**
   * Unified chronological timeline of logs and comments.
   *
   * Merged in memory instead of with a SQL `UNION`: both lists are scoped to a
   * single incident (bounded, index-backed reads) and the two tables have
   * different column sets, so a UNION would need padding columns on each side
   * for no gain.
   */
  async execute(incidentId: string): Promise<IncidentActivityEntryDto[]> {
    const exists = await this.incidentRepository.exists({
      where: { id: incidentId },
    });

    if (!exists) {
      throw new NotFoundException(`Incidencia ${incidentId} no encontrada.`);
    }

    const [logs, comments] = await Promise.all([
      this.logRepository.find({
        where: { incidentId },
        order: { createdAt: 'ASC' },
      }),
      this.commentRepository.find({
        where: { incidentId },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return [
      ...logs.map((log) => IncidentActivityEntryDto.fromLog(log)),
      ...comments.map((comment) =>
        IncidentActivityEntryDto.fromComment(comment),
      ),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
