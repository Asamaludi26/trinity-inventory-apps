import { Controller, Get, Param, Res, Body, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { QrCodeService } from './qrcode.service';
import { SkipAudit } from '../../common/decorators';

@ApiTags('QR Code')
@ApiBearerAuth('access-token')
@Controller('qrcode')
@SkipAudit()
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Get('assets/:id')
  @ApiOperation({ summary: 'Generate QR code image untuk aset' })
  @ApiResponse({ status: 200, description: 'QR code PNG image' })
  async getQrImage(@Param('id') id: string, @Res() res: Response) {
    const { buffer, contentType, filename } =
      await this.qrCodeService.generateQrForAsset(id);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('assets/:id/data-url')
  @ApiOperation({ summary: 'Generate QR code data URL untuk aset' })
  @ApiResponse({ status: 200, description: 'QR code data URL string' })
  async getQrDataUrl(@Param('id') id: string) {
    const dataUrl = await this.qrCodeService.generateQrDataUrl(id);
    return { dataUrl };
  }

  @Post('assets/batch')
  @ApiOperation({ summary: 'Generate QR codes untuk beberapa aset sekaligus' })
  @ApiResponse({ status: 200, description: 'Array QR codes' })
  async getBatchQr(@Body() body: { assetIds: string[] }) {
    return this.qrCodeService.generateBatchQr(body.assetIds);
  }

  @Get('barcode/assets/:id')
  @ApiOperation({ summary: 'Generate barcode Code 128 image untuk aset' })
  @ApiResponse({ status: 200, description: 'Barcode PNG image' })
  async getBarcodeImage(@Param('id') id: string, @Res() res: Response) {
    const { buffer, contentType, filename } =
      await this.qrCodeService.generateBarcodeForAsset(id);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('barcode/assets/:id/data-url')
  @ApiOperation({ summary: 'Generate barcode Code 128 data URL untuk aset' })
  @ApiResponse({ status: 200, description: 'Barcode data URL string' })
  async getBarcodeDataUrl(@Param('id') id: string) {
    const dataUrl = await this.qrCodeService.generateBarcodeDataUrl(id);
    return { dataUrl };
  }

  @Post('barcode/assets/batch')
  @ApiOperation({ summary: 'Generate barcodes Code 128 untuk beberapa aset' })
  @ApiResponse({ status: 200, description: 'Array barcodes' })
  async getBatchBarcode(@Body() body: { assetIds: string[] }) {
    return this.qrCodeService.generateBatchBarcode(body.assetIds);
  }
}
