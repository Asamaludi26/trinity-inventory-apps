import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsString, ArrayMinSize } from 'class-validator';

export class AssignAssetsDto {
  @ApiProperty({ description: 'Version untuk optimistic locking' })
  @IsInt()
  version: number;

  @ApiProperty({
    description: 'Daftar asset ID yang akan di-assign ke peminjaman',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  assetIds: string[];
}
