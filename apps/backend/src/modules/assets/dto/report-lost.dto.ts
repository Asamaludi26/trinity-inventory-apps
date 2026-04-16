import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class ReportLostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  issueDescription: string;

  @IsDateString()
  @IsOptional()
  lostDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
