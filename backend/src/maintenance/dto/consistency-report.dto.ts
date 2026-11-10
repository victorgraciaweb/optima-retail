import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsistencyCheck } from '../enums/consistency-check.enum';
import { ConsistencyCheckDefinition, ConsistencyFinding } from '../queries';

export class ConsistencyFindingDto {
  @ApiProperty({ example: 'a3f1c8e0-5b2d-4c7a-9e11-6d0b2f4a8c33' })
  incidentId: string;

  @ApiProperty({
    example: '[Inconsistencia 1] Devolución 2026-10-0217 sin abonar',
  })
  incidentTitle: string;

  @ApiProperty({
    description:
      'Check-specific evidence: conflicting values, affected log ids, timestamps.',
    example: { currentStatus: 'resuelta', missingLogValue: 'resuelta' },
  })
  detail: Record<string, unknown>;
}

export class ConsistencyCheckReportDto {
  @ApiProperty({ enum: ConsistencyCheck })
  check: ConsistencyCheck;

  @ApiProperty({ example: 'Incidencias resueltas sin log de resolución' })
  title: string;

  @ApiProperty({
    description: 'What the query detects and why it indicates corrupted data.',
  })
  description: string;

  @ApiProperty({
    example: true,
    description:
      'Whether the inconsistency can be repaired without inventing information.',
  })
  autoFixable: boolean;

  @ApiProperty({
    description:
      'What the fix would do, or — when not auto-fixable — why it is left to a human.',
  })
  proposedAction: string;

  @ApiProperty({ example: 1 })
  count: number;

  @ApiProperty({ type: ConsistencyFindingDto, isArray: true })
  findings: ConsistencyFindingDto[];

  constructor(
    definition: ConsistencyCheckDefinition,
    findings: ConsistencyFinding[],
  ) {
    this.check = definition.check;
    this.title = definition.title;
    this.description = definition.description;
    this.autoFixable = definition.autoFixable;
    this.proposedAction = definition.proposedAction;
    this.count = findings.length;
    this.findings = findings;
  }
}

export class ConsistencyReportDto {
  @ApiProperty({ example: '2026-11-10T18:40:00.000Z' })
  generatedAt: Date;

  @ApiProperty({ example: 4, description: 'Total findings across all checks.' })
  totalFindings: number;

  @ApiProperty({
    example: 2,
    description: 'Findings the fix endpoint can repair on its own.',
  })
  autoFixableFindings: number;

  @ApiProperty({
    example: 2,
    description:
      'Findings that are only flagged for manual review, never repaired automatically.',
  })
  manualReviewFindings: number;

  @ApiProperty({ type: ConsistencyCheckReportDto, isArray: true })
  checks: ConsistencyCheckReportDto[];

  @ApiPropertyOptional({
    description:
      'Reminder that this endpoint never writes: use POST /maintenance/consistency/fix to act on it.',
  })
  note: string;

  constructor(generatedAt: Date, checks: ConsistencyCheckReportDto[]) {
    this.generatedAt = generatedAt;
    this.checks = checks;
    this.totalFindings = checks.reduce((sum, group) => sum + group.count, 0);
    this.autoFixableFindings = checks
      .filter((group) => group.autoFixable)
      .reduce((sum, group) => sum + group.count, 0);
    this.manualReviewFindings = this.totalFindings - this.autoFixableFindings;
    this.note =
      'Informe de solo lectura. Para actuar: POST /api/maintenance/consistency/fix (dryRun=true por defecto).';
  }
}
