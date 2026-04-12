import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadQueryDto {
  @ApiProperty({ description: 'Tipe entitas (e.g. Request, Loan, Asset)' })
  @IsNotEmpty({ message: 'entityType wajib diisi' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'ID entitas' })
  @IsNotEmpty({ message: 'entityId wajib diisi' })
  @IsString()
  entityId: string;
}

export class DeleteAttachmentQueryDto {
  @ApiPropertyOptional({ description: 'Nama file untuk validasi' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
