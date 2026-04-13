# Sprint 4 — Dashboard & Cross-Cutting Features

| Metadata      | Detail                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| **Status**    | 📋 PLANNED                                                                     |
| **Fokus**     | Dashboard per role, Notifikasi, QR/Barcode, Import/Export, Settings enrichment |
| **Referensi** | PRD §5.1 A & G, PLAN_FITUR.md, SDD §2.1                                        |
| **Dependen**  | Sprint 1-3 (semua domain data harus tersedia untuk aggregasi)                  |

---

## Scope

Semua fitur Dashboard & Cross-Cutting harus **tuntas dan tervalidasi**:

1. Dashboard per role (SA, AP, AL, Leader, Staff)
2. Dashboard enrichment (filter waktu, stock alert cards, project widget)
3. Notifikasi (in-app bell + WhatsApp)
4. QR Code / Barcode
5. Import & Export (Excel, PDF)
6. File Attachment enhancement
7. Audit Log enhancement
8. Settings enrichment

---

## Module 1: Dashboard per Role (T4-01 s/d T4-06)

### T4-01: Dashboard Superadmin [P0, L]

**Agent**: Backend + Frontend  
**File BE**: `modules/dashboards/dashboard.controller.ts`, `dashboard.service.ts`  
**File FE**: `features/dashboard/components/`, `pages/`

**Acceptance Criteria**:

- [ ] **Stats Cards**:
  - Total aset (by status breakdown)
  - Total transaksi aktif (by type)
  - Total user & divisi
  - Total pelanggan (active/inactive)
  - Total proyek (by status)
  - Total pembelian (this month/total)
- [ ] **Charts**:
  - Asset trend 6 bulan (line chart)
  - Category distribution (pie/donut chart)
  - Transaction volume per month (bar chart)
- [ ] **Recent Activity**: 10 aktivitas terbaru (semua domain)
- [ ] **Stock Alert Widget**: model yang stok < threshold (merah = critical, kuning = warning)
- [ ] **Quick Actions**: tombol ke halaman yang sering diakses

**Data Aggregation Query:**

```typescript
// Stats endpoint
async function getGlobalStats() {
  const [assetStats, transactionStats, userCount, customerStats, projectStats] = await Promise.all([
    prisma.asset.groupBy({ by: ['status'], _count: true }),
    prisma.$queryRaw`SELECT ... active transactions by type`,
    prisma.user.count({ where: { isActive: true } }),
    prisma.customer.groupBy({ by: ['status'], _count: true }),
    prisma.infraProject.groupBy({ by: ['status'], _count: true }),
  ]);
  return { assetStats, transactionStats, userCount, customerStats, projectStats };
}
```

### T4-02: Dashboard Admin Purchase (Finance) [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] **Stats Cards**:
  - Total pembelian bulan ini / total overall
  - Total nilai depresiasi
  - Request menunggu purchase detail fill
  - Pending purchase processing
- [ ] **Charts**:
  - Spending by category (bar chart)
  - Monthly spending trend (line chart)
  - Top suppliers (horizontal bar)
- [ ] **Active Purchases**: daftar request yang status PURCHASING/IN_DELIVERY
- [ ] **Depreciation Overview**: ringkasan nilai buku per kategori

### T4-03: Dashboard Admin Logistik (Operations) [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] **Stats Cards**:
  - Total aset in storage vs in use
  - Transaksi pending approval (yang butuh action AL)
  - Material low stock count
  - Active installations/maintenance
- [ ] **Charts**:
  - Daily operations volume (7 hari terakhir)
  - Stock level per model (horizontal bar, sorted by urgency)
- [ ] **Stock Alerts**: list model di bawah threshold + quick-action → request
- [ ] **Pending Actions**: transaksi yang menunggu approval/execution AL

### T4-04: Dashboard Leader (Division) [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] **Stats Cards**:
  - Total aset divisi (by status)
  - Total member divisi
  - Transaksi pending approval dari tim
  - Active projects divisi
- [ ] **Division Members**: list member + aset yang dipegang
- [ ] **Team Activity**: recent activity dari anggota divisi
- [ ] **Scoped**: hanya data dari divisi leader

### T4-05: Dashboard Staff (Personal) [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] **Stats Cards**:
  - Aset yang saya pegang (count)
  - Loan aktif saya
  - Request saya (pending/approved)
  - Notifikasi yang belum dibaca
- [ ] **My Assets**: list aset yang currentUserId = me
- [ ] **My Transactions**: recent transactions yang saya buat
- [ ] **Quick Actions**: buat request baru, lapor rusak

### T4-06: Dashboard Time Filter [P1, M]

**Agent**: Backend + Frontend

**Acceptance Criteria** (PLAN_FITUR.md §1.1):

- [ ] Filter waktu global per dashboard: Hari ini, 7 hari, 30 hari, 3 bulan, 6 bulan, 1 tahun, custom range
- [ ] Diterapkan ke semua statistik dan chart
- [ ] Backend support `dateFrom` dan `dateTo` query params
- [ ] Default: 30 hari terakhir
- [ ] UI: dropdown atau date range picker

---

## Module 2: Notifikasi (T4-07 s/d T4-10)

### T4-07: In-App Notification System [P0, M]

**Agent**: Backend + Frontend  
**File BE**: `core/notifications/`  
**File FE**: `features/notifications/`

**Acceptance Criteria**:

- [ ] Notification model: type, title, message, userId, isRead, metadata, createdAt
- [ ] Bell icon di header menampilkan unread count (badge)
- [ ] Click bell → notification dropdown/page
- [ ] Mark as read (individual + mark all)
- [ ] SSE push untuk real-time notification (tanpa polling)
- [ ] Notification types:
  - APPROVAL_REQUIRED
  - TRANSACTION_APPROVED / REJECTED / COMPLETED
  - LOW_STOCK_ALERT
  - LOAN_OVERDUE
  - SYSTEM_ANNOUNCEMENT

### T4-08: Notification Triggers [P0, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Setiap status change transaksi → notification ke stakeholder
- [ ] Stock threshold breach → notification ke SA & AL
- [ ] Loan overdue → notification ke borrower + AL
- [ ] User created → welcome notification
- [ ] Notification routing: berdasarkan role & divisi

### T4-09: WhatsApp Integration [P2, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] WhatsApp notification service (abstract provider)
- [ ] Send message to user phone number
- [ ] Templates: approval request, approval result, stock alert, overdue reminder
- [ ] Fallback ke in-app jika WA gagal
- [ ] Throttle: max 1 message per topic per 24 jam (CEO follow-up)
- [ ] Config: enable/disable per notification type

### T4-10: Notification Preferences [P2, S]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] User bisa toggle notification types on/off
- [ ] In-app always on (non-negotiable)
- [ ] WhatsApp toggleable per type
- [ ] Settings page: notification preferences section

---

## Module 3: QR Code & Barcode (T4-11 s/d T4-13)

### T4-11: QR Code Generation [P1, M]

**Agent**: Backend + Frontend  
**File**: `modules/qrcode/`

**Acceptance Criteria**:

- [ ] Generate QR code per asset (contains: asset code + URL to detail page)
- [ ] Bulk generate: select multiple assets → download QR sheet (PDF/PNG)
- [ ] Print-ready layout: label with QR + asset code + name
- [ ] QR readable by standard phone camera

### T4-12: QR Code Scan [P2, M]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Camera-based QR scanner di browser (mobile-friendly)
- [ ] Scan → navigate ke asset detail page
- [ ] Scan → asset info popup (quick view)
- [ ] UniversalScannerModal component

### T4-13: Barcode Support [P2, S]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Barcode generation (Code 128) sebagai alternatif QR
- [ ] Same data encoding as QR
- [ ] Print layout support

---

## Module 4: Import & Export (T4-14 s/d T4-17)

### T4-14: Export ke Excel [P1, M]

**Agent**: Backend + Frontend  
**File**: `modules/exports/`

**Acceptance Criteria**:

- [ ] Export list data ke .xlsx:
  - Daftar Aset
  - Daftar Pelanggan
  - Daftar Transaksi (per modul)
  - Stok Summary
  - Report Pembelian & Depresiasi
- [ ] Respect current filter & search (export apa yang dilihat user)
- [ ] Column headers bahasa Indonesia
- [ ] Formatted: auto-width, header styling
- [ ] RBAC: export hanya data yang diizinkan role

### T4-15: Export ke PDF [P1, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] PDF generation untuk:
  - Detail transaksi (surat serah terima, dll)
  - Laporan stok
  - QR label sheet
- [ ] Template per document type
- [ ] A4 paper size, landscape/portrait sesuai context
- [ ] Header: logo perusahaan, tanggal cetak
- [ ] Downloadable via API endpoint

### T4-16: Import dari Excel [P1, L]

**Agent**: Backend + Frontend  
**File**: `modules/imports/`

**Acceptance Criteria**:

- [ ] Import aset dari .xlsx file
- [ ] Template download: user download template kosong → isi → upload
- [ ] Validation per row: highlight error rows (tanpa abort seluruh import)
- [ ] Preview sebelum confirm (dry-run mode)
- [ ] Batch size limit: max 500 rows per import
- [ ] Duplicate detection: serial number, asset code
- [ ] Success: create assets + StockMovement + ActivityLog

### T4-17: Import Validation Report [P1, S]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Upload → preview table with validation status per row
- [ ] Green = valid, Red = error (with error message)
- [ ] User bisa fix errors atau skip error rows
- [ ] Confirm → process only valid rows
- [ ] Result: summary (N imported, M skipped, K errors)

---

## Module 5: Settings Enhancement (T4-18 s/d T4-20)

### T4-18: Audit Log Enhancement [P1, M]

**Agent**: Backend + Frontend  
**File**: `modules/settings/audit/`, `features/settings/pages/AuditLogPage.tsx`

**Acceptance Criteria**:

- [ ] Audit log list: filter by entity type, action, user, date range
- [ ] Detail: before/after data diff (JSON diff view)
- [ ] Pagination & search
- [ ] RBAC: hanya Superadmin
- [ ] Performance: partitioning atau indexed date column

### T4-19: Users/Divisions Summary Tab [P1, S]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Summary view: count users per role, count users per division
- [ ] Chart: user distribution by role (pie chart)
- [ ] Active vs inactive user count
- [ ] Quick stats cards

### T4-20: Profile Enhancement [P1, S]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Profile page menampilkan: aset yang saya pegang, loan aktif
- [ ] Avatar upload
- [ ] Phone number editable
- [ ] Last login timestamp

---

## Definition of Done (Sprint 4)

- [ ] Dashboard per role (5 variants) menampilkan data akurat dari semua domain
- [ ] Time filter berfungsi di semua dashboard
- [ ] Stock alert widget linked ke request action
- [ ] In-app notification: real-time via SSE, bell badge, mark read
- [ ] WhatsApp notification: at least template-based send
- [ ] QR code generation & bulk print berfungsi
- [ ] Export Excel berfungsi untuk semua list pages
- [ ] Import Excel berfungsi dengan validation & preview
- [ ] Audit log enhanced (filter, diff view)
- [ ] All cross-cutting features integrated with domain modules
- [ ] Quality Gate: 0 lint error, 0 typecheck error
