import {
  Controller,
  Post,
  Get,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ImportService } from './import.service';
import {
  AuthPermissions,
  CurrentUser,
  SkipAudit,
} from '../../common/decorators';
import { PERMISSIONS } from '../../common/constants';

const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('Import')
@ApiBearerAuth('access-token')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('assets')
  @AuthPermissions(PERMISSIONS.DATA_IMPORT)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Import aset dari file Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Import berhasil' })
  async importAssets(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: number,
  ) {
    return this.importService.importAssets(file, userId);
  }

  @Post('assets/preview')
  @AuthPermissions(PERMISSIONS.DATA_IMPORT)
  @SkipAudit()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Preview import aset — validasi tanpa menyimpan ke DB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Preview berhasil' })
  async previewImportAssets(@UploadedFile() file: Express.Multer.File) {
    return this.importService.previewAssets(file);
  }

  @Get('assets/template')
  @AuthPermissions(PERMISSIONS.DATA_IMPORT)
  @SkipAudit()
  @ApiOperation({ summary: 'Download template import aset' })
  @ApiResponse({ status: 200, description: 'Template berhasil diunduh' })
  async getTemplate(@Res() res: Response) {
    const { buffer, contentType, filename } =
      await this.importService.getImportTemplate();

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
