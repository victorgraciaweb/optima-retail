import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConsistencyCheck } from '../enums/consistency-check.enum';

export class FixConsistencyDto {
  @ApiPropertyOptional({
    example: true,
    default: true,
    description:
      'When true (the default), returns the exact plan of changes without writing anything. Must be sent explicitly as false to apply them.',
  })
  @IsOptional()
  @IsBoolean()
  // Defaults to true in the service, not here: an absent field and an explicit
  // `false` must be distinguishable, so the safe default can never be lost to
  // a typo in the body.
  dryRun?: boolean;

  @ApiPropertyOptional({
    enum: ConsistencyCheck,
    isArray: true,
    description:
      'Restrict the fix to these checks. Omit to consider every check.',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : Array.isArray(value)
        ? value
        : [value],
  )
  @IsArray()
  @IsEnum(ConsistencyCheck, { each: true })
  checks?: ConsistencyCheck[];

  @ApiProperty({
    example: 'Marco Díaz',
    description:
      'Operator requesting the fix. Recorded in the audit metadata of every change applied.',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  actorName: string;
}
