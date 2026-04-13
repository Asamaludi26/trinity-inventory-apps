# Workflow Transaksi — Referensi Implementasi

| Metadata        | Detail                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| **Versi**       | 1.0                                                                       |
| **Tanggal**     | 14 April 2026                                                             |
| **Status**      | ACTIVE — Referensi implementasi dari analisa versi lama                   |
| **Referensi**   | PRD v3.1 (F-04), SDD v3.1, OLD_VERSION/02_REQUEST_PINJAM_KEMBALI_HANDOVER |
| **Sumber Data** | Dokumentasi versi lama (OLD_VERSION) + keputusan arsitektural baru        |

> **Tujuan**: Dokumen ini mendefinisikan secara detail alur workflow untuk semua modul transaksi:
> Request Pengadaan, Request Pinjam, Pengembalian Aset, dan Serah Terima (Handover).
> Menjadi acuan utama developer saat mengimplementasikan modul Transaction.

---

## Daftar Isi

1. [Request Pengadaan (Permintaan Baru)](#1-request-pengadaan-permintaan-baru)
2. [Request Pinjam (Loan Request)](#2-request-pinjam-loan-request)
3. [Pengembalian Aset (Asset Return)](#3-pengembalian-aset-asset-return)
4. [Serah Terima (Handover)](#4-serah-terima-handover)
5. [Material Split Logic](#5-material-split-logic)
6. [Notifikasi per Workflow](#6-notifikasi-per-workflow)

---

## 1. Request Pengadaan (Permintaan Baru)

### 1.1 Overview

Request pengadaan adalah proses pengajuan permintaan aset/material baru. Memiliki **multi-stage approval workflow** dengan kemampuan approve/reject **per item**.

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

### 1.3 Status Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REQUEST STATUS FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Create ───→ PENDING ───→ CANCELLED (oleh requester)                    │
│                 │                                                        │
│       Logistic  │ Approve (per item)                                     │
│                 ▼                                                        │
│        LOGISTIC_APPROVED ──────→ REJECTED (reject at any stage)         │
│                 │                                                        │
│       Final/CEO │ Approve                                                │
│                 ▼                                                        │
│        AWAITING_CEO_APPROVAL (jika URGENT/PROJECT_BASED)                │
│                 │                                                        │
│       CEO       │ Approve                                                │
│                 ▼                                                        │
│              APPROVED                                                    │
│                 │                                                        │
│       Purchase  │ isi detail pembelian                                   │
│                 ▼                                                        │
│             PURCHASING                                                   │
│                 │                                                        │
│       Update    │ pengiriman                                             │
│                 ▼                                                        │
│            IN_DELIVERY                                                   │
│                 │                                                        │
│       Konfirm   │ tiba                                                   │
│                 ▼                                                        │
│              ARRIVED                                                     │
│                 │                                                        │
│       Registrasi│ aset                                                   │
│                 ▼                                                        │
│        AWAITING_HANDOVER                                                 │
│                 │                                                        │
│       Handover  │                                                        │
│                 ▼                                                        │
│             COMPLETED                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Multi-Stage Approval Detail

```
Stage 1: LOGISTIC APPROVAL
├── Approver: Admin Logistik
├── Cek ketersediaan stok per item
├── Per item bisa:
│   ├── APPROVED (qty penuh)
│   ├── PARTIAL (qty dikurangi + alasan wajib)
│   ├── STOCK_ALLOCATED (stok tersedia, langsung allocate)
│   ├── PROCUREMENT_NEEDED (perlu beli dari vendor)
│   └── REJECTED (tolak item + alasan wajib)
└── Kirim notifikasi ke requester + Admin Purchase

Stage 2: CEO/FINAL APPROVAL (jika orderType = URGENT atau PROJECT_BASED)
├── Approver: Super Admin / CEO
├── Review keseluruhan request (bukan per item)
├── Follow-up tracking: WhatsApp dengan throttle 24 jam
│   └── Tidak kirim follow-up jika sudah kirim dalam 24 jam terakhir
└── Kirim notifikasi WhatsApp ke CEO

Stage 3: PURCHASE PROCESSING
├── Admin Purchase mengisi detail per item:
│   ├── Harga beli, vendor, PO number
│   ├── Invoice number, tanggal beli
│   └── Warranty info
└── Update status: PURCHASING → IN_DELIVERY → ARRIVED

Stage 4: ASSET REGISTRATION
├── Admin Logistik registrasi aset yang tiba
├── Link ke RequestItem (track registeredQuantity)
├── Bisa partial registration (belum semua item tiba)
│   └── Track via partiallyRegisteredItems
└── Saat semua ter-registrasi → AWAITING_HANDOVER

Stage 5: COMPLETION
├── Serah terima dilakukan via Handover module
└── Request marked COMPLETED
```

### 1.5 Business Rules

| Rule                   | Detail                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| Creator ≠ Approver     | Pembuat request tidak boleh approve request sendiri              |
| Min 1 item             | Request minimal memiliki 1 item                                  |
| Max 50 items           | Batas item per request                                           |
| Partial Approval       | Per item bisa di-approve dengan qty berbeda dari yang diminta    |
| Sequential Approval    | Stage berikutnya baru aktif setelah stage sebelumnya selesai     |
| Cancel hanya PENDING   | Requester hanya bisa cancel jika status masih PENDING            |
| Reject stops chain     | Reject di stage manapun → status REJECTED, feedback ke requester |
| CEO follow-up throttle | Max 1 follow-up WhatsApp per 24 jam untuk menghindari spam       |

---

## 2. Request Pinjam (Loan Request)

### 2.1 Overview

Request pinjam memungkinkan user meminjam aset untuk penggunaan sementara. Memiliki tracking tanggal pengembalian, overdue detection, dan approval workflow.

### 2.2 Data Model

```
LoanRequest
├── id: CUID
├── docNumber: RL-YY-MM-XXXX
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
├── keterangan, returnDate? (target tanggal kembali)
├── approvalStatus?, approvedQuantity?, rejectionReason?
└── loanRequestId → LoanRequest

LoanAssetAssignment
├── id: auto-increment
├── loanRequestId, loanItemId, assetId
├── assignedAt, returnedAt?
└── Unique: [loanRequestId, loanItemId, assetId]
```

### 2.3 Status Flow

```
┌────────────────────────────────────────────────────────┐
│              LOAN REQUEST STATUS FLOW                   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  PENDING ──→ REJECTED (oleh approver)                   │
│     │                                                   │
│     │ Approve + assign specific assets                  │
│     ▼                                                   │
│  APPROVED                                               │
│     │                                                   │
│     │ Handover dilakukan                                │
│     ▼                                                   │
│  ON_LOAN                                                │
│     │                    │                              │
│     │ Return submitted   │ Lewat deadline               │
│     ▼                    ▼                              │
│  AWAITING_RETURN     OVERDUE                            │
│     │                    │                              │
│     │                    │ Return submitted              │
│     ▼                    ▼                              │
│          RETURNED                                       │
└────────────────────────────────────────────────────────┘
```

### 2.4 Alur Lengkap

```
1. User submit loan request
   ├── Pilih item (max 20 items per request)
   ├── Isi purpose, expected return date per item
   └── Sistem cek ketersediaan stok (availability check)

2. Approval (berdasarkan role peminjam)
   ├── Staff → Leader Divisi → Admin Logistik
   ├── Leader → Admin Logistik
   └── Admin Logistik → Super Admin

3. Admin Logistik: Assign specific assets ke items
   ├── Pilih aset fisik dari gudang (by serial/name)
   ├── Asset status: IN_STORAGE → IN_CUSTODY
   ├── Create LoanAssetAssignment records
   └── Status → APPROVED

4. Handover (serah terima)
   ├── Aset fisik diserahkan ke peminjam
   └── Status → ON_LOAN

5. Monitoring
   ├── Dashboard tracking semua pinjaman aktif
   ├── Auto flag OVERDUE jika lewat returnDate
   └── Notifikasi reminder sebelum jatuh tempo

6. Pengembalian
   ├── User submit return request (lihat Section 3)
   ├── Status → AWAITING_RETURN
   └── Proses verifikasi oleh admin
```

### 2.5 Business Rules

| Rule                 | Detail                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Max 20 items         | Batas item per loan request                                        |
| Return date wajib    | Setiap item harus punya expected return date                       |
| OVERDUE auto-flag    | Scheduler cek harian, flag loan yang lewat deadline                |
| Assignment mandatory | Approve harus disertai assign specific asset (bukan abstract item) |
| Partial return       | Bisa return sebagian item (yang lain tetap ON_LOAN)                |

---

## 3. Pengembalian Aset (Asset Return)

### 3.1 Overview

Pengembalian aset adalah proses mengembalikan aset yang dipinjam, dengan verifikasi kondisi per item oleh admin.

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

### 3.3 Status Flow

```
┌────────────────────────────────────────────────────────┐
│           ASSET RETURN STATUS FLOW                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  PENDING_APPROVAL (user submit pengembalian)            │
│       │                                                 │
│  Admin│ verifikasi per item                             │
│       ▼                                                 │
│     APPROVED (sebagian item diterima)                   │
│       │                                                 │
│  Semua│ item terverifikasi                              │
│       ▼                                                 │
│    COMPLETED                                            │
│                                                         │
│  Per Item:                                              │
│  ├── ACCEPTED → Asset status → IN_STORAGE               │
│  │              (condition disesuaikan laporan)          │
│  └── REJECTED → Asset tetap di peminjam                 │
│                 (perlu return ulang)                     │
│                                                         │
│  Jika SEMUA items returned & accepted:                  │
│  └── LoanRequest status → RETURNED                     │
└────────────────────────────────────────────────────────┘
```

### 3.4 Alur Pengembalian

```
1. Peminjam submit return
   ├── Pilih loan request yang akan dikembalikan
   ├── Pilih aset yang dikembalikan (bisa sebagian)
   ├── Isi kondisi pengembalian per item
   │   (BRAND_NEW, GOOD, USED_OKAY, MINOR_DAMAGE, dll)
   └── Tambah catatan per item

2. Admin Logistik verifikasi
   ├── Cek kondisi fisik vs laporan peminjam
   ├── Per item: ACCEPT atau REJECT
   ├── Tambah verification notes
   └── Batch verification support (proses banyak sekaligus)

3. Asset Status Update (untuk item ACCEPTED)
   ├── Condition update sesuai laporan
   ├── Status → IN_STORAGE
   ├── currentUserId/Name → null
   └── LoanAssetAssignment.returnedAt set

4. REJECTED items
   ├── Tetap on loan (asset masih di peminjam)
   └── Peminjam harus submit return ulang

5. Loan Status Update
   ├── Jika SEMUA item returned → LoanRequest → RETURNED
   └── Jika sebagian → tetap ON_LOAN / AWAITING_RETURN
```

---

## 4. Serah Terima (Handover)

### 4.1 Overview

Handover adalah proses formal serah terima aset yang melibatkan **3 pihak**: penyerah, penerima, dan saksi (mengetahui). Mendukung material split untuk MEASUREMENT assets.

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
├── targetAssetStatus: IN_USE | IN_CUSTODY
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
├── checked: Boolean (checklist saat serah terima fisik)
└── isLocked: Boolean (prevent edit after check)
```

### 4.3 Alur Handover

```
1. Buat Handover Document
   ├── Input parties:
   │   ├── Menyerahkan (siapa yang menyerahkan)
   │   ├── Penerima (siapa yang menerima)
   │   └── Mengetahui (saksi/atasan)
   ├── Input tanggal + referensi (WO/RO number)
   ├── Target Asset Status: IN_USE atau IN_CUSTODY
   └── Pilih items dari SmartAssetSelector

2. Smart Asset Selection
   ├── Hanya aset IN_STORAGE yang bisa dipilih
   ├── FIFO recommendation (aset terlama duluan)
   └── Support material MEASUREMENT split (lihat Section 5)

3. Backend Processing (dalam DB Transaction)
   ├── Validasi semua aset IN_STORAGE
   ├── Generate HO-YY-MM-XXXX doc number
   │
   ├── Untuk setiap item:
   │   ├── INDIVIDUAL asset:
   │   │   ├── Status → targetAssetStatus (IN_USE/IN_CUSTODY)
   │   │   ├── currentUserId → penerima
   │   │   └── Create StockMovement (HANDOVER)
   │   │
   │   └── MEASUREMENT asset (material bulk):
   │       ├── Jika partial (qty < balance):
   │       │   ├── Create CHILD asset (suffix "Potongan")
   │       │   ├── Child balance = qty requested
   │       │   ├── Parent balance -= qty
   │       │   └── Child status → target, parent tetap IN_STORAGE
   │       └── Jika full (qty = balance):
   │           └── Same as individual asset flow
   │
   ├── Create ActivityLog
   ├── Send notifications (WhatsApp + bell, async)
   └── Emit SSE event

4. Output
   ├── Dokumen handover tersimpan
   ├── Aset ter-assign ke penerima
   └── StockMovement tercatat per item
```

### 4.4 Business Rules

| Rule                | Detail                                                           |
| ------------------- | ---------------------------------------------------------------- |
| 3 pihak wajib       | Menyerahkan, Penerima, Mengetahui harus diisi                    |
| IN_STORAGE only     | Hanya aset dengan status IN_STORAGE yang bisa di-handover        |
| Target status       | Admin pilih IN_USE (penggunaan tetap) atau IN_CUSTODY (pinjaman) |
| Material split      | MEASUREMENT asset bisa di-split (lihat Section 5)                |
| FIFO recommendation | Sistem merekomendasikan aset terlama dulu                        |
| Checked is locked   | Item yang sudah di-check tidak bisa di-edit lagi                 |

---

## 5. Material Split Logic

### 5.1 Kapan Terjadi

Saat handover membutuhkan sebagian balance dari MEASUREMENT material. Contoh: kabel 300m, handover hanya butuh 50m.

### 5.2 Mekanisme

```
Skenario: Handover 50m kabel dari parent asset (balance: 300m)

1. PARTIAL SPLIT (qty < balance):
   ├── Create CHILD asset:
   │   ├── Nama: "{parentName} Potongan"
   │   ├── currentBalance: 50m (qty requested)
   │   ├── Status: targetAssetStatus (IN_USE/IN_CUSTODY)
   │   ├── currentUserId → penerima
   │   ├── Inherits: category, type, model, brand dari parent
   │   └── relatedAssetId → parent asset
   │
   ├── Update PARENT asset:
   │   ├── currentBalance: 300 - 50 = 250m
   │   └── Status: tetap IN_STORAGE
   │
   ├── StockMovement (parent):
   │   ├── type: HANDOVER
   │   ├── quantity: -50
   │   └── balanceAfter: 250
   │
   └── StockMovement (child):
       ├── type: HANDOVER
       ├── quantity: 50
       └── balanceAfter: 50

2. FULL TRANSFER (qty = balance):
   ├── Tidak perlu split
   ├── Parent asset langsung pindah status
   └── Same flow sebagai individual asset
```

---

## 6. Notifikasi per Workflow

### 6.1 Request Pengadaan

| Trigger               | Target Notifikasi          | Channel                 |
| --------------------- | -------------------------- | ----------------------- |
| Request dibuat        | Admin Logistik             | Bell + WhatsApp         |
| Logistic approved     | Requester + Admin Purchase | Bell + WhatsApp         |
| CEO follow-up         | Super Admin                | WhatsApp (throttle 24h) |
| Purchase updated      | Requester                  | Bell                    |
| Barang tiba (ARRIVED) | Admin Logistik + Requester | Bell + WhatsApp         |
| Rejected              | Requester (+ alasan)       | Bell + WhatsApp         |
| Completed             | Semua pihak terkait        | Bell                    |

### 6.2 Request Pinjam

| Trigger             | Target Notifikasi         | Channel         |
| ------------------- | ------------------------- | --------------- |
| Loan request dibuat | Approver (Leader/Admin)   | Bell + WhatsApp |
| Approved            | Requester                 | Bell + WhatsApp |
| Rejected            | Requester (+ alasan)      | Bell + WhatsApp |
| Overdue             | Peminjam + Admin Logistik | Bell + WhatsApp |
| Return submitted    | Admin Logistik            | Bell            |
| Return verified     | Peminjam                  | Bell            |

### 6.3 Handover

| Trigger          | Target Notifikasi     | Channel         |
| ---------------- | --------------------- | --------------- |
| Handover created | Penerima + Mengetahui | Bell + WhatsApp |

### 6.4 Channel Rules

- **Bell notification**: Selalu (in-app, real-time via SSE)
- **WhatsApp**: Fire-and-forget, non-blocking. Jangan tunggu response API WhatsApp
- **Throttle**: CEO follow-up max 1x per 24 jam per request
- **Async**: Semua notifikasi dikirim async (tidak blocking main transaction)
