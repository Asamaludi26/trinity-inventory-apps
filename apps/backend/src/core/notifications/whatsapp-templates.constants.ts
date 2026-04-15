/**
 * WhatsApp message templates — Bahasa Indonesia.
 * Used by NotificationService to send formatted WhatsApp messages.
 */

export const WA_TEMPLATES = {
  /** Transaction status change */
  TRANSACTION_STATUS: (type: string, code: string, status: string) =>
    `*[Trinity Inventory]*\n\n` +
    `📋 ${type} *${code}* telah berubah status menjadi *${status}*.\n\n` +
    `Silakan cek aplikasi untuk detail lebih lanjut.`,

  /** Approval required */
  APPROVAL_REQUIRED: (type: string, code: string, requester: string) =>
    `*[Trinity Inventory]*\n\n` +
    `🔔 Persetujuan Diperlukan\n` +
    `${type} *${code}* dari *${requester}* menunggu persetujuan Anda.\n\n` +
    `Silakan login untuk menyetujui atau menolak.`,

  /** Stock alert */
  STOCK_ALERT: (
    modelName: string,
    currentStock: number,
    threshold: number,
    severity: string,
  ) =>
    `*[Trinity Inventory]*\n\n` +
    `⚠️ Peringatan Stok ${severity}\n` +
    `Stok *${modelName}* saat ini: *${currentStock}* unit (threshold: ${threshold}).\n\n` +
    `Segera lakukan pengadaan.`,

  /** Loan overdue */
  LOAN_OVERDUE: (loanCode: string, assetName: string, daysOverdue: number) =>
    `*[Trinity Inventory]*\n\n` +
    `🔴 Pinjaman Jatuh Tempo\n` +
    `Pinjaman *${loanCode}* (${assetName}) sudah terlambat *${daysOverdue} hari*.\n\n` +
    `Segera kembalikan aset tersebut.`,

  /** Loan overdue (leader/manager notification) */
  LOAN_OVERDUE_LEADER: (
    loanCode: string,
    assetName: string,
    daysOverdue: number,
  ) =>
    `*[Trinity Inventory]*\n\n` +
    `🔴 Pinjaman Anggota Jatuh Tempo\n` +
    `Pinjaman *${loanCode}* (${assetName}) oleh anggota divisi sudah terlambat *${daysOverdue} hari*.\n\n` +
    `Mohon ditindaklanjuti.`,

  /** Generic notification */
  GENERIC: (title: string, message: string) =>
    `*[Trinity Inventory]*\n\n` + `*${title}*\n${message}`,
} as const;

/**
 * Validate and normalise an Indonesian phone number.
 * Returns the normalised number (62xxx) or null if invalid.
 *
 * Accepted formats:
 * - 08xx → 628xx
 * - +628xx → 628xx
 * - 628xx → 628xx
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;

  // Strip spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Must be numeric (after optional leading +)
  if (!/^\+?\d{9,15}$/.test(cleaned)) return null;

  let normalised = cleaned;

  // Remove leading +
  if (normalised.startsWith('+')) {
    normalised = normalised.slice(1);
  }

  // Convert leading 0 to 62
  if (normalised.startsWith('0')) {
    normalised = '62' + normalised.slice(1);
  }

  // Must start with 62
  if (!normalised.startsWith('62')) return null;

  // Indonesian mobile numbers: 62 + 8-13 digits
  if (normalised.length < 10 || normalised.length > 15) return null;

  return normalised;
}
