import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IncidentStatus } from '../enums';

export class ChangeIncidentStatusDto {
  @ApiProperty({
    enum: IncidentStatus,
    example: IncidentStatus.EnRevision,
    description: 'Target status. Must be reachable from the current one.',
  })
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @ApiProperty({
    example: 'Marco Díaz',
    description: 'Actor performing the change, recorded in the audit trail.',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  actorName: string;

  @ApiPropertyOptional({
    example: 'El problema ha vuelto a reproducirse tras el cierre.',
    description:
      'Reason for the change. Mandatory when reopening a resolved incident ("resuelta" -> "abierta").',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
