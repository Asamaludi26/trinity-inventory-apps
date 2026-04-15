import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizePhoneNumber } from './whatsapp-templates.constants';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string | undefined;
  private readonly token: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    this.token = this.configService.get<string>('WHATSAPP_TOKEN');
  }

  get isEnabled(): boolean {
    return !!this.apiUrl && !!this.token;
  }

  /**
   * Send a WhatsApp message to a phone number.
   * Uses a generic HTTP POST compatible with Fonnte / WABLAS / custom gateway.
   * No-op (logs warning) when WHATSAPP_API_URL / WHATSAPP_TOKEN are not set.
   * Validates and normalises the phone number before sending.
   */
  async sendMessage(phone: string, message: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(
        `WhatsApp not configured - skipping message to ${phone}`,
      );
      return;
    }

    const normalised = normalizePhoneNumber(phone);
    if (!normalised) {
      this.logger.warn(`Invalid phone number: ${phone} — skipping WhatsApp`);
      return;
    }

    try {
      const response = await fetch(this.apiUrl!, {
        method: 'POST',
        headers: {
          Authorization: this.token!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target: normalised, message }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`WhatsApp send failed [${response.status}]: ${body}`);
      } else {
        this.logger.log(`WhatsApp message sent to ${phone}`);
      }
    } catch (err) {
      this.logger.error(`WhatsApp send error: ${(err as Error).message}`);
    }
  }
}
