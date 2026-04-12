import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../core/database/prisma.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_ENTITY_TYPES = [
  'Request',
  'LoanRequest',
  'AssetReturn',
  'Handover',
  'Repair',
  'InfraProject',
  'Asset',
  'Installation',
  'Maintenance',
  'Dismantle',
  'Customer',
];

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findByEntity(entityType: string, entityId: string) {
    this.validateEntityType(entityType);

    const attachments = await this.prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });

    return { data: attachments };
  }

  async upload(
    files: Express.Multer.File[],
    entityType: string,
    entityId: string,
    userId: number,
  ) {
    this.validateEntityType(entityType);

    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal 1 file harus diupload');
    }

    // Validate each file
    for (const file of files) {
      this.validateFile(file);
    }

    const savedFiles: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }> = [];

    for (const file of files) {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${this.sanitizeFileName(file.originalname)}`;
      const entityDir = path.join(
        this.uploadDir,
        entityType.toLowerCase(),
        entityId,
      );

      if (!fs.existsSync(entityDir)) {
        fs.mkdirSync(entityDir, { recursive: true });
      }

      const filePath = path.join(entityDir, uniqueName);
      fs.writeFileSync(filePath, file.buffer);

      savedFiles.push({
        fileName: file.originalname,
        fileUrl: `/uploads/${entityType.toLowerCase()}/${entityId}/${uniqueName}`,
        fileType: file.mimetype,
        fileSize: file.size,
      });
    }

    // Batch create in DB
    const attachments = await this.prisma.$transaction(
      savedFiles.map((f) =>
        this.prisma.attachment.create({
          data: {
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            fileType: f.fileType,
            fileSize: f.fileSize,
            entityType,
            entityId,
            uploadedById: userId,
          },
          include: {
            uploadedBy: { select: { id: true, fullName: true } },
          },
        }),
      ),
    );

    this.logger.log(
      `Uploaded ${files.length} file(s) for ${entityType}:${entityId} by user ${userId}`,
    );

    return { data: attachments };
  }

  async remove(id: number, userId: number, userRole: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment tidak ditemukan');
    }

    // Only SUPERADMIN, ADMIN_LOGISTIK, or the uploader can delete
    const canDelete =
      ['SUPERADMIN', 'ADMIN_LOGISTIK'].includes(userRole) ||
      attachment.uploadedById === userId;

    if (!canDelete) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk menghapus attachment ini',
      );
    }

    // Delete physical file
    const fullPath = path.join(process.cwd(), attachment.fileUrl);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete DB record
    await this.prisma.attachment.delete({ where: { id } });

    this.logger.log(
      `Deleted attachment ${id} (${attachment.fileName}) by user ${userId}`,
    );

    return { message: 'Attachment berhasil dihapus' };
  }

  private validateEntityType(entityType: string) {
    if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
      throw new BadRequestException(
        `entityType tidak valid. Gunakan salah satu: ${ALLOWED_ENTITY_TYPES.join(', ')}`,
      );
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File "${file.originalname}" melebihi batas 10MB`,
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe file "${file.originalname}" tidak diizinkan. Tipe yang diizinkan: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, CSV`,
      );
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100);
  }
}
