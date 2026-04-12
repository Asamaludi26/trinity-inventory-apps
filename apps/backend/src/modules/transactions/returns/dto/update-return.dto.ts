import { IsOptional, IsString } from 'class-validator';

export class UpdateReturnDto {
  @IsOptional()
  @IsString()
  note?: string;
}
