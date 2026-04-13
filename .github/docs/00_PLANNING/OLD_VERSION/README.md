# Dokumentasi Versi Lama — Trinity Inventory Apps

> **Tujuan**: Mendokumentasikan alur dan fitur aplikasi versi lama secara rinci untuk membantu analisa
> dan pengembangan pada aplikasi rebuild. Data, logika, dan flow yang valid dari versi lama
> akan menjadi baseline pengembangan fitur baru.

## Daftar Dokumen

| #   | Dokumen                                                                                              | Deskripsi                                                                                |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | [01_PENCATATAN_ASET_STOK.md](./01_PENCATATAN_ASET_STOK.md)                                           | Alur pencatatan aset masuk (registrasi), manajemen stok, stock movement, threshold alert |
| 2   | [02_REQUEST_PINJAM_KEMBALI_HANDOVER.md](./02_REQUEST_PINJAM_KEMBALI_HANDOVER.md)                     | Alur request baru (pengadaan), request pinjam, pengembalian aset, dan handover           |
| 3   | [03_PELANGGAN_INSTALASI_MAINTENANCE_DISMANTLE.md](./03_PELANGGAN_INSTALASI_MAINTENANCE_DISMANTLE.md) | Daftar pelanggan, manajemen instalasi, maintenance, dan data dismantle                   |
| 4   | [04_AKUN_DIVISI_KATEGORI_PEMBELIAN.md](./04_AKUN_DIVISI_KATEGORI_PEMBELIAN.md)                       | Kelola akun, akun & divisi, kategori model, dan data pembelian master                    |
| 5   | [05_LOGIN_AUTH.md](./05_LOGIN_AUTH.md)                                                               | Alur login, autentikasi, token management, force change password                         |
| 6   | [06_SIDEBAR_MINIMIZE_DROPDOWN.md](./06_SIDEBAR_MINIMIZE_DROPDOWN.md)                                 | Design sidebar minimize dengan flyout dropdown panel                                     |

## Tech Stack (Versi Lama)

| Layer        | Teknologi                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite, TanStack, Zustand, react-hook-form, shadcn/ui |
| Backend      | NestJS 11, TypeScript, Prisma 7, JWT, bcrypt                              |
| Database     | PostgreSQL                                                                |
| Real-time    | SSE (primary) + Polling (fallback)                                        |
| Notification | WhatsApp API + In-app bell notification                                   |

## Arsitektur Umum

```
Frontend (React SPA)
    ↕ REST API (JWT Auth)
Backend (NestJS)
    ↕ Prisma ORM
PostgreSQL Database
    ↕ SSE Events
Real-time Sync
```

## Catatan untuk Rebuild

- Semua ID format menggunakan prefix + tanggal: `REG-YYYY-MM-XXXX`, `RO-YYYY-MMDD-XXXX`, dll.
- Optimistic Concurrency Control (OCC) via `version` field pada entitas utama
- RBAC berbasis permission string array pada User model
- Activity logging untuk setiap operasi penting
- Notifikasi WhatsApp fire-and-forget (non-blocking)
