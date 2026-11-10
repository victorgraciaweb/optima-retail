import { Module } from '@nestjs/common';
import { IncidentsModule } from '../incidents/incidents.module';
import { MaintenanceController } from './controllers/maintenance.controller';
import { ConsistencyFixService } from './services/consistency-fix.service';
import { ConsistencyReportService } from './services/consistency-report.service';
import { MaintenanceService } from './services/maintenance.service';

@Module({
  // Imported for the incident entity metadata the fix service writes through.
  imports: [IncidentsModule],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    ConsistencyReportService,
    ConsistencyFixService,
  ],
})
export class MaintenanceModule {}
