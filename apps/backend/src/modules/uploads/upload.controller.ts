import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadQueryDto } from './dto';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get()
  @ApiOperation({ summary: 'List attachments berdasarkan entity' })
  async findByEntity(@Query() query: UploadQueryDto) {
    return this.uploadService.findByEntity(query.entityType, query.entityId);
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Upload file attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Query() query: UploadQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.upload(
      files,
      query.entityType,
      query.entityId,
      user.sub,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus attachment' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.remove(id, user.sub, user.role);
  }
}
