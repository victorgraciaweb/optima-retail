import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
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
import { IncidentsService } from '../services/incidents.service';

/**
 * Incidents HTTP controller.
 *
 * Holds no business logic: it validates the shape of the request (pipes and
 * DTOs) and delegates to IncidentsService.
 */
@ApiTags('Incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an incident',
    description:
      'Validates the payload and creates the incident together with its initial "created" log entry, in a single transaction.',
  })
  @ApiCreatedResponse({
    description: 'The incident just created.',
    type: IncidentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error in the payload.' })
  create(@Body() dto: CreateIncidentDto): Promise<IncidentResponseDto> {
    return this.incidentsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List incidents',
    description:
      'Returns a paginated list of incidents, optionally filtered by status, priority, assignee, review flag and free text.',
  })
  @ApiExtraModels(PaginatedResponseDto, IncidentResponseDto)
  @ApiOkResponse({
    description: 'Paginated list of incidents matching the given filters.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(IncidentResponseDto) },
            },
          },
        },
      ],
    },
  })
  findAll(
    @Query() query: ListIncidentsQueryDto,
  ): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    return this.incidentsService.findAll(query);
  }

  /**
   * Declared before `:id` so the literal path is not captured by the
   * parameterised route.
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Incident counters',
    description:
      'Counts per status plus overdue and pending-review totals. Feeds the visual counters in the panel.',
  })
  @ApiOkResponse({ type: IncidentStatsResponseDto })
  stats(): Promise<IncidentStatsResponseDto> {
    return this.incidentsService.stats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an incident by ID',
    description:
      'Returns a single incident, including the statuses reachable from its current one.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: IncidentResponseDto })
  @ApiNotFoundResponse({ description: 'No incident exists with the given ID.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change the status of an incident',
    description:
      'Applies the transition if the state machine allows it and records it in incident_logs within the same transaction. Reopening a resolved incident requires a reason.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'The incident with its new status.',
    type: IncidentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error, or reopening without a reason.',
  })
  @ApiConflictResponse({
    description:
      'The transition is not allowed from the current status, or the incident is already in the requested status.',
  })
  @ApiNotFoundResponse({ description: 'No incident exists with the given ID.' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeIncidentStatusDto,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.changeStatus(id, dto);
  }

  @Get(':id/activity')
  @ApiOperation({
    summary: 'Activity timeline of an incident',
    description:
      'Status-change history and operational comments merged into a single chronological feed.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: IncidentActivityEntryDto, isArray: true })
  @ApiNotFoundResponse({ description: 'No incident exists with the given ID.' })
  activity(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentActivityEntryDto[]> {
    return this.incidentsService.activity(id);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Add an operational comment',
    description:
      'Stores the comment and its matching log entry so commenting is also traceable.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: IncidentCommentResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error in the payload.' })
  @ApiNotFoundResponse({ description: 'No incident exists with the given ID.' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateIncidentCommentDto,
  ): Promise<IncidentCommentResponseDto> {
    return this.incidentsService.addComment(id, dto);
  }
}
