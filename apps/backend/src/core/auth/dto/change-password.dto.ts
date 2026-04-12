import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Password saat ini wajib diisi' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message:
      'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirmPassword: string;
}
