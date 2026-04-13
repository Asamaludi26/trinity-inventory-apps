# Operasi Pelanggan — Referensi Implementasi

| Metadata        | Detail                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| **Versi**       | 1.0                                                                                 |
| **Tanggal**     | 14 April 2026                                                                       |
| **Status**      | ACTIVE — Referensi implementasi dari analisa versi lama                             |
| **Referensi**   | PRD v3.1 (F-05), SDD v3.1, OLD_VERSION/03_PELANGGAN_INSTALASI_MAINTENANCE_DISMANTLE |
| **Sumber Data** | Dokumentasi versi lama (OLD_VERSION) + keputusan arsitektural baru                  |

> **Tujuan**: Dokumen ini mendefinisikan secara detail alur manajemen pelanggan,
> instalasi aset, maintenance/perbaikan, dan proses dismantle.
> Menjadi acuan utama developer saat mengimplementasikan modul Customer Operations.

---

## Daftar Isi

1. [Manajemen Pelanggan (Customer)](#1-manajemen-pelanggan-customer)
2. [Instalasi](#2-instalasi)
3. [Maintenance](#3-maintenance)
4. [Dismantle](#4-dismantle)
5. [Repair Tracking](#5-repair-tracking)
6. [Data Model Reference](#6-data-model-reference)

---

## 1. Manajemen Pelanggan (Customer)

### 1.1 Overview

Pelanggan adalah entitas yang menerima layanan dan instalasi aset. Setiap pelanggan memiliki riwayat instalasi, maintenance, dan dismantle yang terlacak.

### 1.2 Status Pelanggan (Auto-Transition)

```
┌─────────────────────────────────────────────────────────────┐
│                 CUSTOMER STATUS FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  Instalasi pertama  ┌─────────┐              │
│  │ INACTIVE │────────────────────→│ ACTIVE  │              │
│  └────▲─────┘                     └────┬────┘              │
│       │                                │                    │
│       │  Semua aset di-dismantle       │ Suspend manual     │
│       │  (no remaining IN_USE assets)  │                    │
│       │                                ▼                    │
│       │                          ┌───────────┐             │
│       └──────────────────────────│ SUSPENDED │             │
│                                  └───────────┘             │
│                                                              │
│  Aturan otomatis:                                           │
│  - Instalasi → customer otomatis ACTIVE (jika INACTIVE)    │
│  - Dismantle complete + no remaining assets → INACTIVE      │
│  - Tidak bisa DELETE jika ada transaction history            │
│    → harus INACTIVE-kan saja                                │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Fitur Customer

| Fitur                   | Detail                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Customer Form**       | CRUD dengan validasi lengkap (nama, alamat, telepon, email, service package) |
| **Customer Detail**     | Detail dengan tabs: Info, Aset Terpasang, Riwayat Aktivitas, Statistik       |
| **Customer Assets**     | Aset yang sedang terpasang (IN_USE) + material terinstalasi                  |
| **Customer History**    | Timeline kronologis: instalasi, maintenance, dismantle                       |
| **Customer Stats**      | Aggregasi: jumlah instalasi, maintenance, dismantle, aset aktif              |
| **Status Filter**       | Filter berdasarkan status (ACTIVE / INACTIVE / SUSPENDED)                    |
| **Deletion Protection** | Tidak bisa delete jika ada riwayat transaksi → hanya soft-delete             |

### 1.4 Alur Manajemen Customer

```
1. Tambah Pelanggan Baru
   ├── Input: nama, alamat, telepon, email
   ├── Service package & installation date
   ├── Status awal: INACTIVE (default)
   └── Emit SSE event → semua client terupdate

2. Lihat Detail Pelanggan (/customers/:id)
   ├── Tab Info: data pelanggan + edit
   ├── Tab Aset: aset terpasang di pelanggan
   ├── Tab Riwayat: timeline semua aktivitas
   └── Tab Statistik: summary angka

3. Operasi Lapangan (trigger auto-transition)
   ├── Instalasi → customer ACTIVE
   ├── Maintenance → no status change
   └── Dismantle → cek remaining assets → INACTIVE jika 0

4. Deletion Protection
   ├── Jika ada riwayat transaksi → Cannot delete (HTTP 422)
   └── Admin harus transition ke INACTIVE
```

---

## 2. Instalasi

### 2.1 Overview

Instalasi adalah proses pemasangan aset perangkat dan material ke lokasi pelanggan. Melibatkan tracking aset individual (router, ONT) dan material habis pakai (kabel, konektor).

### 2.2 Alur Instalasi

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ALUR INSTALASI                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Buat Instalasi Baru                                             │
│     ├── Pilih pelanggan (customer)                                  │
│     ├── Pilih teknisi (dari user aktif dengan canDoFieldwork)       │
│     ├── Tanggal instalasi + catatan                                 │
│     └── Request number (opsional, link ke Request jika ada)         │
│                                                                      │
│  2. Pilih Aset untuk Instalasi                                      │
│     ├── Aset Individual (router, ONT, switch):                      │
│     │   ├── Hanya aset status IN_STORAGE atau IN_CUSTODY            │
│     │   ├── Pilih specific unit (by serial/name)                    │
│     │   └── Akan di-assign ke pelanggan                             │
│     │                                                                │
│     └── Material Habis Pakai (kabel, konektor):                     │
│         ├── Input: itemName, brand, quantity, unit                  │
│         └── Sistem consume dari stok via FIFO algorithm             │
│                                                                      │
│  3. Backend Processing (1 DB Transaction)                           │
│     ├── a. Validasi aset exist & valid status                       │
│     ├── b. Validasi pelanggan exist                                 │
│     ├── c. Generate INST-YYYY-MM-XXXX                               │
│     ├── d. Create Installation record (status: COMPLETED)           │
│     │                                                                │
│     ├── e. Aset Individual:                                          │
│     │   ├── Status → IN_USE                                         │
│     │   ├── currentUserId → null (bukan user, tapi customer)        │
│     │   ├── currentUserName → customer name                         │
│     │   └── Create StockMovement (INSTALLATION)                     │
│     │                                                                │
│     ├── f. Material Consumption (FIFO):                              │
│     │   ├── Cari aset matching IN_STORAGE (oldest first)            │
│     │   ├── MEASUREMENT: kurangi currentBalance                     │
│     │   │   └── Jika balance = 0 → CONSUMED                        │
│     │   ├── COUNT: kurangi quantity                                 │
│     │   │   └── Jika qty = 0 → CONSUMED                            │
│     │   ├── Container unit conversion (jika applicable):             │
│     │   │   └── qty × capacityPerContainer = base units             │
│     │   └── Create StockMovement per consumption                    │
│     │                                                                │
│     ├── g. Update customer status:                                   │
│     │   └── INACTIVE → ACTIVE (auto-transition)                      │
│     │                                                                │
│     ├── h. Create ActivityLog                                       │
│     ├── i. Send notifications (WhatsApp + bell, async)              │
│     └── j. Emit SSE event                                           │
│                                                                      │
│  4. Output                                                          │
│     ├── Dokumen instalasi tersimpan                                 │
│     ├── Aset ter-assign ke pelanggan                                │
│     ├── Stok material berkurang (FIFO)                              │
│     └── Timeline riwayat pelanggan terupdate                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Business Rules Instalasi

| Rule                      | Detail                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Status COMPLETED langsung | Instalasi langsung COMPLETED saat create (tidak ada approval flow) |
| FIFO material             | Material habis pakai dikonsumsi dengan FIFO algorithm              |
| Auto-activate customer    | Customer INACTIVE → ACTIVE otomatis saat instalasi pertama         |
| Teknisi wajib             | Harus assign teknisi dari divisi yang canDoFieldwork               |
| Mixed items               | 1 instalasi bisa mix aset individual + material bulk               |
| Unit conversion           | Support container unit conversion (box → pcs, roll → meter)        |

---

## 3. Maintenance

### 3.1 Overview

Maintenance mencakup perbaikan, penggantian perangkat (replacement), dan pemeliharaan rutin pada lokasi pelanggan. Mendukung 3 jenis operasi: **replacement**, **material usage**, dan **inspection only**.

### 3.2 Alur Maintenance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ALUR MAINTENANCE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Buat Maintenance Baru                                               │
│     ├── Pilih pelanggan & teknisi                                       │
│     ├── problemDescription (deskripsi masalah)                          │
│     ├── actionsTaken (tindakan yang dilakukan)                          │
│     ├── workTypes[]: array multi-select tipe pekerjaan                  │
│     └── priority: HIGH / MEDIUM / LOW                                   │
│                                                                          │
│  2. Operasi Maintenance (3 tipe)                                        │
│     │                                                                    │
│     ├── a. REPLACEMENT (Ganti Perangkat):                               │
│     │   ├── Pilih old asset (yang akan diganti) — harus INDIVIDUAL      │
│     │   ├── Pilih new asset (pengganti) — dari stok IN_STORAGE          │
│     │   ├── Input kondisi old asset saat ditarik                        │
│     │   │                                                                │
│     │   ├── Old Asset Processing:                                        │
│     │   │   ├── Condition → Status mapping (lihat tabel di bawah)       │
│     │   │   ├── currentUserName → null (ditarik dari pelanggan)         │
│     │   │   └── StockMovement: IN_RETURN                                │
│     │   │                                                                │
│     │   └── New Asset Processing:                                        │
│     │       ├── Status → IN_USE                                         │
│     │       ├── currentUserName → customer name                          │
│     │       └── StockMovement: INSTALLATION                              │
│     │                                                                    │
│     ├── b. MATERIAL USAGE (Penggunaan Material):                        │
│     │   └── Sama dengan logika FIFO consumption di Instalasi:           │
│     │       ├── MEASUREMENT: kurangi currentBalance                     │
│     │       ├── COUNT: kurangi quantity                                  │
│     │       └── Create StockMovement per consumption                    │
│     │                                                                    │
│     └── c. INSPECTION ONLY (Hanya Cek):                                 │
│         └── No asset movement — hanya catat problem + actions           │
│                                                                          │
│  3. Backend Processing (1 DB Transaction)                               │
│     ├── Generate MNT-YYYY-MM-XXXX                                       │
│     ├── Create Maintenance (status: COMPLETED langsung)                 │
│     ├── Process replacements + material consumption                      │
│     ├── Create ActivityLog                                               │
│     ├── Send notifications (async)                                       │
│     └── Emit SSE event                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Condition → Status Mapping (Retrieved Asset)

Saat aset ditarik dari pelanggan selama maintenance (replacement):

| Kondisi saat ditarik | Status baru asset | Keterangan                          |
| -------------------- | ----------------- | ----------------------------------- |
| `BRAND_NEW`          | `IN_STORAGE`      | Masuk gudang (kasus langka)         |
| `GOOD`               | `IN_STORAGE`      | Masuk gudang, layak pakai           |
| `USED_OKAY`          | `IN_STORAGE`      | Masuk gudang, masih bisa digunakan  |
| `MINOR_DAMAGE`       | `UNDER_REPAIR`    | Perlu perbaikan → Repair Tracking   |
| `MAJOR_DAMAGE`       | `DAMAGED`         | Rusak berat, perlu keputusan lanjut |
| `FOR_PARTS`          | `DECOMMISSIONED`  | Hanya bisa jadi suku cadang         |

### 3.4 Business Rules Maintenance

| Rule                         | Detail                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| Status COMPLETED langsung    | Maintenance langsung COMPLETED saat create                  |
| Replacement old = INDIVIDUAL | Hanya aset individual yang bisa di-replace (bukan material) |
| Replacement new = IN_STORAGE | Aset pengganti harus dari stok gudang                       |
| Multi-replacement            | 1 maintenance bisa punya banyak replacement                 |
| Mixed operations             | 1 maintenance bisa replacement + material usage sekaligus   |
| Repair trigger               | Aset ditarik dengan MINOR_DAMAGE → masuk Repair Tracking    |
| Priority tracking            | HIGH/MEDIUM/LOW untuk sorting dan dashboard                 |

---

## 4. Dismantle

### 4.1 Overview

Dismantle adalah proses pencabutan/pembongkaran aset dari lokasi pelanggan. Memiliki workflow **PENDING → IN_PROGRESS → COMPLETED** (tidak langsung selesai seperti instalasi/maintenance).

### 4.2 Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                DISMANTLE STATUS FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Create ──→ PENDING (aset harus IN_USE)                     │
│                ├── Proteksi: tidak boleh duplikat per aset   │
│                │   (max 1 PENDING/IN_PROGRESS per aset)      │
│                │                                              │
│                │ Mulai proses                                 │
│                ▼                                              │
│           IN_PROGRESS                                        │
│                │                                              │
│                │ Complete (isi kondisi + acknowledger)        │
│                ▼                                              │
│            COMPLETED                                         │
│                                                              │
│  Pada COMPLETED:                                             │
│  ├── Asset updates:                                          │
│  │   ├── isDismantled → true                                 │
│  │   ├── currentUserId/Name → null                           │
│  │   ├── Condition-based status:                             │
│  │   │   ├── GOOD/USED_OKAY → IN_STORAGE                    │
│  │   │   └── MAJOR_DAMAGE/FOR_PARTS → DAMAGED               │
│  │   └── StockMovement: IN_RETURN                            │
│  │                                                           │
│  └── Customer status check:                                  │
│      ├── Cek remaining IN_USE assets for customer            │
│      ├── If YES → customer stays ACTIVE                      │
│      └── If NO → customer → INACTIVE (auto-transition)       │
│                                                              │
│  Delete: Hanya bisa delete jika masih PENDING                │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Alur Dismantle

```
1. Buat Dismantle Request
   ├── Pilih pelanggan
   ├── Pilih aset (harus IN_USE, milik pelanggan)
   ├── Input tanggal & teknisi
   ├── Kondisi aset saat pencabutan (opsional awal)
   └── Catatan

2. Validasi Backend
   ├── Aset harus exist & IN_USE
   ├── Tidak boleh ada PENDING/IN_PROGRESS dismantle untuk aset yang sama
   │   (prevent duplicate dismantle)
   └── Pelanggan harus exist

3. Create Dismantle (status: PENDING)
   ├── Aset masih tetap IN_USE (belum dicabut fisik)
   ├── WhatsApp notification sent (async)
   └── SSE event emitted

4. Transition ke IN_PROGRESS
   └── Admin/Teknisi mulai proses pembongkaran

5. Complete Dismantle
   ├── Admin/Teknisi lengkapi data:
   │   ├── Kondisi saat dicabut (retrievedCondition) — WAJIB
   │   ├── Acknowledger / saksi — opsional
   │   └── Notes tambahan
   │
   ├── Asset status update:
   │   ├── GOOD/USED_OKAY → IN_STORAGE (masuk gudang)
   │   ├── MINOR_DAMAGE → UNDER_REPAIR
   │   ├── MAJOR_DAMAGE → DAMAGED
   │   └── FOR_PARTS → DECOMMISSIONED
   │
   ├── Asset field updates:
   │   ├── isDismantled = true
   │   ├── currentUserId = null
   │   ├── currentUserName = null
   │   └── condition = retrievedCondition
   │
   ├── StockMovement: IN_RETURN
   │
   └── Customer status check:
       ├── Count remaining IN_USE assets for customer
       └── If 0 → customer INACTIVE (auto)

6. Delete Dismantle
   └── HANYA bisa delete jika status masih PENDING
```

### 4.4 Business Rules Dismantle

| Rule                          | Detail                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| IN_USE only                   | Hanya aset IN_USE yang bisa di-dismantle                      |
| No duplicate                  | Max 1 PENDING/IN_PROGRESS dismantle per aset                  |
| 3-step workflow               | PENDING → IN_PROGRESS → COMPLETED (bukan langsung selesai)    |
| Delete only PENDING           | Hanya bisa delete jika masih PENDING                          |
| Auto customer INACTIVE        | Customer otomatis INACTIVE jika semua aset sudah di-dismantle |
| Condition wajib saat complete | Harus isi retrievedCondition saat complete                    |

---

## 5. Repair Tracking

### 5.1 Overview

Aset yang ditarik dengan kondisi `MINOR_DAMAGE` (dari maintenance/dismantle) masuk ke status `UNDER_REPAIR` dan dilacak di halaman Repair Management.

### 5.2 Repair Flow

```
Aset masuk UNDER_REPAIR (dari maintenance/dismantle)
    │
    ├── StartRepairModal → Mulai proses perbaikan
    │   └── Input: technician, estimated completion, notes
    │
    ├── UpdateRepairModal → Update progress perbaikan
    │   └── Input: progress notes, estimated completion update
    │
    ├── CompleteRepairModal → Selesai perbaikan
    │   ├── Status → IN_STORAGE (kembali ke gudang)
    │   └── Condition → GOOD / USED_OKAY
    │
    ├── ReceiveFromRepairModal → Terima dari vendor repair (external)
    │   └── Input: vendor name, cost, completion date
    │
    └── Repair History per asset
        └── Timeline semua repair activities
```

### 5.3 Repair States

| Dari           | Ke               | Trigger                        |
| -------------- | ---------------- | ------------------------------ |
| `UNDER_REPAIR` | `IN_STORAGE`     | Repair complete (kondisi baik) |
| `UNDER_REPAIR` | `DAMAGED`        | Repair gagal / tidak ekonomis  |
| `UNDER_REPAIR` | `DECOMMISSIONED` | Disposal / write-off           |
| `DAMAGED`      | `UNDER_REPAIR`   | Keputusan repair               |
| `DAMAGED`      | `DECOMMISSIONED` | Disposal                       |

---

## 6. Data Model Reference

### 6.1 Customer

```
Customer
├── id: CUID (auto: CUST-XXXX via service)
├── name, address, phone, email
├── status: ACTIVE | INACTIVE | SUSPENDED
├── installationDate
├── servicePackage
├── notes?
├── version: Int (OCC)
│
├── installations[] → Installation
├── maintenances[] → Maintenance
├── dismantles[] → Dismantle
├── attachments[] → Attachment
└── activityLogs[] → ActivityLog
```

### 6.2 Installation

```
Installation
├── id: CUID
├── docNumber: INST-YYYY-MM-XXXX
├── requestNumber? (referensi request jika ada)
├── installationDate
├── technicianId/Name → User
├── customerId/Name → Customer
├── notes, status: COMPLETED
├── acknowledgerId/Name?
├── createdById?
├── version: Int (OCC)
│
├── assetsInstalled[] → Asset (M2M, aset individual)
├── materialsUsed[] → InstallationMaterial
└── attachments[] → Attachment

InstallationMaterial
├── id: auto-increment
├── installationId → Installation
├── materialAssetId? → Asset (source asset)
├── itemName, brand, quantity, unit
└── Indexed by installationId
```

### 6.3 Maintenance

```
Maintenance
├── id: CUID
├── docNumber: MNT-YYYY-MM-XXXX
├── requestNumber?
├── maintenanceDate
├── technicianId/Name → User
├── customerId/Name → Customer
├── problemDescription, actionsTaken
├── workTypes[] (array tipe pekerjaan)
├── priority?: HIGH | MEDIUM | LOW
├── status: COMPLETED
├── completedById/Name?, completionDate?
├── notes?
├── version: Int (OCC)
│
├── assets[] → Asset (M2M, aset yang di-maintain)
├── materialsUsed[] → MaintenanceMaterial
├── replacements[] → MaintenanceReplacement
└── attachments[] → Attachment

MaintenanceReplacement
├── id: auto-increment
├── maintenanceId → Maintenance
├── oldAssetId → Asset (yang diganti)
├── newAssetId → Asset (pengganti)
└── retrievedAssetCondition: AssetCondition
```

### 6.4 Dismantle

```
Dismantle
├── id: CUID
├── docNumber: DSM-YYYY-MM-XXXX
├── requestNumber?
├── assetId → Asset (aset yang di-dismantle)
├── assetName
├── dismantleDate
├── technicianId/Name → User
├── customerId/Name → Customer
├── customerAddress
├── retrievedCondition: AssetCondition
├── notes?
├── acknowledgerId/Name?
├── status: PENDING | IN_PROGRESS | COMPLETED
├── version: Int (OCC)
└── attachments[] → Attachment
```
