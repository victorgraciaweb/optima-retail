import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConsistencyFixResultDto,
  ConsistencyReportDto,
  FixConsistencyDto,
} from '../dto';
import { MaintenanceService } from '../services/maintenance.service';

/**
 * Data-consistency diagnostics.
 *
 * Exposed as HTTP endpoints rather than a CLI command so the same diagnosis is
 * reachable from Swagger, curl and the /maintenance screen, with no shell
 * access to the server.
 */
@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('consistency')
  @ApiOperation({
    summary: 'Data consistency report',
    description:
      'Runs every consistency check and returns the findings grouped by type, each one stating whether it can be repaired automatically and why. Read-only: this endpoint never writes.',
  })
  @ApiOkResponse({ type: ConsistencyReportDto })
  report(): Promise<ConsistencyReportDto> {
    return this.maintenanceService.report();
  }

  @Post('consistency/fix')
  // 200 rather than 201: nothing is created from the client's point of view,
  // and on a dry run nothing is written at all.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply the consistency corrections',
    description:
      'With dryRun=true (the default) returns the exact plan of changes without writing anything. With dryRun=false applies it inside a single transaction, leaving a consistency_fix log entry per change. Inconsistencies that cannot be resolved without inventing data are only flagged with needs_review.',
  })
  @ApiOkResponse({ type: ConsistencyFixResultDto })
  @ApiBadRequestResponse({ description: 'Validation error in the payload.' })
  fix(@Body() dto: FixConsistencyDto): Promise<ConsistencyFixResultDto> {
    return this.maintenanceService.fix(dto);
  }
}
