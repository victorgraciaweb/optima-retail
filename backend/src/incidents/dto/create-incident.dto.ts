import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IncidentPriority } from '../enums';

export class CreateIncidentDto {
  @ApiProperty({
    example: 'La caja 3 no imprime tickets',
    description: 'Short title of the incident.',
    maxLength: 180,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @ApiProperty({
    example:
      'Desde la apertura, la impresora de la caja 3 no responde. Se ha reiniciado sin efecto.',
    description: 'Full description of the incident.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    enum: IncidentPriority,
    example: IncidentPriority.Alta,
    description: 'Operational priority. Defaults to "media" when omitted.',
  })
  @IsOptional()
  @IsEnum(IncidentPriority)
  priority?: IncidentPriority;

  @ApiProperty({
    example: 'Lucía Ortega',
    description: 'Person who reported the incident.',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  requesterName: string;

  @ApiPropertyOptional({
    example: 'Marco Díaz',
    description: 'Person responsible for resolving the incident.',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  assignedTo?: string;

  @ApiPropertyOptional({
    example: '2026-11-20T18:00:00.000Z',
    description: 'Operational deadline (ISO 8601).',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiProperty({
    example: 'Marco Díaz',
    description:
      'Actor performing the creation. Required for traceability: there is no authentication, so the actor travels in the body.',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  actorName: string;
}
