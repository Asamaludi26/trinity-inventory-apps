import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as QRCode from 'qrcode';
import * as bwipjs from 'bwip-js';

@Injectable()
export class QrCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generateQrForAsset(
    assetId: string,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, isDeleted: false },
      select: { id: true, code: true, name: true },
    });

    if (!asset) {
      throw new NotFoundException('Aset tidak ditemukan');
    }

    // QR content: JSON with asset identification
    const qrContent = JSON.stringify({
      id: asset.id,
      code: asset.code,
      name: asset.name,
      type: 'ASSET',
    });

    const buffer = await QRCode.toBuffer(qrContent, {
      type: 'png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1F2937', light: '#FFFFFF' },
    });

    return {
      buffer: Buffer.from(buffer),
      contentType: 'image/png',
      filename: `qr_${asset.code}.png`,
    };
  }

  async generateQrDataUrl(assetId: string): Promise<string> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, isDeleted: false },
      select: { id: true, code: true, name: true },
    });

    if (!asset) {
      throw new NotFoundException('Aset tidak ditemukan');
    }

    const qrContent = JSON.stringify({
      id: asset.id,
      code: asset.code,
      name: asset.name,
      type: 'ASSET',
    });

    return QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1F2937', light: '#FFFFFF' },
    });
  }

  async generateBatchQr(
    assetIds: string[],
  ): Promise<Array<{ assetId: string; code: string; dataUrl: string }>> {
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds }, isDeleted: false },
      select: { id: true, code: true, name: true },
    });

    const results = await Promise.all(
      assets.map(async (asset) => {
        const qrContent = JSON.stringify({
          id: asset.id,
          code: asset.code,
          name: asset.name,
          type: 'ASSET',
        });

        const dataUrl = await QRCode.toDataURL(qrContent, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#1F2937', light: '#FFFFFF' },
        });

        return { assetId: asset.id, code: asset.code, dataUrl };
      }),
    );

    return results;
  }

  /**
   * Generate Code 128 barcode PNG buffer for an asset
   */
  async generateBarcodeForAsset(
    assetId: string,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, isDeleted: false },
      select: { id: true, code: true, name: true },
    });

    if (!asset) {
      throw new NotFoundException('Aset tidak ditemukan');
    }

    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: asset.code,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
    });

    return {
      buffer: Buffer.from(buffer),
      contentType: 'image/png',
      filename: `barcode_${asset.code}.png`,
    };
  }

  /**
   * Generate Code 128 barcode as data URL string
   */
  async generateBarcodeDataUrl(assetId: string): Promise<string> {
    const { buffer } = await this.generateBarcodeForAsset(assetId);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Generate barcodes for multiple assets at once
   */
  async generateBatchBarcode(
    assetIds: string[],
  ): Promise<Array<{ assetId: string; code: string; dataUrl: string }>> {
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds }, isDeleted: false },
      select: { id: true, code: true, name: true },
    });

    const results = await Promise.all(
      assets.map(async (asset) => {
        const buffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: asset.code,
          scale: 3,
          height: 12,
          includetext: true,
          textxalign: 'center',
        });

        const dataUrl = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
        return { assetId: asset.id, code: asset.code, dataUrl };
      }),
    );

    return results;
  }
}
