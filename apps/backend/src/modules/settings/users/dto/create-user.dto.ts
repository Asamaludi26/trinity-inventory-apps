import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../../../generated/prisma/client';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Employee ID wajib diisi' })
  @IsString()
  @MaxLength(20)
  employeeId: string;

  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  @IsString()
  @MaxLength(255)
  fullName: string;

  @IsNotEmpty({ message: 'Email wajib diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(255)
  email: string;

  @IsNotEmpty({ message: 'Password wajib diisi' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
    },
  )
  password: string;

  @IsNotEmpty({ message: 'Role wajib diisi' })
  @IsEnum(UserRole, { message: 'Role tidak valid' })
  role: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
