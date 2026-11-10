import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateIncidentCommentDto {
  @ApiProperty({
    example: 'Lucía Ortega',
    description: 'Author of the comment.',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  authorName: string;

  @ApiProperty({
    example: 'Pedido recambio al proveedor, llega el jueves.',
    description: 'Comment body.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
