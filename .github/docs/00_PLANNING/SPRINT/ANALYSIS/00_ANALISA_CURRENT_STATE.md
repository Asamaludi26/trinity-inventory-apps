# 00 — Analisa Current State vs PRD v3.1

| Metadata      | Detail                                                                             |
| ------------- | ---------------------------------------------------------------------------------- |
| **Versi**     | 1.0                                                                                |
| **Tanggal**   | 14 April 2026                                                                      |
| **Tujuan**    | Mengukur persentase kelengkapan kode saat ini terhadap spesifikasi PRD v3.1 & SDD  |
| **Metode**    | Cross-reference kode existing (routes, controllers, pages, schema) vs PRD features |
| **Referensi** | PRD v3.1, SDD v3.1, ASSET_LIFECYCLE, TRANSACTION_WORKFLOWS, CUSTOMER_OPERATIONS    |

---

## 1. Ringkasan Eksekutif

| Aspek                 | Status     | Persentase | Catatan                                     |
| --------------------- | ---------- | ---------- | ------------------------------------------- |
| **Struktur Kode**     | ✅ Lengkap | 95%        | Semua folder, module, route tersedia        |
| **Prisma Schema**     | ✅ Lengkap | 90%        | 35+ model, perlu audit relasi & field       |
| **Backend API**       | ⚠️ Partial | 70%        | Endpoint ada, logika bisnis perlu validasi  |
| **Frontend Pages**    | ✅ Lengkap | 85%        | 61 halaman, perlu validasi fungsionalitas   |
| **Business Logic**    | ⚠️ Partial | 55%        | Approval flow, FIFO, stok perlu deep review |
| **Data Consistency**  | ❌ Unknown | 30%        | Belum divalidasi end-to-end                 |
| **Testing**           | ⚠️ Partial | 60%        | 535 BE + 372 FE test, coverage ~40% BE      |
| **Cross-Cutting**     | ⚠️ Partial | 45%        | Notif, QR, import/export perlu enrichment   |
| **Overall Readiness** | ⚠️         | **~60%**   | Struktur solid, logika bisnis perlu tuntas  |

---

## 2. Analisa per Domain (PRD F-01 s/d F-07)

### 2.1 F-01: Dashboard

| Sub-Fitur                                  | Backend API | Frontend UI | Logika Bisnis | Status |
| ------------------------------------------ | :---------: | :---------: | :-----------: | ------ |
| Dashboard Utama (Superadmin)               |     ✅      |     ✅      |      ⚠️       | 70%    |
| Dashboard Keuangan (Admin Purchase)        |     ✅      |     ✅      |      ⚠️       | 65%    |
| Dashboard Operasional (Admin Logistik)     |     ✅      |     ✅      |      ⚠️       | 65%    |
| Dashboard Divisi (Leader)                  |     ✅      |     ✅      |      ⚠️       | 60%    |
| Dashboard Pribadi (Staff)                  |     ✅      |     ✅      |      ⚠️       | 60%    |
| Stock Alert Widget                         |     ✅      |     ✅      |      ⚠️       | 70%    |
| Filter waktu (daily/weekly/monthly/yearly) |     ❌      |     ❌      |      ❌       | 0%     |
| Card notifikasi stok habis dgn link action |     ❌      |     ❌      |      ❌       | 0%     |
| Data proyek sedang berjalan                |     ⚠️      |     ⚠️      |      ⚠️       | 40%    |
| Data pelanggan ringkasan                   |     ❌      |     ❌      |      ❌       | 0%     |

**Persentase Domain Dashboard: ~50%**

**Gap Utama:**

- [ ] Filter waktu pada semua statistik belum ada
- [ ] Card notifikasi stok habis/hampir habis dengan action button belum ada
- [ ] Widget proyek sedang berjalan belum lengkap
- [ ] Widget ringkasan pelanggan belum ada
- [ ] Quick-add kategori/model dari dashboard belum ada
- [ ] Validasi data aggregasi terhadap realitas data belum dilakukan

---

### 2.2 F-02: Manajemen Aset

| Sub-Fitur                         | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Aset (create/read/update)    |     ✅      |     ✅      |      ✅       | 90%    |
| Soft Delete Aset                  |     ✅      |     ⚠️      |      ⚠️       | 70%    |
| Batch Registration                |     ✅      |     ✅      |      ⚠️       | 75%    |
| Asset ID auto-generation          |     ✅      |     ✅      |      ⚠️       | 80%    |
| Asset Status State Machine        |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |
| Asset Condition tracking          |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |
| Stok Gudang Utama View            |     ✅      |     ✅      |      ⚠️       | 75%    |
| Stok Gudang Divisi View           |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |
| Stok Pribadi View                 |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| Threshold Setting per Model       |     ✅      |     ✅      |      ⚠️       | 75%    |
| Threshold Alert Notification      |     ⚠️      |     ⚠️      |      ❌       | 40%    |
| Kategori/Tipe/Model Hirarki       |     ✅      |     ✅      |      ⚠️       | 80%    |
| Cascade Protection (delete)       |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |
| QR/Barcode per Aset               |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Attachment (foto/dokumen)         |     ✅      |     ⚠️      |      ⚠️       | 65%    |
| INDIVIDUAL vs BULK classification |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Material FIFO Consumption         |     ⚠️      |     ❌      |      ⚠️       | 40%    |
| Unit Conversion (container)       |     ⚠️      |     ❌      |      ❌       | 30%    |
| Stock Movement Audit Trail        |     ✅      |     ⚠️      |      ⚠️       | 65%    |

**Persentase Domain Aset: ~62%**

**Gap Utama:**

- [ ] Asset status state machine — validasi transisi yang diizinkan belum enforce di backend
- [ ] Klasifikasi INDIVIDUAL vs BULK (COUNT/MEASUREMENT) belum konsisten
- [ ] FIFO consumption algorithm belum tervalidasi end-to-end
- [ ] Unit conversion (container → base unit) belum implemented
- [ ] Threshold alert → notification trigger belum connected
- [ ] Cascade protection saat delete kategori/tipe/model perlu penguatan
- [ ] Stok divisi dan stok pribadi view perlu penyesuaian query

---

### 2.3 F-03: Data Pembelian & Depresiasi

| Sub-Fitur                        | Backend API | Frontend UI | Logika Bisnis | Status |
| -------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Data Pembelian              |     ✅      |     ✅      |      ⚠️       | 80%    |
| Link Pembelian → Model Aset      |     ✅      |     ✅      |      ✅       | 90%    |
| Depresiasi Straight-Line         |     ✅      |     ✅      |      ⚠️       | 75%    |
| Depresiasi Diminishing Value     |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |
| Kalkulasi Nilai Buku per Periode |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| RBAC: hanya SA & Admin Purchase  |     ✅      |     ✅      |      ✅       | 90%    |

**Persentase Domain Pembelian & Depresiasi: ~74%**

**Gap Utama:**

- [ ] Validasi formula depresiasi diminishing value
- [ ] Kalkulasi nilai buku per periode (monthly/yearly view)
- [ ] Integrasi dashboard keuangan dengan data depresiasi aktual

---

### 2.4 F-04: Transaksi

#### 2.4.1 Request Pengadaan

| Sub-Fitur                                     | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Request                                  |     ✅      |     ✅      |      ✅       | 85%    |
| Multi-item per request                        |     ✅      |     ✅      |      ✅       | 85%    |
| Dynamic Approval Chain                        |     ✅      |     ⚠️      |      ⚠️       | 65%    |
| Per-item Approval (APPROVED/PARTIAL/REJECTED) |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Stock Availability Check per-item             |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| CEO Follow-up Throttle (24h)                  |     ⚠️      |     ❌      |      ⚠️       | 40%    |
| Purchase Detail Fill (by Admin Purchase)      |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Shipping & Arrival Tracking                   |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Asset Registration from Request               |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Approval Timeline UI                          |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| Status flow full (PENDING→COMPLETED)          |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| Cancel (hanya PENDING, hanya owner)           |     ✅      |     ✅      |      ⚠️       | 75%    |

**Persentase Request: ~60%**

#### 2.4.2 Peminjaman (Loan)

| Sub-Fitur                        | Backend API | Frontend UI | Logika Bisnis | Status |
| -------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Loan Request                |     ✅      |     ✅      |      ✅       | 85%    |
| Approval Workflow                |     ✅      |     ⚠️      |      ⚠️       | 65%    |
| Asset Assignment (specific unit) |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Expected Return Date tracking    |     ✅      |     ✅      |      ⚠️       | 75%    |
| Overdue Detection                |     ⚠️      |     ❌      |      ❌       | 30%    |
| Link ke Asset Return             |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Stok validation before assign    |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |

**Persentase Loan: ~61%**

#### 2.4.3 Pengembalian Aset (Return)

| Sub-Fitur                         | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Return                       |     ✅      |     ✅      |      ⚠️       | 75%    |
| Link ke LoanRequest               |     ✅      |     ✅      |      ⚠️       | 70%    |
| Condition Assessment per item     |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Status update berdasarkan kondisi |     ⚠️      |     ❌      |      ⚠️       | 45%    |
| Version/rejection tracking        |     ✅      |     ⚠️      |      ⚠️       | 65%    |

**Persentase Return: ~63%**

#### 2.4.4 Serah Terima (Handover)

| Sub-Fitur                   | Backend API | Frontend UI | Logika Bisnis | Status |
| --------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Handover               |     ✅      |     ✅      |      ⚠️       | 80%    |
| From/To/Witness User        |     ✅      |     ✅      |      ✅       | 85%    |
| Multi-item support          |     ✅      |     ✅      |      ⚠️       | 75%    |
| Approval Workflow           |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Asset ownership transfer    |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| FIFO Recommendation         |     ❌      |     ❌      |      ❌       | 0%     |
| StockMovement on completion |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |

**Persentase Handover: ~58%**

#### 2.4.5 Lapor Rusak (Repair)

| Sub-Fitur                     | Backend API | Frontend UI | Logika Bisnis | Status |
| ----------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Repair Report            |     ✅      |     ✅      |      ⚠️       | 80%    |
| Asset condition update        |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |
| Repair tracking (vendor/cost) |     ✅      |     ⚠️      |      ⚠️       | 65%    |
| Approval workflow             |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Status: UNDER_REPAIR flow     |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| Lapor Hilang (LOST) flow      |     ❌      |     ❌      |      ❌       | 0%     |

**Persentase Repair: ~53%**

#### 2.4.6 Proyek Infrastruktur

| Sub-Fitur                | Backend API | Frontend UI | Logika Bisnis | Status |
| ------------------------ | :---------: | :---------: | :-----------: | ------ |
| CRUD InfraProject        |     ✅      |     ✅      |      ⚠️       | 75%    |
| Task Management          |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Material Allocation      |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Team Member Assignment   |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Link Request ke Project  |     ✅      |     ⚠️      |      ⚠️       | 60%    |
| Project lifecycle status |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |

**Persentase Project: ~60%**

**Persentase Keseluruhan Domain Transaksi: ~59%**

---

### 2.5 F-05: Manajemen Pelanggan

| Sub-Fitur                                 | Backend API | Frontend UI | Logika Bisnis | Status |
| ----------------------------------------- | :---------: | :---------: | :-----------: | ------ |
| CRUD Pelanggan                            |     ✅      |     ✅      |      ⚠️       | 80%    |
| Auto-status transition (INACTIVE→ACTIVE)  |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Deletion Protection (transaction history) |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Customer Detail Tabs (Info/Aset/History)  |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| Instalasi — full flow                     |     ✅      |     ✅      |      ⚠️       | 65%    |
| Instalasi — FIFO material consumption     |     ⚠️      |     ⚠️      |      ⚠️       | 45%    |
| Instalasi — aset status → IN_USE          |     ⚠️      |     ⚠️      |      ⚠️       | 55%    |
| Maintenance — full flow                   |     ✅      |     ✅      |      ⚠️       | 65%    |
| Maintenance — replacement logic           |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Maintenance — material usage              |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Dismantle — full flow                     |     ✅      |     ✅      |      ⚠️       | 65%    |
| Dismantle — asset return to storage       |     ⚠️      |     ⚠️      |      ⚠️       | 50%    |
| Dismantle — condition mapping             |     ⚠️      |     ⚠️      |      ⚠️       | 45%    |

**Persentase Domain Pelanggan: ~56%**

**Gap Utama:**

- [ ] Auto-status customer (INACTIVE → ACTIVE saat instalasi, → INACTIVE saat semua dismantle)
- [ ] FIFO material consumption saat instalasi belum tervalidasi
- [ ] Replacement logic saat maintenance (swap old ↔ new asset)
- [ ] Condition → Status mapping saat dismantle/return belum enforce
- [ ] Customer deletion protection

---

### 2.6 F-06: Pengaturan

| Sub-Fitur                     | Backend API | Frontend UI | Logika Bisnis | Status |
| ----------------------------- | :---------: | :---------: | :-----------: | ------ |
| Kelola Akun Pribadi           |     ✅      |     ✅      |      ✅       | 90%    |
| Ganti Password                |     ✅      |     ✅      |      ✅       | 90%    |
| Must Change Password flow     |     ✅      |     ✅      |      ⚠️       | 75%    |
| CRUD User (Superadmin)        |     ✅      |     ✅      |      ⚠️       | 80%    |
| CRUD Divisi (Superadmin)      |     ✅      |     ✅      |      ⚠️       | 80%    |
| Assign Role ke User           |     ✅      |     ✅      |      ⚠️       | 80%    |
| Audit Log View                |     ✅      |     ✅      |      ⚠️       | 70%    |
| Summary Tab (Users/Divisions) |     ⚠️      |     ⚠️      |      ⚠️       | 60%    |

**Persentase Domain Pengaturan: ~78%**

---

### 2.7 F-07: Cross-Cutting Features

| Sub-Fitur                         | Backend | Frontend | Status |
| --------------------------------- | :-----: | :------: | ------ |
| RBAC Guards                       |   ✅    |    ✅    | 85%    |
| Audit Trail (ActivityLog)         |   ✅    |    ⚠️    | 70%    |
| Notifikasi In-App                 |   ✅    |    ⚠️    | 60%    |
| Notifikasi WhatsApp               |   ⚠️    |    ❌    | 35%    |
| QR Code Generation                |   ✅    |    ⚠️    | 60%    |
| Barcode Scanning                  |   ❌    |    ❌    | 0%     |
| Import dari Excel                 |   ✅    |    ⚠️    | 55%    |
| Export ke Excel                   |   ✅    |    ⚠️    | 55%    |
| Export ke PDF                     |   ⚠️    |    ⚠️    | 40%    |
| File Attachment                   |   ✅    |    ⚠️    | 65%    |
| Multi Theme (dark/light)          |   N/A   |    ✅    | 85%    |
| Data Backup (cron)                |   ⚠️    |   N/A    | 30%    |
| SSE Real-time Events              |   ✅    |    ⚠️    | 65%    |
| Rate Limiting                     |   ✅    |   N/A    | 80%    |
| Pagination (semua list)           |   ✅    |    ✅    | 85%    |
| Responsive Design                 |   N/A   |    ⚠️    | 70%    |
| Error Handling (format konsisten) |   ✅    |    ⚠️    | 75%    |

**Persentase Domain Cross-Cutting: ~58%**

---

## 3. Analisa Quality & Compliance

### 3.1 Quality Gate

| Metric                         | Status     | Nilai       |
| ------------------------------ | ---------- | ----------- |
| Frontend Lint                  | ✅ Pass    | 0 error     |
| Frontend TypeCheck             | ✅ Pass    | 0 error     |
| Backend Lint                   | ✅ Pass    | 0 error     |
| Backend Tests (Jest)           | ✅ Pass    | 535/535     |
| Frontend Tests (Vitest)        | ✅ Pass    | 372/372     |
| Backend Coverage (statements)  | ⚠️ Low     | ~40%        |
| Frontend Coverage (statements) | ⚠️ Low     | ~3.3%       |
| TypeScript `any` usage         | ⚠️ Unknown | Perlu audit |
| Empty catch blocks             | ⚠️ Unknown | Perlu audit |
| Hardcoded secrets              | ⚠️ Unknown | Perlu audit |

### 3.2 Compliance terhadap Laws

| Law                              | Status         | Catatan                                   |
| -------------------------------- | -------------- | ----------------------------------------- |
| No hardcoded secrets             | ⚠️ Perlu audit | Cek .env usage                            |
| No `any` tanpa justifikasi       | ⚠️ Perlu audit | Scan kode backend & frontend              |
| Error handling lengkap           | ⚠️ Partial     | Ada PrismaExceptionFilter, perlu validasi |
| Input validation di entry points | ⚠️ Partial     | DTO ada, perlu validasi coverage          |
| Response format konsisten        | ✅ Yes         | ResponseTransformInterceptor              |
| DRY principle                    | ⚠️ Partial     | Perlu review duplication                  |
| DB migration via Prisma          | ✅ Yes         | 5 migrations tersedia                     |
| Business logic di Service        | ⚠️ Partial     | Perlu validasi tidak di Controller        |

---

## 4. Ringkasan Persentase per Domain

| Domain                     | Persentase | Prioritas | Sprint Target |
| -------------------------- | :--------: | --------- | ------------- |
| F-06: Pengaturan           |    78%     | P1        | Sprint 1      |
| F-03: Pembelian/Depresiasi |    74%     | P1        | Sprint 1      |
| F-02: Manajemen Aset       |    62%     | P0        | Sprint 1      |
| F-04: Transaksi            |    59%     | P0        | Sprint 2      |
| F-07: Cross-Cutting        |    58%     | P1        | Sprint 4      |
| F-05: Pelanggan            |    56%     | P0        | Sprint 3      |
| F-01: Dashboard            |    50%     | P2        | Sprint 4      |

**OVERALL: ~60%**

---

## 5. Risiko & Rekomendasi

### 5.1 Risiko Tinggi (harus ditangani segera)

| #   | Risiko                                                              | Dampak | Mitigasi                                  |
| --- | ------------------------------------------------------------------- | ------ | ----------------------------------------- |
| R1  | Approval workflow belum tervalidasi end-to-end                      | FATAL  | Sprint 2: test full chain per role        |
| R2  | FIFO material consumption belum proven                              | HIGH   | Sprint 1: implement & test algorithm      |
| R3  | Asset status state machine tidak enforce valid transitions          | HIGH   | Sprint 1: add transition guard di service |
| R4  | Data consistency antara StockMovement dan actual stock tidak proven | HIGH   | Sprint 1: reconciliation logic            |
| R5  | Overdue loan detection tidak ada                                    | MEDIUM | Sprint 2: scheduler + notification        |

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

Kode saat ini memiliki **struktur yang solid** — semua module backend, semua halaman frontend, semua rute, dan semua Prisma model sudah tersedia. Namun **logika bisnis** (approval workflow, FIFO, state machine, data consistency) membutuhkan validasi mendalam dan penyempurnaan.

**Target**: Dari 60% → 100% production-ready melalui 5 sprint terstruktur.
