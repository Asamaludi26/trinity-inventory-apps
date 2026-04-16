import { IsInt, Min, IsString, IsOptional, MaxLength } from 'class-validator';

export class RestockDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  source?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
