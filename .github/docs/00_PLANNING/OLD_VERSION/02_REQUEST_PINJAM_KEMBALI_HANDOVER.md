# 02 — Request Baru, Request Pinjam, Pengembalian & Handover

> Dokumentasi lengkap alur request pengadaan baru, request pinjam aset,
> pengembalian aset pinjaman, dan serah terima (handover) pada versi lama.

---

## 1. Request Baru (Pengadaan Aset)

### 1.1 Overview

Request baru adalah proses pengajuan permintaan aset/material baru. Memiliki
**multi-stage approval workflow** — dari logistik, purchase, hingga final CEO.

### 1.2 Data Model

```
Request
├── id: CUID
├── docNumber: RO-YYYY-MMDD-XXXX (auto-generated)
├── requesterId → User (pembuat request)
├── requesterName, divisionId, divisionName
├── requestDate
├── orderType: REGULAR_STOCK | URGENT | PROJECT_BASED
├── allocationTarget: USAGE | INVENTORY
├── justification?, projectName?
├── infraProjectId? → InfraProject
├── status: ItemStatus (state machine)
├── totalValue?
│
├── Approval Chain:
│   ├── logisticApproverId/Name/Date
│   ├── finalApproverId/Name/Date
│   └── rejectedById/Name/Reason/Date
│
├── Progress Tracking:
│   ├── actualShipmentDate?, arrivalDate?
│   ├── completionDate?, completedById/Name
│   └── isPrioritizedByCEO, ceoFollowUpSent, lastFollowUpAt
│
├── Registration Tracking:
│   ├── isRegistered, partiallyRegisteredItems?
│   └── parentRequestId? → Request (linked restock)
│
├── items[] → RequestItem
├── activityLogs[] → ActivityLog
└── version: Int (OCC)

RequestItem
├── id: auto-increment
├── itemName, itemTypeBrand
├── quantity, unit?, keterangan
├── availableStock?, categoryId?, typeId?
├── approvalStatus: APPROVED | REJECTED | PARTIAL | STOCK_ALLOCATED | PROCUREMENT_NEEDED
├── approvedQuantity?, rejectionReason?
├── purchasePrice?, vendor?, poNumber?, invoiceNumber?
├── purchaseDate?, warrantyEndDate?
├── purchaseFilledById?, purchaseFillDate?
└── registeredQuantity (tracking berapa sudah diregistrasi)
```

### 1.3 Status Flow Request

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REQUEST STATUS FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                        ┌──────────┐                                      │
│              Create ──→│ PENDING  │──→ CANCELLED (oleh requester)        │
│                        └────┬─────┘                                      │
│                             │                                            │
│                   Logistic  │ Approve                                    │
│                   (partial  │ per item)           ┌──────────┐           │
│                             ▼                     │ REJECTED │           │
│                   ┌─────────────────┐             └────▲─────┘           │
│                   │LOGISTIC_APPROVED│──────────────────┘                 │
│                   └────────┬────────┘    (reject at any stage)           │
│                            │                                             │
│             Final/CEO      │ Approve                                     │
│                            ▼                                             │
│                   ┌─────────────────────┐                                │
│                   │AWAITING_CEO_APPROVAL│  (jika URGENT/PROJECT_BASED)   │
│                   └────────┬────────────┘                                │
│                            │                                             │
│                CEO Approve │                                             │
│                            ▼                                             │
│                      ┌──────────┐                                        │
│                      │ APPROVED │                                        │
│                      └────┬─────┘                                        │
│                           │                                              │
│              Admin Purchase│ isi detail pembelian                         │
│                           ▼                                              │
│                     ┌────────────┐                                       │
│                     │ PURCHASING │                                       │
│                     └─────┬──────┘                                       │
│                           │                                              │
│                    Update  │ pengiriman                                   │
│                           ▼                                              │
│                    ┌─────────────┐                                       │
│                    │ IN_DELIVERY │                                       │
│                    └──────┬──────┘                                       │
│                           │                                              │
│                   Konfirm │ tiba                                          │
│                           ▼                                              │
│                      ┌─────────┐                                         │
│                      │ ARRIVED │                                         │
│                      └────┬────┘                                         │
│                           │                                              │
│               Registrasi  │ aset                                         │
│                           ▼                                              │
│                    ┌────────────────────┐                                 │
│                    │ AWAITING_HANDOVER  │                                │
│                    └────────┬───────────┘                                │
│                             │                                            │
│                  Handover / │ Serah terima                                │
│                             ▼                                            │
│                      ┌───────────┐                                       │
│                      │ COMPLETED │                                       │
│                      └───────────┘                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Approval Workflow Detail

```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTI-STAGE APPROVAL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: LOGISTIC APPROVAL                                     │
│  ├── Approver: Admin Logistik                                   │
│  ├── Cek ketersediaan stok per item                             │
│  ├── Per item bisa:                                              │
│  │   ├── APPROVED (qty penuh)                                   │
│  │   ├── PARTIAL (qty dikurangi + alasan)                       │
│  │   ├── STOCK_ALLOCATED (stok tersedia, allocate)              │
│  │   ├── PROCUREMENT_NEEDED (perlu beli)                        │
│  │   └── REJECTED (tolak item + alasan)                         │
│  └── Kirim notifikasi ke requester + Admin Purchase             │
│                                                                  │
│  Stage 2: CEO/FINAL APPROVAL (jika URGENT/PROJECT_BASED)       │
│  ├── Approver: Super Admin / CEO                                │
│  ├── Review keseluruhan request                                 │
│  ├── Follow-up tracking dengan throttle 24 jam                  │
│  └── Kirim notifikasi WhatsApp ke CEO                           │
│                                                                  │
│  Stage 3: PURCHASE PROCESSING                                   │
│  ├── Admin Purchase isi detail:                                 │
│  │   ├── Harga beli, vendor, PO number                          │
│  │   ├── Invoice number, tanggal beli                           │
│  │   └── Warranty info                                          │
│  └── Update status ke PURCHASING → IN_DELIVERY → ARRIVED       │
│                                                                  │
│  Stage 4: ASSET REGISTRATION                                    │
│  ├── Admin Logistik registrasi aset yang tiba                   │
│  ├── Link ke RequestItem (track registeredQuantity)             │
│  ├── Bisa partial registration (belum semua item tiba)          │
│  └── Saat semua ter-registrasi → AWAITING_HANDOVER              │
│                                                                  │
│  Stage 5: COMPLETION                                             │
│  ├── Serah terima dilakukan via Handover module                 │
│  └── Request marked COMPLETED                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Fitur Khusus Request

| Fitur                         | Detail                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| **Smart Request Helper**      | `SmartRequestHelper` memberikan saran berdasar stok existing |
| **Material Shortage Alert**   | `MaterialShortageAlert` menampilkan item yang stok menipis   |
| **Staging Modal**             | `StagingModal` untuk review sebelum submit                   |
| **Request Summary Dashboard** | Statistik ringkasan request per status                       |
| **Procurement Progress Card** | Tracking progress pembelian per item                         |
| **Comment Thread**            | Diskusi antar approval stages                                |
| **Export**                    | Export request data ke Excel/PDF                             |
| **Follow-up CEO**             | Auto follow-up WhatsApp dengan throttle 24 jam               |

### 1.6 Notifikasi Request

```
Trigger Notifikasi:
├── Request dibuat     → Notif ke Admin Logistik (bell + WhatsApp)
├── Logistic approved  → Notif ke requester + Admin Purchase
├── CEO follow-up      → WhatsApp ke Super Admin (throttle 24h)
├── Purchase updated   → Notif ke requester
├── Barang tiba        → Notif ke Admin Logistik + requester
├── Rejected           → Notif ke requester + alasan
└── Completed          → Notif ke semua pihak terkait
```

---

## 2. Request Pinjam (Loan Request)

### 2.1 Overview

Request pinjam memungkinkan user meminjam aset untuk penggunaan sementara
dengan tracking tanggal pengembalian dan approval workflow.

### 2.2 Data Model

```
LoanRequest
├── id: CUID
├── docNumber: RL-YY-MM-XXXX (implicit from generation)
├── requesterId → User
├── requesterName, divisionId, divisionName
├── requestDate, status: LoanRequestStatus
├── notes?
├── Approval: approverId/Name/Date, rejectionReason?
├── Return: actualReturnDate?, handoverId?
├── items[] → LoanItem
├── assetAssignments[] → LoanAssetAssignment
├── returns[] → AssetReturn
└── version: Int (OCC)

LoanItem
├── id: auto-increment
├── itemName, brand, quantity, unit?
├── keterangan, returnDate?
├── approvalStatus?, approvedQuantity?, rejectionReason?
└── loanRequestId → LoanRequest

LoanAssetAssignment
├── id: auto-increment
├── loanRequestId, loanItemId, assetId
├── assignedAt, returnedAt?
└── Unique: [loanRequestId, loanItemId, assetId]
```

### 2.3 Status Flow Pinjam

```
┌────────────────────────────────────────────────────────┐
│              LOAN REQUEST STATUS FLOW                   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐                                            │
│  │ PENDING │──→ REJECTED (oleh approver)                │
│  └────┬────┘                                            │
│       │ Approve                                         │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │ APPROVED │ (+ assign specific assets ke items)       │
│  └────┬─────┘                                           │
│       │ Handover dilakukan                              │
│       ▼                                                 │
│  ┌──────────┐                                           │
│  │ ON_LOAN  │                                           │
│  └────┬─────┘                                           │
│       │                     │                           │
│       │ Return submitted    │ Overdue (lewat deadline)  │
│       ▼                     ▼                           │
│  ┌─────────────────┐  ┌──────────┐                     │
│  │ AWAITING_RETURN │  │ OVERDUE  │                     │
│  └────────┬────────┘  └────┬─────┘                     │
│           │                │ Return submitted           │
│           │                ▼                            │
│           │         ┌─────────────────┐                 │
│           └────────→│    RETURNED     │                 │
│                     └─────────────────┘                 │
└────────────────────────────────────────────────────────┘
```

### 2.4 Alur Lengkap Pinjam

```
┌─────────────────────────────────────────────────────────────┐
│                   ALUR REQUEST PINJAM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User submit loan request                                │
│     ├── Pilih item (max 20 items per request)               │
│     ├── Isi purpose, expected return date                   │
│     └── Sistem cek ketersediaan stok                        │
│                                                              │
│  2. Admin Logistik review                                   │
│     ├── Approve/Reject per item                             │
│     ├── Jika approve: assign specific assets ke items       │
│     │   └── Asset status: IN_STORAGE → IN_CUSTODY           │
│     └── Kirim notifikasi ke requester                       │
│                                                              │
│  3. Handover (serah terima)                                 │
│     ├── Aset fisik diserahkan ke peminjam                   │
│     └── Status → ON_LOAN                                    │
│                                                              │
│  4. Monitoring                                               │
│     ├── Dashboard tracking semua pinjaman aktif             │
│     ├── Auto flag OVERDUE jika lewat returnDate             │
│     └── LoanStatisticsCards + LoanActionSidebar             │
│                                                              │
│  5. Pengembalian                                             │
│     ├── User submit return request                          │
│     ├── Status → AWAITING_RETURN                            │
│     └── Proses verifikasi (lihat section 3)                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Fitur Khusus Pinjam

| Fitur                       | Detail                                             |
| --------------------------- | -------------------------------------------------- |
| `LoanRequestFormRedesigned` | Form redesigned dengan UX yang lebih baik          |
| `LoanActionSidebar`         | Sidebar aksi kontekstual (approve, reject, return) |
| `LoanStatisticsCards`       | Statistik pinjaman per status & divisi             |
| `AssignmentPanel`           | Panel untuk assign specific asset ke loan item     |
| `Export`                    | Export data pinjaman ke Excel                      |

---

## 3. Pengembalian Aset (Asset Return)

### 3.1 Overview

Pengembalian aset adalah proses mengembalikan aset yang dipinjam, dengan
verifikasi kondisi dan status tracking.

### 3.2 Data Model

```
AssetReturn
├── id: CUID
├── docNumber: RTN-YY-MM-XXXX
├── returnDate
├── loanRequestId → LoanRequest
├── returnedById → User (peminjam)
├── returnedByName
├── status: AssetReturnStatus
├── Verification: verifiedById/Name, verificationDate?
└── items[] → AssetReturnItem

AssetReturnItem
├── id: auto-increment
├── returnId → AssetReturn
├── assetId → Asset
├── returnedCondition: AssetCondition
├── notes?
├── status: PENDING | ACCEPTED | REJECTED
└── verificationNotes?
```

### 3.3 Status Flow Pengembalian

```
┌────────────────────────────────────────────────────────┐
│           ASSET RETURN STATUS FLOW                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐                                   │
│  │ PENDING_APPROVAL │ (user submit pengembalian)        │
│  └────────┬─────────┘                                   │
│           │                                             │
│     Admin │ verifikasi per item                         │
│           ▼                                             │
│  ┌──────────────────┐                                   │
│  │     APPROVED     │ (sebagian item diterima)          │
│  └────────┬─────────┘                                   │
│           │                                             │
│     Semua │ item terverifikasi                          │
│           ▼                                             │
│  ┌──────────────────┐                                   │
│  │    COMPLETED     │                                   │
│  └──────────────────┘                                   │
│                                                         │
│  Per Item:                                              │
│  ├── ACCEPTED → Asset status revert ke IN_STORAGE       │
│  │              (condition disesuaikan)                  │
│  └── REJECTED → Asset tetap di peminjam                 │
│                 (perlu return ulang)                     │
│                                                         │
│  Jika SEMUA items returned & accepted:                  │
│  └── LoanRequest status → RETURNED                     │
└────────────────────────────────────────────────────────┘
```

### 3.4 Alur Pengembalian

```
┌─────────────────────────────────────────────────────────────┐
│                  ALUR PENGEMBALIAN ASET                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Peminjam submit return                                  │
│     ├── Route: /requests/return/new                         │
│     ├── Pilih loan request yang akan dikembalikan           │
│     ├── Pilih aset yang dikembalikan (bisa sebagian)        │
│     ├── Isi kondisi pengembalian per item                   │
│     │   (BRAND_NEW, GOOD, USED_OKAY, MINOR_DAMAGE, dll)    │
│     └── Tambah catatan per item                             │
│                                                              │
│  2. Admin verifikasi                                        │
│     ├── Cek kondisi fisik vs laporan                        │
│     ├── Per item: ACCEPT atau REJECT                        │
│     ├── Tambah verification notes                           │
│     └── Batch verification support                          │
│                                                              │
│  3. Asset Status Update                                     │
│     ├── ACCEPTED items:                                     │
│     │   ├── Condition update sesuai laporan                 │
│     │   ├── Status → IN_STORAGE                             │
│     │   ├── currentUserId/Name → null                       │
│     │   └── LoanAssetAssignment.returnedAt set              │
│     └── REJECTED items: tetap on loan                       │
│                                                              │
│  4. Loan Status Update                                      │
│     ├── Jika SEMUA item returned → RETURNED                 │
│     └── Jika sebagian → tetap ON_LOAN/AWAITING_RETURN       │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 Komponen Frontend Pengembalian

| Komponen                    | Fungsi                                  |
| --------------------------- | --------------------------------------- |
| `ReturnAssetFormRedesigned` | Form pengembalian aset (redesigned)     |
| `ReturnSelectionModal`      | Modal pilih aset yang akan dikembalikan |
| `ReturnVerificationPanel`   | Panel verifikasi admin                  |
| `ReturnStatusSidebar`       | Sidebar menampilkan status pengembalian |
| `ReturnRequestTable`        | Tabel list pengembalian                 |
| `ReturnRequestListView`     | List view alternatif                    |

---

## 4. Handover (Serah Terima)

### 4.1 Overview

Handover adalah proses formal serah terima aset dari satu pihak ke pihak lain,
melibatkan 3 pihak: **penyerah, penerima, dan saksi (mengetahui)**.

### 4.2 Data Model

```
Handover
├── id: CUID
├── docNumber: HO-YY-MM-XXXX
├── handoverDate
├── menyerahkanId/Name → User (penyerah)
├── penerimaId/Name → User (penerima)
├── mengetahuiId/Name → User (saksi/atasan)
├── woRoIntNumber? (link ke Request docNumber)
├── status: ItemStatus (COMPLETED)
├── items[] → HandoverItem
└── version: Int (OCC)

HandoverItem
├── id: auto-increment
├── handoverId → Handover
├── assetId? → Asset (nullable untuk non-tracked items)
├── itemName, itemTypeBrand
├── conditionNotes
├── quantity, unit?
├── checked: Boolean (checklist saat serah terima)
└── isLocked: Boolean (prevent edit after check)
```

### 4.3 Alur Handover

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ALUR HANDOVER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Buat Handover Document                                          │
│     ├── Route: /handover/new                                        │
│     ├── Input parties:                                              │
│     │   ├── Menyerahkan (siapa yang menyerahkan)                   │
│     │   ├── Penerima (siapa yang menerima)                          │
│     │   └── Mengetahui (saksi/atasan)                               │
│     ├── Input tanggal + referensi (WO/RO number)                   │
│     ├── Target Asset Status: IN_USE atau IN_CUSTODY                │
│     └── Pilih items dari SmartAssetSelector                        │
│                                                                      │
│  2. Smart Asset Selection                                           │
│     ├── Hanya aset IN_STORAGE yang bisa dipilih                    │
│     ├── FIFO recommendation (aset terlama duluan)                  │
│     └── Support material measurement split:                         │
│         └── Contoh: Kabel 300m → ambil 50m → sisa 250m             │
│                                                                      │
│  3. Backend Processing (dalam DB Transaction)                       │
│     ├── Validasi semua aset IN_STORAGE                              │
│     ├── Generate HO-YY-MM-XXXX doc number                          │
│     │                                                                │
│     ├── Untuk setiap item:                                          │
│     │   ├── INDIVIDUAL asset:                                       │
│     │   │   ├── Status → targetAssetStatus (IN_USE/IN_CUSTODY)     │
│     │   │   ├── currentUserId → penerima                            │
│     │   │   └── Create StockMovement (HANDOVER)                    │
│     │   │                                                            │
│     │   └── MEASUREMENT asset (material bulk):                      │
│     │       ├── Jika partial (qty < balance):                       │
│     │       │   ├── Create CHILD asset (suffix "Potongan")          │
│     │       │   ├── Child balance = qty requested                   │
│     │       │   ├── Parent balance -= qty                            │
│     │       │   └── Child status → target, parent tetap IN_STORAGE  │
│     │       └── Jika full (qty = balance):                           │
│     │           └── Same as individual asset flow                   │
│     │                                                                │
│     ├── Update Request status jika ada woRoIntNumber link            │
│     │   └── Request → AWAITING_HANDOVER / update progress           │
│     │                                                                │
│     └── Create ActivityLog, emit SSE event                          │
│                                                                      │
│  4. Post-Handover                                                   │
│     ├── Handover status: COMPLETED                                  │
│     ├── Dokumen bisa dilihat di /handover/:id                      │
│     └── Bisa dihapus dalam 24 jam (dengan revert aset)             │
│                                                                      │
│  Deletion Window (24 jam):                                          │
│  ├── Semua aset yang di-handover: revert ke IN_STORAGE             │
│  ├── Child assets dari split: dihapus                              │
│  ├── Parent balance: di-restore                                    │
│  └── Request status: di-revert                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 Material Measurement Split (Detail)

```
Contoh: Kabel UTP Cat6 — Total 300 meter di gudang

Handover request: 50 meter

┌─────────────────────────────────────────────────────┐
│  SEBELUM HANDOVER                                    │
│  Asset: "Kabel UTP Cat6"                             │
│  ├── Status: IN_STORAGE                              │
│  ├── currentBalance: 300.00                          │
│  └── unit: meter                                     │
├─────────────────────────────────────────────────────┤
│  SESUDAH HANDOVER (split)                            │
│                                                      │
│  Parent Asset: "Kabel UTP Cat6"                      │
│  ├── Status: IN_STORAGE (tetap di gudang)            │
│  └── currentBalance: 250.00                          │
│                                                      │
│  Child Asset: "Kabel UTP Cat6 (Potongan)"            │
│  ├── Status: IN_USE / IN_CUSTODY                     │
│  ├── currentBalance: 50.00                           │
│  └── currentUserId → penerima                        │
└─────────────────────────────────────────────────────┘
```

### 4.5 Handover Strategies

Sistem mendukung beberapa konteks handover via strategy pattern:

```
HandoverStrategy
├── NewRequestStrategy    → Handover dari request pengadaan baru
├── LoanStrategy          → Handover untuk pinjaman aset
├── RepairStrategy        → Handover untuk perbaikan
├── InstallationStrategy  → Handover untuk instalasi pelanggan
└── DismantleStrategy     → Handover dari hasil dismantle
```

### 4.6 Fitur Khusus Handover

| Fitur                   | Detail                                     |
| ----------------------- | ------------------------------------------ |
| `SmartAssetSelector`    | Selector pintar dengan FIFO recommendation |
| `HandoverFilterBar`     | Filter by date range, search, status       |
| `HandoverStatusSidebar` | Sidebar kontekstual per status             |
| `ExportHandoverModal`   | Export dokumen handover                    |
| `HandoverTable`         | Tabel list semua handover                  |
| 24-hour deletion window | Bisa revert handover dalam 24 jam          |

---

## 5. Relasi Antar Modul

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RELASI REQUEST → HANDOVER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Request (RO-xxx)                                                   │
│  └── Status: APPROVED → PURCHASING → IN_DELIVERY → ARRIVED          │
│      │                                                               │
│      ▼                                                               │
│  Asset Registration (REG-xxx)                                       │
│  └── Aset baru dicatat, linked ke requestId                        │
│      │                                                               │
│      ▼                                                               │
│  Handover (HO-xxx)                                                  │
│  └── woRoIntNumber = Request.docNumber                              │
│      └── Request status → COMPLETED                                 │
│                                                                      │
│  Loan Request (RL-xxx)                                              │
│  └── Status: APPROVED → ON_LOAN                                    │
│      │                                                               │
│      ▼                                                               │
│  Handover (HO-xxx)                                                  │
│  └── Serah terima aset pinjaman                                    │
│      │                                                               │
│      ▼                                                               │
│  Asset Return (RTN-xxx)                                             │
│  └── Pengembalian dari pinjaman                                    │
│      └── Loan status → RETURNED                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### Request (Pengadaan)

| Method  | Endpoint                               | Permission          | Deskripsi                  |
| ------- | -------------------------------------- | ------------------- | -------------------------- |
| `POST`  | `/api/v1/requests`                     | `requests:create`   | Buat request baru          |
| `GET`   | `/api/v1/requests`                     | `requests:view:own` | List request               |
| `GET`   | `/api/v1/requests/:id`                 | `requests:view:own` | Detail request             |
| `POST`  | `/api/v1/requests/:id/activities`      | varies              | Tambah activity            |
| `PATCH` | `/api/v1/requests/:id/approve`         | `requests:approve`  | Approve request            |
| `PATCH` | `/api/v1/requests/:id/register-assets` | `assets:create`     | Register aset dari request |
| `PATCH` | `/api/v1/requests/:id/reject`          | `requests:approve`  | Tolak request              |
| `PATCH` | `/api/v1/requests/:id/cancel`          | `requests:create`   | Cancel request             |
| `POST`  | `/api/v1/requests/:id/follow-up`       | varies              | Follow-up CEO              |

### Loan Request

| Method  | Endpoint                         | Permission               | Deskripsi             |
| ------- | -------------------------------- | ------------------------ | --------------------- |
| `POST`  | `/api/v1/loans`                  | `loan-requests:create`   | Buat pinjaman         |
| `GET`   | `/api/v1/loans`                  | `loan-requests:view:own` | List pinjaman         |
| `GET`   | `/api/v1/loans/summary`          | `loan-requests:view:own` | Statistik             |
| `GET`   | `/api/v1/loans/check-stock`      | `loan-requests:view:own` | Cek stok              |
| `GET`   | `/api/v1/loans/:id`              | `loan-requests:view:own` | Detail                |
| `PATCH` | `/api/v1/loans/:id/approve`      | `loan-requests:approve`  | Approve + assign aset |
| `PATCH` | `/api/v1/loans/:id/reject`       | `loan-requests:approve`  | Tolak                 |
| `PATCH` | `/api/v1/loans/:id/return`       | `loan-requests:create`   | Submit return         |
| `PATCH` | `/api/v1/loans/:id/mark-overdue` | `loan-requests:approve`  | Mark overdue          |

### Asset Return

| Method  | Endpoint                      | Permission               | Deskripsi           |
| ------- | ----------------------------- | ------------------------ | ------------------- |
| `POST`  | `/api/v1/returns`             | `loan-requests:create`   | Submit pengembalian |
| `GET`   | `/api/v1/returns`             | `loan-requests:view:own` | List pengembalian   |
| `GET`   | `/api/v1/returns/summary`     | `loan-requests:view:own` | Statistik           |
| `PATCH` | `/api/v1/returns/:id`         | varies                   | Update              |
| `PATCH` | `/api/v1/returns/:id/process` | `loan-requests:approve`  | Proses per item     |
| `PATCH` | `/api/v1/returns/:id/verify`  | `loan-requests:approve`  | Batch verify        |

### Handover

| Method   | Endpoint                    | Permission        | Deskripsi          |
| -------- | --------------------------- | ----------------- | ------------------ |
| `POST`   | `/api/v1/handovers`         | `assets:handover` | Buat handover      |
| `GET`    | `/api/v1/handovers`         | `assets:handover` | List handover      |
| `GET`    | `/api/v1/handovers/summary` | `assets:handover` | Statistik          |
| `GET`    | `/api/v1/handovers/:id`     | `assets:handover` | Detail             |
| `DELETE` | `/api/v1/handovers/:id`     | `assets:handover` | Hapus (24h window) |

---

## 7. Catatan untuk Rebuild

1. **Multi-stage approval** adalah fitur kunci — setiap stage punya permission berbeda
2. **Item-level approval** (bukan hanya document-level) — per item bisa approve/reject/partial
3. **Material split** pada handover perlu penanganan khusus (create child asset)
4. **24-hour deletion window** pada handover — setelah itu permanent
5. **CEO follow-up throttling** (24 jam) — hindari spam notifikasi
6. **Request-to-Registration linking** — tracking dari request → purchase → register → handover
7. **Overdue auto-marking** pada loan — perlu background job atau trigger
8. **Return verification** per item — bukan batch verification saja
9. **Stock check** sebelum approval — cek availability real-time
