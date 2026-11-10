import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { IncidentPriority, IncidentStatus } from '../enums';
import { IncidentSort } from '../enums/incident-sort.enum';

/**
 * Query strings carry a single value as a string and repeated values as an
 * array (`?status=abierta&status=bloqueada`). Normalising to an array here
 * keeps the service free of shape checks.
 */
const toArray = ({ value }: { value: unknown }): unknown[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return Array.isArray(value) ? value : [value];
};

export class ListIncidentsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: IncidentStatus,
    isArray: true,
    description:
      'Filter by one or more statuses. Repeat the parameter: ?status=abierta&status=bloqueada',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(IncidentStatus, { each: true })
  status?: IncidentStatus[];

  @ApiPropertyOptional({
    enum: IncidentPriority,
    isArray: true,
    description: 'Filter by one or more priorities.',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(IncidentPriority, { each: true })
  priority?: IncidentPriority[];

  @ApiPropertyOptional({
    example: 'impresora caja',
    description:
      'Free-text search over title and description (Spanish full-text search).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({
    example: 'Marco Díaz',
    description: 'Filter by the exact name of the assignee.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedTo?: string;

  @ApiPropertyOptional({
    enum: IncidentSort,
    example: IncidentSort.CreatedAtDesc,
    description: 'Sort order. Defaults to newest first.',
  })
  @IsOptional()
  @IsEnum(IncidentSort)
  sort?: IncidentSort;

  @ApiPropertyOptional({
    example: true,
    description:
      'When true, return only incidents flagged for manual review by the consistency check.',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @Type(() => Boolean)
  needsReview?: boolean;
}
