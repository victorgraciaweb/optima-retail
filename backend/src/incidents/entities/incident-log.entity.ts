import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncidentLogAction } from '../enums';
import { Incident } from './incident.entity';

/**
 * Append-only audit trail of relevant changes to an incident.
 *
 * Rows are never updated: a correction is a new row (see
 * `IncidentLogAction.ConsistencyFix`), so the history stays reconstructable.
 */
@Entity('incident_logs')
// The history is always read per incident and in chronological order, so the
// composite index serves both the filter and the sort.
@Index('idx_incident_logs_incident_created_at', ['incidentId', 'createdAt'])
export class IncidentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @Column({ type: 'enum', enum: IncidentLogAction })
  action: IncidentLogAction;

  /** Status before the change. Null for `created` and for comments. */
  @Column({ name: 'old_value', type: 'varchar', length: 40, nullable: true })
  oldValue: string | null;

  /** Status after the change. Null for comments. */
  @Column({ name: 'new_value', type: 'varchar', length: 40, nullable: true })
  newValue: string | null;

  /**
   * Actor that caused the change. There is no authentication in this project,
   * so it is supplied by the client and validated as a plain name (see README).
   */
  @Column({ name: 'user_name', type: 'varchar', length: 120 })
  userName: string;

  /**
   * Free-form context: reopening reason, origin, reconstruction flags.
   * `jsonb` instead of columns because the shape differs per action and this
   * payload is only ever read as a whole, never filtered on.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Incident, (incident) => incident.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incident_id' })
  incident: Incident;
}
