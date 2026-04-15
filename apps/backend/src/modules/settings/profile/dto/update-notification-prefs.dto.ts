import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationChannelsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  stock?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requests?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  loans?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  returns?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  handovers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  repairs?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  projects?: boolean;
}

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @ApiPropertyOptional({ type: NotificationChannelsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  channels?: NotificationChannelsDto;
}
