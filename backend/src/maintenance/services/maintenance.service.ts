import { Injectable } from '@nestjs/common';
import {
  ConsistencyFixResultDto,
  ConsistencyReportDto,
  FixConsistencyDto,
} from '../dto';
import { ConsistencyFixService } from './consistency-fix.service';
import { ConsistencyReportService } from './consistency-report.service';

/**
 * Facade over the maintenance use cases, mirroring the incidents module: the
 * controller depends on this class only.
 */
@Injectable()
export class MaintenanceService {
  constructor(
    private readonly reportService: ConsistencyReportService,
    private readonly fixService: ConsistencyFixService,
  ) {}

  report(): Promise<ConsistencyReportDto> {
    return this.reportService.execute();
  }

  fix(dto: FixConsistencyDto): Promise<ConsistencyFixResultDto> {
    return this.fixService.execute(dto);
  }
}
