import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IncidentPriority, IncidentStatus } from '../enums';
import { IncidentComment } from './incident-comment.entity';
import { IncidentLog } from './incident-log.entity';

@Entity('incidents')
// Composite index for the most common listing: filter by status and priority
// at once. Postgres can still use it for a status-only filter (leftmost
// prefix), so the single-column status index below is for sorting/counting.
@Index('idx_incidents_status_priority', ['status', 'priority'])
@Index('idx_incidents_status', ['status'])
@Index('idx_incidents_priority', ['priority'])
@Index('idx_incidents_created_at', ['createdAt'])
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.Abierta,
  })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: IncidentPriority,
    default: IncidentPriority.Media,
  })
  priority: IncidentPriority;

  @Column({ name: 'requester_name', type: 'varchar', length: 120 })
  requesterName: string;

  @Column({ name: 'assigned_to', type: 'varchar', length: 120, nullable: true })
  assignedTo: string | null;

  /**
   * Optional operational deadline. Drives the "overdue" highlight in the UI;
   * nullable because not every incident is committed to a date.
   */
  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  /**
   * Set by the maintenance consistency check when an inconsistency cannot be
   * resolved automatically without destroying information. It is a flag for a
   * human, never a state the application writes during normal operation.
   */
  @Column({ name: 'needs_review', type: 'boolean', default: false })
  needsReview: boolean;

  @Column({ name: 'review_reason', type: 'text', nullable: true })
  reviewReason: string | null;

  /**
   * Pre-computed full-text vector maintained by PostgreSQL itself.
   *
   * Stored (rather than computing `to_tsvector(...)` in the WHERE clause) so
   * free-text search can use a GIN index instead of re-tokenizing every row.
   * `select: false` keeps it out of every entity read — it is never returned.
   */
  @Column({
    name: 'search_vector',
    type: 'tsvector',
    select: false,
    asExpression: `to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, ''))`,
    generatedType: 'STORED',
  })
  searchVector: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => IncidentLog, (log) => log.incident)
  logs: IncidentLog[];

  @OneToMany(() => IncidentComment, (comment) => comment.incident)
  comments: IncidentComment[];
}
