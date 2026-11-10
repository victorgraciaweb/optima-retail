import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Incident } from './incident.entity';

/**
 * Operational follow-up notes. Kept in its own table rather than as a log
 * action payload because a comment carries free text of its own and is not a
 * state transition — mixing both would force nullable columns on each side.
 */
@Entity('incident_comments')
@Index('idx_incident_comments_incident_created_at', ['incidentId', 'createdAt'])
export class IncidentComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @Column({ name: 'author_name', type: 'varchar', length: 120 })
  authorName: string;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Incident, (incident) => incident.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incident_id' })
  incident: Incident;
}
