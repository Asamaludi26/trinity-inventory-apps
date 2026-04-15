# UAT Readiness Checklist

| Metadata      | Detail                                         |
| ------------- | ---------------------------------------------- |
| **Versi**     | 1.0                                            |
| **Tanggal**   | 15 April 2026                                  |
| **Author**    | Trinity AI Orchestrator                        |
| **Referensi** | TEST_PLAN_AND_UAT.md, SPRINT_REBUILD_MASTER.md |
| **Status**    | ACTIVE                                         |
| **Target**    | Minggu 2 Mei 2026 (12-18 Mei)                  |

---

## 1. Pre-UAT Environment Checklist

### 1.1 Infrastructure

| #   | Item                                  | Status | Verifikasi                               |
| --- | ------------------------------------- | :----: | ---------------------------------------- |
| 1   | Docker Compose running (all services) |   ☐    | `docker compose up -d` → all healthy     |
| 2   | PostgreSQL accessible                 |   ☐    | `psql` connection test                   |
| 3   | Backend API healthy                   |   ☐    | `GET /api/health` → 200                  |
| 4   | Frontend accessible                   |   ☐    | `http://localhost:5173` loads correctly  |
| 5   | Nginx reverse proxy working           |   ☐    | Production URL accessible                |
| 6   | .env files configured                 |   ☐    | JWT*SECRET, DB_URL, WHATSAPP*\* (if any) |
| 7   | File upload directory writable        |   ☐    | `uploads/` has correct permissions       |

### 1.2 Database

| #   | Item                             | Status | Verifikasi                             |
| --- | -------------------------------- | :----: | -------------------------------------- |
| 8   | Migrations applied               |   ☐    | `pnpm prisma migrate deploy` → success |
| 9   | Seed data loaded                 |   ☐    | `pnpm prisma db seed` → 16 users       |
| 10  | UAT test accounts accessible     |   ☐    | Login with each account (see §2)       |
| 11  | Sample data available (optional) |   ☐    | Categories, types, models seeded       |

---

## 2. UAT Test Accounts

| Role           | Email               | Password         | Divisi    |
| -------------- | ------------------- | ---------------- | --------- |
| SUPER_ADMIN    | superadmin@test.com | TestPassword123! | —         |
| ADMIN_LOGISTIK | logistik@test.com   | TestPassword123! | Gudang    |
| ADMIN_PURCHASE | purchase@test.com   | TestPassword123! | Pengadaan |
| LEADER         | leader@test.com     | TestPassword123! | Teknik    |
| STAFF          | staff1@test.com     | TestPassword123! | Teknik    |
| STAFF          | staff2@test.com     | TestPassword123! | Gudang    |

> **Catatan**: Semua UAT accounts memiliki `mustChangePassword: false` agar bisa langsung dipakai.

---

## 3. Functional UAT Test Scenarios

### 3.1 Sprint 0: Authentication & Authorization

| #   | Skenario                       | Aktor      | Langkah                            | Expected Result                        | Status |
| --- | ------------------------------ | ---------- | ---------------------------------- | -------------------------------------- | :----: |
| T01 | Login valid                    | Semua role | Login dengan akun UAT              | Dashboard sesuai role                  |   ☐    |
| T02 | Login invalid (password salah) | Semua role | Login dengan password salah 3x     | Pesan error, lockout setelah 5x        |   ☐    |
| T03 | Akses halaman terlarang        | STAFF      | Navigasi ke /settings/users        | Redirect / 403 Forbidden               |   ☐    |
| T04 | Logout                         | Semua role | Klik logout                        | Redirect ke /login, token cleared      |   ☐    |
| T05 | Token refresh                  | Semua role | Biarkan idle > 15 menit, lalu aksi | Auto-refresh token, tidak logout paksa |   ☐    |

### 3.2 Sprint 1: Master Data (Aset, Stok, Pembelian)

| #   | Skenario                     | Aktor          | Langkah                                                 | Expected Result                          | Status |
| --- | ---------------------------- | -------------- | ------------------------------------------------------- | ---------------------------------------- | :----: |
| T06 | Buat Kategori → Tipe → Model | ADMIN_LOGISTIK | Menu Aset → Kategori & Model → Tab Kategori → Tambah    | Data terbuat dengan hierarchi benar      |   ☐    |
| T07 | Buat Aset Individual         | ADMIN_LOGISTIK | Menu Aset → Tambah Aset → Pilih INDIVIDUAL              | Aset terbuat dengan ID auto (AS-YYYY-\*) |   ☐    |
| T08 | Buat Aset Bulk               | ADMIN_LOGISTIK | Menu Aset → Tambah Aset → Pilih BULK → qty: 10          | 10 aset terbuat                          |   ☐    |
| T09 | Lihat Stok per Gudang        | ADMIN_LOGISTIK | Menu Stok → Tab Gudang                                  | Stok akurat per gudang                   |   ☐    |
| T10 | Threshold alert muncul       | ADMIN_LOGISTIK | Set threshold rendah → kurangi stok                     | Alert muncul di dashboard                |   ☐    |
| T11 | Import aset via Excel        | ADMIN_LOGISTIK | Menu Aset → Import → Upload file → Preview → Konfirmasi | Aset terimport, error ditampilkan        |   ☐    |
| T12 | Export aset ke Excel         | ADMIN_LOGISTIK | Menu Aset → Export                                      | File Excel terdownload                   |   ☐    |
| T13 | Scan QR code aset            | ADMIN_LOGISTIK | Menu Aset → Scan QR → Arahkan kamera                    | Navigate ke detail aset                  |   ☐    |
| T14 | Catat Pembelian              | ADMIN_PURCHASE | Menu Pembelian → Tambah                                 | Data pembelian tersimpan                 |   ☐    |
| T15 | Hitung Depresiasi            | ADMIN_PURCHASE | Menu Depresiasi → Pilih aset                            | Nilai depresiasi terhitung               |   ☐    |

### 3.3 Sprint 2: Transaksi (Approval Engine)

| #   | Skenario                                | Aktor                  | Langkah                                                        | Expected Result                               | Status |
| --- | --------------------------------------- | ---------------------- | -------------------------------------------------------------- | --------------------------------------------- | :----: |
| T16 | Buat Request Pengadaan multi-item       | STAFF                  | Menu Transaksi → Request → Tambah → 3 item                     | Request terbuat, status PENDING               |   ☐    |
| T17 | Approve Request (chain: Leader → Admin) | LEADER, ADMIN_LOGISTIK | Login Leader → Approve → Login Admin → Approve                 | Status berubah per-step, notifikasi terkirim  |   ☐    |
| T18 | Reject Request dengan alasan            | LEADER                 | Detail Request → Tolak → Isi alasan                            | Status REJECTED, alasan tersimpan             |   ☐    |
| T19 | Buat Peminjaman (Loan)                  | STAFF                  | Menu Transaksi → Peminjaman → Tambah                           | Loan terbuat, status PENDING                  |   ☐    |
| T20 | Approve Loan + Assign Aset              | ADMIN_LOGISTIK         | Detail Loan → Approve → Pilih aset → Assign                    | Aset ter-assign, status IN_USE                |   ☐    |
| T21 | Return aset dari Loan                   | STAFF                  | Menu Transaksi → Pengembalian → Pilih Loan aktif → Isi kondisi | Return terbuat, aset kembali ke IN_STORAGE    |   ☐    |
| T22 | Handover aset antar user                | ADMIN_LOGISTIK         | Menu Transaksi → Serah Terima → From/To/Witness                | Ownership berpindah                           |   ☐    |
| T23 | Lapor Aset Rusak (Repair)               | STAFF                  | Menu Transaksi → Perbaikan → Lapor Kerusakan                   | Repair terbuat, aset UNDER_REPAIR             |   ☐    |
| T24 | Lapor Aset Hilang (Lost)                | STAFF                  | Detail Aset → Lapor Hilang                                     | Status LOST, notifikasi ke Leader             |   ☐    |
| T25 | Overdue loan detection                  | (Otomatis)             | Buat loan dgn due date lampau → tunggu cron                    | Indikator overdue muncul, notifikasi terkirim |   ☐    |

### 3.4 Sprint 3: Pelanggan & Proyek

| #   | Skenario                          | Aktor          | Langkah                                              | Expected Result                                                    | Status |
| --- | --------------------------------- | -------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | :----: |
| T26 | Buat Pelanggan                    | ADMIN_LOGISTIK | Menu Pelanggan → Tambah                              | Customer terbuat, kode auto-generate                               |   ☐    |
| T27 | Instalasi ke Pelanggan + material | ADMIN_LOGISTIK | Detail Pelanggan → Instalasi → Pilih aset + material | Aset terpasang, stok berkurang (FIFO)                              |   ☐    |
| T28 | Maintenance + replacement         | ADMIN_LOGISTIK | Detail Pelanggan → Maintenance → Ganti aset          | Aset lama dikembalikan, baru terpasang                             |   ☐    |
| T29 | Dismantle (cabut pemasangan)      | ADMIN_LOGISTIK | Detail Pelanggan → Dismantle → Pilih aset            | Aset kembali ke gudang, pelanggan jadi INACTIVE jika semua dicabut |   ☐    |
| T30 | Buat Proyek Infrastruktur         | LEADER         | Menu Proyek → Tambah → Isi detail + team             | Proyek terbuat dengan task management                              |   ☐    |

### 3.5 Sprint 4: Dashboard & Cross-Cutting

| #   | Skenario                    | Aktor          | Langkah                                  | Expected Result                               | Status |
| --- | --------------------------- | -------------- | ---------------------------------------- | --------------------------------------------- | :----: |
| T31 | Dashboard Super Admin       | SUPER_ADMIN    | Login → Dashboard                        | Stats, chart trend, pie kategori, aktivitas   |   ☐    |
| T32 | Dashboard Finance           | ADMIN_PURCHASE | Login → Dashboard                        | Stats keuangan, chart pengeluaran, aktivitas  |   ☐    |
| T33 | Dashboard Operations        | ADMIN_LOGISTIK | Login → Dashboard                        | Stats ops, stock alerts, daily ops summary    |   ☐    |
| T34 | Dashboard Division          | LEADER         | Login → Dashboard                        | Stats divisi, member list, aktivitas divisi   |   ☐    |
| T35 | Dashboard Personal          | STAFF          | Login → Dashboard                        | My assets, my loans, pending returns          |   ☐    |
| T36 | Time filter on dashboard    | Semua role     | Ubah filter ke 7 hari / 30 hari / kustom | Data berubah sesuai rentang waktu             |   ☐    |
| T37 | Notifikasi in-app           | Semua role     | Lakukan aksi CUD → cek bell icon         | Notifikasi muncul, bisa ditandai telah dibaca |   ☐    |
| T38 | QR Code generate + download | ADMIN_LOGISTIK | Detail Aset → QR Code → Download         | QR Code tersimpan sebagai PNG                 |   ☐    |

---

## 4. Non-Functional UAT Checklist

### 4.1 Performance

| #   | Item                              | Criteria                      | Status |
| --- | --------------------------------- | ----------------------------- | :----: |
| P01 | Page load time                    | < 3 detik (first load)        |   ☐    |
| P02 | API response time                 | < 500ms (95th percentile)     |   ☐    |
| P03 | List page with 1000+ items        | Renders + paginate < 2 detik  |   ☐    |
| P04 | Concurrent users (5 simultaneous) | No errors, no data corruption |   ☐    |

### 4.2 Security

| #   | Item                | Criteria                       | Status |
| --- | ------------------- | ------------------------------ | :----: |
| S01 | SQL Injection test  | Parameterized queries (Prisma) |   ☐    |
| S02 | XSS test            | Input sanitized, CSP headers   |   ☐    |
| S03 | CSRF protection     | JWT + SameSite cookies         |   ☐    |
| S04 | Rate limiting       | Login max 5/min, API 100/min   |   ☐    |
| S05 | Unauthorized access | All endpoints require JWT      |   ☐    |
| S06 | Role escalation     | Cannot access other role data  |   ☐    |

### 4.3 Usability & Accessibility

| #   | Item                       | Criteria                      | Status |
| --- | -------------------------- | ----------------------------- | :----: |
| U01 | Responsive mobile (≥375px) | Layout tidak pecah            |   ☐    |
| U02 | Dark/Light theme toggle    | Semua komponen konsisten      |   ☐    |
| U03 | Keyboard navigation        | Tab, Enter, Escape berfungsi  |   ☐    |
| U04 | Form validation messages   | Bahasa Indonesia, jelas       |   ☐    |
| U05 | Loading states             | Skeleton/spinner saat loading |   ☐    |
| U06 | Error states               | Pesan error user-friendly     |   ☐    |
| U07 | Empty states               | Pesan "belum ada data"        |   ☐    |

---

## 5. UAT Sign-Off Criteria

### 5.1 Pass Criteria

- [ ] **100% P0 test cases passed** (T01-T25: Auth + Master Data + Transactions)
- [ ] **≥90% P1 test cases passed** (T26-T38: Customers + Dashboard + Cross-cutting)
- [ ] **0 blocker / critical bugs** open
- [ ] **≤3 major bugs** open (with workaround documented)
- [ ] **Performance criteria met** (P01-P04)
- [ ] **Security checklist passed** (S01-S06)

### 5.2 Fail Criteria (blocked)

- Any P0 test case fails
- Critical security vulnerability found
- Data corruption or loss detected
- System crash under normal usage

---

## 6. Bug Severity Classification

| Severity     | Definisi                                       | SLA      |
| ------------ | ---------------------------------------------- | -------- |
| **Blocker**  | Sistem tidak bisa dipakai, data hilang/corrupt | 4 jam    |
| **Critical** | Fitur utama gagal, tidak ada workaround        | 1 hari   |
| **Major**    | Fitur gagal, ada workaround manual             | 3 hari   |
| **Minor**    | UI issue, performance lambat (non-blocking)    | 1 minggu |
| **Cosmetic** | Typo, alignment, warna tidak sesuai            | Backlog  |

---

## 7. UAT Timeline

| Phase                  | Tanggal        | Durasi | Aktivitas                              |
| ---------------------- | -------------- | ------ | -------------------------------------- |
| **Preparation**        | 5-9 Mei 2026   | 5 hari | Environment setup, seed data, briefing |
| **UAT Execution**      | 12-16 Mei 2026 | 5 hari | Execute test scenarios, log bugs       |
| **Bug Fix Sprint**     | 19-23 Mei 2026 | 5 hari | Fix blocker/critical/major bugs        |
| **Re-test & Sign-off** | 26-27 Mei 2026 | 2 hari | Re-verify fixes, final sign-off        |

---

## 8. Quality Gate Commands

```bash
# Backend quality gate
pnpm --filter ./apps/backend/ lint
pnpm --filter ./apps/backend/ typecheck

# Frontend quality gate
pnpm --filter ./apps/frontend/ lint
pnpm --filter ./apps/frontend/ typecheck

# Run backend tests
pnpm --filter backend test

# Run E2E tests
pnpm --filter backend test:e2e
```

> **Warning = Error.** Semua harus resolved sebelum UAT dimulai.
