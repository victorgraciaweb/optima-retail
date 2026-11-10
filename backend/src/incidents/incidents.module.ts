import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsController } from './controllers/incidents.controller';
import { Incident, IncidentComment, IncidentLog } from './entities';
import { IncidentActivityService } from './services/incident-activity.service';
import { IncidentAddCommentService } from './services/incident-add-comment.service';
import { IncidentChangeStatusService } from './services/incident-change-status.service';
import { IncidentCreateService } from './services/incident-create.service';
import { IncidentFindAllService } from './services/incident-find-all.service';
import { IncidentFindOneService } from './services/incident-find-one.service';
import { IncidentStatsService } from './services/incident-stats.service';
import { IncidentsService } from './services/incidents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, IncidentLog, IncidentComment])],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    IncidentCreateService,
    IncidentFindAllService,
    IncidentFindOneService,
    IncidentStatsService,
    IncidentChangeStatusService,
    IncidentAddCommentService,
    IncidentActivityService,
  ],
  exports: [TypeOrmModule],
})
export class IncidentsModule {}
