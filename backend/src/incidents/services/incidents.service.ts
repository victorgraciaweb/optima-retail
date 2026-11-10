import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import {
  ChangeIncidentStatusDto,
  CreateIncidentCommentDto,
  CreateIncidentDto,
  IncidentActivityEntryDto,
  IncidentCommentResponseDto,
  IncidentResponseDto,
  IncidentStatsResponseDto,
  ListIncidentsQueryDto,
} from '../dto';
import { IncidentActivityService } from './incident-activity.service';
import { IncidentAddCommentService } from './incident-add-comment.service';
import { IncidentChangeStatusService } from './incident-change-status.service';
import { IncidentCreateService } from './incident-create.service';
import { IncidentFindAllService } from './incident-find-all.service';
import { IncidentFindOneService } from './incident-find-one.service';
import { IncidentStatsService } from './incident-stats.service';

/**
 * Facade over the use-case services.
 *
 * The controller depends only on this class, so adding or splitting a use case
 * never changes the HTTP layer. Each collaborator exposes a single
 * `execute()`, which keeps the units small and trivially mockable in tests.
 */
@Injectable()
export class IncidentsService {
  constructor(
    private readonly createService: IncidentCreateService,
    private readonly findAllService: IncidentFindAllService,
    private readonly findOneService: IncidentFindOneService,
    private readonly statsService: IncidentStatsService,
    private readonly changeStatusService: IncidentChangeStatusService,
    private readonly addCommentService: IncidentAddCommentService,
    private readonly activityService: IncidentActivityService,
  ) {}

  create(dto: CreateIncidentDto): Promise<IncidentResponseDto> {
    return this.createService.execute(dto);
  }

  findAll(
    query: ListIncidentsQueryDto,
  ): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    return this.findAllService.execute(query);
  }

  findOne(id: string): Promise<IncidentResponseDto> {
    return this.findOneService.execute(id);
  }

  stats(): Promise<IncidentStatsResponseDto> {
    return this.statsService.execute();
  }

  changeStatus(
    id: string,
    dto: ChangeIncidentStatusDto,
  ): Promise<IncidentResponseDto> {
    return this.changeStatusService.execute(id, dto);
  }

  addComment(
    id: string,
    dto: CreateIncidentCommentDto,
  ): Promise<IncidentCommentResponseDto> {
    return this.addCommentService.execute(id, dto);
  }

  activity(id: string): Promise<IncidentActivityEntryDto[]> {
    return this.activityService.execute(id);
  }
}
