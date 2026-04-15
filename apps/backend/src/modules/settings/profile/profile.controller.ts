import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, UpdateNotificationPrefsDto } from './dto';
import { CurrentUser } from '../../../common/decorators';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@Controller('settings/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil profil' })
  async getProfile(@CurrentUser('sub') userId: number) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Berhasil mengupdate profil' })
  async updateProfile(
    @CurrentUser('sub') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload avatar photo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Berhasil mengupload avatar' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = path.resolve('./uploads/avatar');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(
            null,
            `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
          );
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Hanya file JPG, PNG, atau WebP yang diizinkan',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('sub') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File avatar wajib dikirim');
    return this.profileService.uploadAvatar(userId, file.filename);
  }

  @Get('notification-prefs')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil preferensi notifikasi',
  })
  async getNotificationPrefs(@CurrentUser('sub') userId: number) {
    return this.profileService.getNotificationPrefs(userId);
  }

  @Patch('notification-prefs')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengupdate preferensi notifikasi',
  })
  async updateNotificationPrefs(
    @CurrentUser('sub') userId: number,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.profileService.updateNotificationPrefs(userId, dto);
  }
}
