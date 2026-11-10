import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Current application status.',
  })
  status: string;

  @ApiProperty({
    example: '2026-07-22T21:35:42.158Z',
    description: 'Current server timestamp.',
  })
  timestamp: string;

  @ApiProperty({
    example: 123.45,
    description: 'Application uptime in seconds.',
  })
  uptime: number;
}
