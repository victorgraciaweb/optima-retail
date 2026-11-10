import { ApiProperty } from '@nestjs/swagger';
import { ConsistencyCheck } from '../enums/consistency-check.enum';

export enum FixOperationKind {
  /** Write the log entry that was never recorded. */
  ReconstructLog = 'reconstruct_log',
  /** Delete redundant copies of an identical log entry. */
  DeleteDuplicateLogs = 'delete_duplicate_logs',
  /** Flag the incident for a human, changing no operational data. */
  FlagForReview = 'flag_for_review',
}

export class ConsistencyFixOperationDto {
  @ApiProperty({ enum: ConsistencyCheck })
  check: ConsistencyCheck;

  @ApiProperty({ enum: FixOperationKind })
  kind: FixOperationKind;

  @ApiProperty({ example: 'a3f1c8e0-5b2d-4c7a-9e11-6d0b2f4a8c33' })
  incidentId: string;

  @ApiProperty({
    example: '[Inconsistencia 1] Devolución 2026-10-0217 sin abonar',
  })
  incidentTitle: string;

  @ApiProperty({
    example:
      'Crear log consistency_fix con new_value="resuelta" y metadata.reconstructed=true.',
    description: 'Exactly what was done, or would be done on a dry run.',
  })
  description: string;

  @ApiProperty({
    example: false,
    description: 'False on a dry run: the operation was planned, not executed.',
  })
  applied: boolean;
}

export class ConsistencyFixResultDto {
  @ApiProperty({
    example: true,
    description:
      'True when nothing was written. The response is then a preview of the plan.',
  })
  dryRun: boolean;

  @ApiProperty({ example: 'Marco Díaz' })
  actorName: string;

  @ApiProperty({ example: '2026-11-10T18:40:00.000Z' })
  executedAt: Date;

  @ApiProperty({ example: 2, description: 'Number of operations in the plan.' })
  totalOperations: number;

  @ApiProperty({
    example: 2,
    description:
      'Incidents left untouched beyond a review flag, because repairing them would require inventing data.',
  })
  flaggedForReview: number;

  @ApiProperty({ type: ConsistencyFixOperationDto, isArray: true })
  operations: ConsistencyFixOperationDto[];

  constructor(
    dryRun: boolean,
    actorName: string,
    executedAt: Date,
    operations: ConsistencyFixOperationDto[],
  ) {
    this.dryRun = dryRun;
    this.actorName = actorName;
    this.executedAt = executedAt;
    this.operations = operations;
    this.totalOperations = operations.length;
    this.flaggedForReview = operations.filter(
      (operation) => operation.kind === FixOperationKind.FlagForReview,
    ).length;
  }
}
