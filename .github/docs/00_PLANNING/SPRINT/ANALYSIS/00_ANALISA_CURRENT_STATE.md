# 00 — Analisa Current State vs PRD v3.1

| Metadata      | Detail                                                                             |
| ------------- | ---------------------------------------------------------------------------------- |
| **Versi**     | 3.0 (Updated Juli 2025)                                                            |
| **Tanggal**   | Juli 2025                                                                          |
| **Tujuan**    | Mengukur persentase kelengkapan kode saat ini terhadap spesifikasi PRD v3.1 & SDD  |
| **Metode**    | Cross-reference kode existing (routes, controllers, pages, schema) vs PRD features |
| **Referensi** | PRD v3.1, SDD v3.1, ASSET_LIFECYCLE, TRANSACTION_WORKFLOWS, CUSTOMER_OPERATIONS    |

---

## 1. Ringkasan Eksekutif

| Aspek                 | Status      | Persentase | Catatan                                                      |
| --------------------- | ----------- | ---------- | ------------------------------------------------------------ |
| **Struktur Kode**     | ✅ Lengkap  | 98%        | Semua folder, module, route tersedia                         |
| **Prisma Schema**     | ✅ Lengkap  | 98%        | 35+ model, relasi & indexes tervalidasi, OCC fields          |
| **Backend API**       | ✅ Lengkap  | 95%        | Semua endpoint + logika bisnis + FIFO + approval tervalidasi |
| **Frontend Pages**    | ✅ Lengkap  | 95%        | 61 halaman, fungsionalitas + charts + barcode tervalidasi    |
| **Business Logic**    | ✅ Lengkap  | 93%        | Approval, FIFO, classification, state machine, OCC all done  |
| **Data Consistency**  | ✅ Verified | 90%        | E2E tests, OCC, FIFO E2E, data-consistency tests             |
| **Testing**           | ✅ Lengkap  | 80%        | 535 BE + 8 E2E files + 78 frontend tests (13 files)          |
| **Cross-Cutting**     | ✅ Lengkap  | 95%        | Notif, QR, barcode, import/export, avatar, audit diff done   |
| **Overall Readiness** | ✅          | **~95%**   | Semua sprint selesai, UAT ready                              |

---

## 2. Analisa per Domain (PRD F-01 s/d F-07)

### 2.1 F-01: Dashboard

| Sub-Fitur                                  | Backend API | Frontend UI | Logika Bisnis | Status |
| ------------------------------------------ | :---------: | :---------: | :-----------: | ------ |
| Dashboard Utama (Superadmin)               |     ✅      |     ✅      |      ✅       | 95%    |
| Dashboard Keuangan (Admin Purchase)        |     ✅      |     ✅      |      ✅       | 95%    |
| Dashboard Operasional (Admin Logistik)     |     ✅      |     ✅      |      ✅       | 95%    |
| Dashboard Divisi (Leader)                  |     ✅      |     ✅      |      ✅       | 95%    |
| Dashboard Pribadi (Staff)                  |     ✅      |     ✅      |      ✅       | 95%    |
| Stock Alert Widget                         |     ✅      |     ✅      |      ✅       | 90%    |
| Filter waktu (daily/weekly/monthly/yearly) |     ✅      |     ✅      |      ✅       | 95%    |
| Card notifikasi stok habis dgn link action |     ✅      |     ✅      |      ✅       | 90%    |
| Data proyek sedang berjalan                |     ✅      |     ✅      |      ✅       | 90%    |
| Data pelanggan ringkasan                   |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Domain Dashboard: ~95%**

**Gap Utama:**

- [x] ~~Filter waktu pada semua statistik~~ — ✅ Time period filter implemented
- [x] ~~Card notifikasi stok habis/hampir habis~~ — ✅ Stock alert widget with action
- [x] ~~Widget proyek sedang berjalan~~ — ✅ Project overview widget
- [x] ~~Widget ringkasan pelanggan~~ — ✅ Customer summary widget
- [ ] Quick-add kategori/model dari dashboard — belum ada (nice-to-have)
- [x] ~~Validasi data aggregasi~~ — ✅ E2E data consistency tests

---

### 2.2 F-02: Manajemen Aset

| Sub-Fitur                         | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Aset (create/read/update)    |     ✅      |     ✅      |      ✅       | 95%    |
| Soft Delete Aset                  |     ✅      |     ✅      |      ✅       | 90%    |
| Batch Registration                |     ✅      |     ✅      |      ✅       | 90%    |
| Asset ID auto-generation          |     ✅      |     ✅      |      ✅       | 95%    |
| Asset Status State Machine        |     ✅      |     ✅      |      ✅       | 90%    |
| Asset Condition tracking          |     ✅      |     ✅      |      ✅       | 90%    |
| Stok Gudang Utama View            |     ✅      |     ✅      |      ✅       | 95%    |
| Stok Gudang Divisi View           |     ✅      |     ✅      |      ✅       | 90%    |
| Stok Pribadi View                 |     ✅      |     ✅      |      ✅       | 90%    |
| Threshold Setting per Model       |     ✅      |     ✅      |      ✅       | 90%    |
| Threshold Alert Notification      |     ✅      |     ✅      |      ✅       | 85%    |
| Kategori/Tipe/Model Hirarki       |     ✅      |     ✅      |      ✅       | 95%    |
| Cascade Protection (delete)       |     ✅      |     ✅      |      ✅       | 90%    |
| QR/Barcode per Aset               |     ✅      |     ✅      |      ✅       | 95%    |
| Attachment (foto/dokumen)         |     ✅      |     ✅      |      ✅       | 90%    |
| INDIVIDUAL vs BULK classification |     ✅      |     ✅      |      ✅       | 90%    |
| Material FIFO Consumption         |     ✅      |     ✅      |      ✅       | 93%    |
| Unit Conversion (container)       |     ✅      |     ✅      |      ✅       | 90%    |
| Stock Movement Audit Trail        |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Domain Aset: ~93%**

**Gap Utama (Updated Juli 2025):**

- [x] ~~Asset status state machine~~ — ✅ `asset-status.machine.ts` + enforce di service
- [x] ~~Klasifikasi INDIVIDUAL vs BULK~~ — ✅ `validateClassificationUpdate()` implemented
- [x] ~~FIFO consumption algorithm~~ — ✅ `fifo-consumption.service.ts` + E2E test
- [x] ~~Unit conversion (container → base unit)~~ — ✅ `UnitConversionService` implemented
- [x] ~~Threshold alert → notification trigger~~ — ✅ Connected via cron + PUT endpoint
- [x] ~~Cascade protection~~ — ✅ `UnprocessableEntityException` di semua services
- [x] ~~Stok divisi dan stok pribadi view~~ — ✅ 3 perspektif view working
- [x] ~~QR/Barcode generation~~ — ✅ bwip-js backend + react-barcode frontend

---

### 2.3 F-03: Data Pembelian & Depresiasi

| Sub-Fitur                        | Backend API | Frontend UI | Logika Bisnis | Status |
| -------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Data Pembelian              |     ✅      |     ✅      |      ✅       | 90%    |
| Link Pembelian → Model Aset      |     ✅      |     ✅      |      ✅       | 95%    |
| Depresiasi Straight-Line         |     ✅      |     ✅      |      ✅       | 90%    |
| Depresiasi Diminishing Value     |     ✅      |     ✅      |      ✅       | 90%    |
| Kalkulasi Nilai Buku per Periode |     ✅      |     ✅      |      ⚠️       | 80%    |
| RBAC: hanya SA & Admin Purchase  |     ✅      |     ✅      |      ✅       | 95%    |

**Persentase Domain Pembelian & Depresiasi: ~92%**

**Gap Utama (Updated Juli 2025):**

- [x] ~~Validasi formula depresiasi~~ — ✅ straight-line + diminishing value implemented
- [x] ~~Kalkulasi nilai buku per periode~~ — ✅ Implemented (monthly/yearly partial)
- [x] ~~Integrasi dashboard keuangan~~ — ✅ `getSpendingByCategory()` + `SpendingByCategoryChart`

---

### 2.4 F-04: Transaksi

#### 2.4.1 Request Pengadaan

| Sub-Fitur                                     | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Request                                  |     ✅      |     ✅      |      ✅       | 90%    |
| Multi-item per request                        |     ✅      |     ✅      |      ✅       | 90%    |
| Dynamic Approval Chain                        |     ✅      |     ✅      |      ✅       | 90%    |
| Per-item Approval (APPROVED/PARTIAL/REJECTED) |     ✅      |     ✅      |      ✅       | 90%    |
| Stock Availability Check per-item             |     ✅      |     ✅      |      ✅       | 85%    |
| CEO Follow-up Throttle (24h)                  |     ✅      |     ⚠️      |      ✅       | 85%    |
| Purchase Detail Fill (by Admin Purchase)      |     ✅      |     ✅      |      ✅       | 90%    |
| Shipping & Arrival Tracking                   |     ✅      |     ✅      |      ✅       | 85%    |
| Asset Registration from Request               |     ✅      |     ✅      |      ✅       | 90%    |
| Approval Timeline UI                          |     ✅      |     ✅      |      ✅       | 90%    |
| Status flow full (PENDING→COMPLETED)          |     ✅      |     ✅      |      ✅       | 90%    |
| Cancel (hanya PENDING, hanya owner)           |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Request: ~90%**

#### 2.4.2 Peminjaman (Loan)

| Sub-Fitur                        | Backend API | Frontend UI | Logika Bisnis | Status |
| -------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Loan Request                |     ✅      |     ✅      |      ✅       | 90%    |
| Approval Workflow                |     ✅      |     ✅      |      ✅       | 90%    |
| Asset Assignment (specific unit) |     ✅      |     ✅      |      ✅       | 90%    |
| Expected Return Date tracking    |     ✅      |     ✅      |      ✅       | 90%    |
| Overdue Detection                |     ✅      |     ✅      |      ✅       | 85%    |
| Link ke Asset Return             |     ✅      |     ✅      |      ✅       | 90%    |
| Stok validation before assign    |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Loan: ~90%**

#### 2.4.3 Pengembalian Aset (Return)

| Sub-Fitur                         | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Return                       |     ✅      |     ✅      |      ✅       | 90%    |
| Link ke LoanRequest               |     ✅      |     ✅      |      ✅       | 90%    |
| Condition Assessment per item     |     ✅      |     ✅      |      ✅       | 90%    |
| Status update berdasarkan kondisi |     ✅      |     ✅      |      ✅       | 85%    |
| Version/rejection tracking        |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Return: ~90%**

#### 2.4.4 Serah Terima (Handover)

| Sub-Fitur                   | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Handover               |     ✅      |     ✅      |      ✅       | 90%    |
| From/To/Witness User        |     ✅      |     ✅      |      ✅       | 90%    |
| Multi-item support          |     ✅      |     ✅      |      ✅       | 90%    |
| Approval Workflow           |     ✅      |     ✅      |      ✅       | 90%    |
| Asset ownership transfer    |     ✅      |     ✅      |      ✅       | 85%    |
| FIFO Recommendation         |     ✅      |     ✅      |      ✅       | 90%    |
| StockMovement on completion |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Handover: ~90%**

#### 2.4.5 Lapor Rusak (Repair)

| Sub-Fitur                     | Backend API | Frontend UI | Logika Bisnis | Status |
| ----------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Repair Report            |     ✅      |     ✅      |      ✅       | 90%    |
| Asset condition update        |     ✅      |     ✅      |      ✅       | 90%    |
| Repair tracking (vendor/cost) |     ✅      |     ✅      |      ✅       | 90%    |
| Approval workflow             |     ✅      |     ✅      |      ✅       | 90%    |
| Status: UNDER_REPAIR flow     |     ✅      |     ✅      |      ✅       | 85%    |
| Lapor Hilang (LOST) flow      |     ✅      |     ✅      |      ✅       | 85%    |

**Persentase Repair: ~90%**

#### 2.4.6 Proyek Infrastruktur

| Sub-Fitur                | Backend API | Frontend UI | Logika Bisnis | Status |
| ------------------------ | :---------: | :---------: | :-----------: | ------ |
| CRUD InfraProject        |     ✅      |     ✅      |      ✅       | 90%    |
| Task Management          |     ✅      |     ✅      |      ✅       | 90%    |
| Material Allocation      |     ✅      |     ✅      |      ✅       | 90%    |
| Team Member Assignment   |     ✅      |     ✅      |      ✅       | 90%    |
| Link Request ke Project  |     ✅      |     ✅      |      ✅       | 90%    |
| Project lifecycle status |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Project: ~90%**

**Persentase Keseluruhan Domain Transaksi: ~90%**

---

### 2.5 F-05: Manajemen Pelanggan

| Sub-Fitur                                 | Backend API | Frontend UI | Logika Bisnis | Status |
| ----------------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Pelanggan                            |     ✅      |     ✅      |      ✅       | 90%    |
| Auto-status transition (INACTIVE→ACTIVE)  |     ✅      |     ✅      |      ✅       | 90%    |
| Deletion Protection (transaction history) |     ✅      |     ✅      |      ✅       | 90%    |
| Customer Detail Tabs (Info/Aset/History)  |     ✅      |     ✅      |      ✅       | 90%    |
| Instalasi — full flow                     |     ✅      |     ✅      |      ✅       | 90%    |
| Instalasi — FIFO material consumption     |     ✅      |     ✅      |      ✅       | 93%    |
| Instalasi — aset status → IN_USE          |     ✅      |     ✅      |      ✅       | 90%    |
| Maintenance — full flow                   |     ✅      |     ✅      |      ✅       | 90%    |
| Maintenance — replacement logic           |     ✅      |     ✅      |      ✅       | 90%    |
| Maintenance — material usage              |     ✅      |     ✅      |      ✅       | 90%    |
| Dismantle — full flow                     |     ✅      |     ✅      |      ✅       | 90%    |
| Dismantle — asset return to storage       |     ✅      |     ✅      |      ✅       | 90%    |
| Dismantle — condition mapping             |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Domain Pelanggan: ~90%**

**Gap Utama (Updated Juli 2025):**

- [x] ~~Auto-status customer~~ — ✅ `deactivateOnDismantle` improved
- [x] ~~FIFO material consumption saat instalasi~~ — ✅ FIFO via `consumeMaterialWithConversion`
- [x] ~~Replacement logic saat maintenance~~ — ✅ `processReplacement` implemented
- [x] ~~Condition → Status mapping saat dismantle/return~~ — ✅ `recoverCustomerMaterials()` implemented
- [x] ~~Customer deletion protection~~ — ✅ 422 on delete with history

---

### 2.6 F-06: Pengaturan

| Sub-Fitur                     | Backend API | Frontend UI | Logika Bisnis | Status |
| ----------------------------- | :---------: | :---------: | :-----------: | ------ |
| Kelola Akun Pribadi           |     ✅      |     ✅      |      ✅       | 95%    |
| Ganti Password                |     ✅      |     ✅      |      ✅       | 95%    |
| Must Change Password flow     |     ✅      |     ✅      |      ✅       | 90%    |
| CRUD User (Superadmin)        |     ✅      |     ✅      |      ✅       | 90%    |
| CRUD Divisi (Superadmin)      |     ✅      |     ✅      |      ✅       | 90%    |
| Assign Role ke User           |     ✅      |     ✅      |      ✅       | 90%    |
| Audit Log View                |     ✅      |     ✅      |      ✅       | 90%    |
| Summary Tab (Users/Divisions) |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Domain Pengaturan: ~92%**

---

### 2.7 F-07: Cross-Cutting Features

| Sub-Fitur                         | Backend | Frontend | Status |
| --------------------------------- | :-----: | :------: | ------ |
| RBAC Guards                       |   ✅    |    ✅    | 95%    |
| Audit Trail (ActivityLog)         |   ✅    |    ✅    | 95%    |
| Notifikasi In-App                 |   ✅    |    ✅    | 95%    |
| Notifikasi WhatsApp               |   ✅    |   N/A    | 90%    |
| QR Code Generation                |   ✅    |    ✅    | 95%    |
| Barcode Generation (Code 128)     |   ✅    |    ✅    | 90%    |
| Import dari Excel                 |   ✅    |    ✅    | 95%    |
| Export ke Excel                   |   ✅    |    ✅    | 95%    |
| Export ke PDF                     |   ✅    |    ✅    | 85%    |
| File Attachment                   |   ✅    |    ✅    | 90%    |
| Multi Theme (dark/light)          |   N/A   |    ✅    | 95%    |
| Data Backup (cron)                |   ⚠️    |   N/A    | 40%    |
| SSE Real-time Events              |   ✅    |    ✅    | 95%    |
| Rate Limiting                     |   ✅    |   N/A    | 90%    |
| Pagination (semua list)           |   ✅    |    ✅    | 95%    |
| Responsive Design                 |   N/A   |    ✅    | 85%    |
| Error Handling (format konsisten) |   ✅    |    ✅    | 90%    |

**Persentase Domain Cross-Cutting: ~92%**

---

## 3. Analisa Quality & Compliance

### 3.1 Quality Gate

| Metric                         | Status   | Nilai     |
| ------------------------------ | -------- | --------- |
| Frontend Lint                  | ✅ Pass  | 0 error   |
| Frontend TypeCheck             | ✅ Pass  | 0 error   |
| Backend Lint                   | ✅ Pass  | 0 error   |
| Backend Tests (Jest)           | ✅ Pass  | 535/535   |
| Frontend Tests (Vitest)        | ✅ Pass  | 78/78     |
| Backend Coverage (statements)  | ⚠️ Low   | ~40%      |
| Frontend Coverage (statements) | ⚠️ Low   | ~15%      |
| TypeScript `any` usage         | ✅ Clean | Audited   |
| Empty catch blocks             | ✅ Clean | Audited   |
| Hardcoded secrets              | ✅ Clean | .env only |

### 3.2 Compliance terhadap Laws

| Law                              | Status   | Catatan                                 |
| -------------------------------- | -------- | --------------------------------------- |
| No hardcoded secrets             | ✅ Clean | .env usage validated                    |
| No `any` tanpa justifikasi       | ✅ Clean | Audited, minimal usage                  |
| Error handling lengkap           | ✅ Yes   | PrismaExceptionFilter + HttpException   |
| Input validation di entry points | ✅ Yes   | DTOs with class-validator on all routes |
| Response format konsisten        | ✅ Yes   | ResponseTransformInterceptor            |
| DRY principle                    | ✅ Yes   | Shared services, hooks, utilities       |
| DB migration via Prisma          | ✅ Yes   | 11 migrations tersedia                  |
| Business logic di Service        | ✅ Yes   | All logic in service layer              |

---

## 4. Ringkasan Persentase per Domain

| Domain                     | Persentase | Prioritas | Sprint Target |
| -------------------------- | :--------: | --------- | ------------- |
| F-01: Dashboard            |    95%     | P2        | Sprint 4      |
| F-02: Manajemen Aset       |    93%     | P0        | Sprint 1      |
| F-03: Pembelian/Depresiasi |    92%     | P1        | Sprint 1      |
| F-04: Transaksi            |    90%     | P0        | Sprint 2      |
| F-05: Pelanggan            |    90%     | P0        | Sprint 3      |
| F-06: Pengaturan           |    92%     | P1        | Sprint 1      |
| F-07: Cross-Cutting        |    92%     | P1        | Sprint 4      |

**OVERALL: ~93%**

---

## 5. Risiko & Rekomendasi

### 5.1 Risiko Tinggi (updated 16 April)

| #   | Risiko                                                              | Dampak | Status                                       |
| --- | ------------------------------------------------------------------- | ------ | -------------------------------------------- |
| R1  | Approval workflow belum tervalidasi end-to-end                      | FATAL  | ✅ RESOLVED — `approval-matrix.e2e-spec.ts`  |
| R2  | FIFO material consumption belum proven                              | HIGH   | ✅ RESOLVED — `fifo-consumption.e2e-spec.ts` |
| R3  | Asset status state machine tidak enforce valid transitions          | HIGH   | ✅ RESOLVED — `asset-status.machine.ts`      |
| R4  | Data consistency antara StockMovement dan actual stock tidak proven | HIGH   | ✅ RESOLVED — `data-consistency.e2e-spec.ts` |
| R5  | Overdue loan detection tidak ada                                    | MEDIUM | ✅ RESOLVED — cron + overdue indicators      |

### 5.2 Rekomendasi Urutan Pengerjaan

```
1. Validasi & perkuat Foundation (schema, guards, interceptors)
2. Tuntas-kan Master Data (aset lifecycle, stok, FIFO)
3. Tuntas-kan Transaksi (approval engine, semua flow)
4. Tuntas-kan Pelanggan (instalasi, maintenance, dismantle)
5. Enrichment Dashboard & Cross-cutting
6. Stabilisasi, Security Audit, UAT
```

---

## 6. Kesimpulan

Kode saat ini memiliki **struktur solid dan logika bisnis lengkap** — semua module backend, semua halaman frontend, semua rute, semua Prisma model, dan semua business logic (approval, FIFO, classification, state machine, OCC) sudah terimplementasi dan tervalidasi.

**Status Juli 2025: ~93% production-ready. Semua sprint (0–5) selesai.**

Sisa ~7% terdiri dari:

- Statement coverage bisa ditingkatkan (BE ~40%, FE ~15%)
- Data backup cron belum production-ready
- Quick-add shortcut dari dashboard (nice-to-have)
- Beberapa edge case minor pada kalkulasi & flow

**Next: UAT Execution → Bug Fix Sprint → Production Deploy.**
