import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentResponseDto } from '../dto';
import { Incident } from '../entities';

@Injectable()
export class IncidentFindOneService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async execute(id: string): Promise<IncidentResponseDto> {
    const incident = await this.incidentRepository.findOne({ where: { id } });

    if (!incident) {
      throw new NotFoundException(`Incidencia ${id} no encontrada.`);
    }

    return new IncidentResponseDto(incident);
  }
}
