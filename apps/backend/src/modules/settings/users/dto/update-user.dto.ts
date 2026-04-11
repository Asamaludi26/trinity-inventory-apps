import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
    },
  )
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
