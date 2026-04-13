# 03 — Daftar Pelanggan, Instalasi, Maintenance & Dismantle

> Dokumentasi lengkap alur manajemen pelanggan, instalasi aset ke pelanggan,
> maintenance/perbaikan, dan proses dismantle pada versi lama.

---

## 1. Daftar Pelanggan (Customer Management)

### 1.1 Overview

Pelanggan adalah entitas yang menerima layanan dan instalasi aset. Setiap pelanggan
memiliki riwayat instalasi, maintenance, dan dismantle yang terlacak.

### 1.2 Data Model

```
Customer
├── id: CUID (auto: CUST-XXXX via service)
├── name
├── address
├── phone, email
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

### 1.3 Status Pelanggan

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

### 1.4 Fitur Pelanggan

| Fitur                | Detail                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| **Customer Form**    | Form CRUD dengan validasi lengkap                                            |
| **Customer Detail**  | Detail dengan tabs: info, aset, riwayat, statistik                           |
| **Customer Assets**  | Aset yang sedang terpasang (IN_USE) + material terinstalasi                  |
| **Customer History** | Timeline aktivitas: instalasi, maintenance, dismantle                        |
| **Customer Stats**   | Aggregasi: jumlah instalasi, maintenance, dismantle, material, active assets |
| **Sortable Header**  | Sorting kolom pada tabel pelanggan                                           |
| **Status Filter**    | Filter berdasarkan status (ACTIVE/INACTIVE/SUSPENDED)                        |
| **Search**           | Pencarian by nama, ID, alamat                                                |
| **Pagination**       | Skip/take pagination                                                         |

### 1.5 Alur Lengkap Pelanggan

```
┌─────────────────────────────────────────────────────────────┐
│                  ALUR MANAJEMEN PELANGGAN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Tambah Pelanggan Baru                                   │
│     ├── Route: /customers/new                               │
│     ├── Input: nama, alamat, telepon, email                 │
│     ├── Service package & installation date                 │
│     ├── Status awal: INACTIVE (atau sesuai input)           │
│     └── Emit SSE event → semua client terupdate             │
│                                                              │
│  2. Lihat Detail Pelanggan                                  │
│     ├── Route: /customers/:id                               │
│     ├── Tab Info: data pelanggan + edit                     │
│     ├── Tab Aset: aset terpasang di pelanggan               │
│     ├── Tab Riwayat: timeline semua aktivitas               │
│     └── Tab Statistik: summary angka                        │
│                                                              │
│  3. Operasi Lapangan                                        │
│     ├── Instalasi: /customers/installation/new              │
│     ├── Maintenance: /customers/maintenance/new             │
│     └── Dismantle: /customers/dismantle/new                 │
│                                                              │
│  4. Status Management                                        │
│     ├── PATCH /customers/:id/status                         │
│     └── Auto-transition berdasarkan operasi lapangan        │
│                                                              │
│  5. Deletion Protection                                     │
│     ├── Jika ada riwayat transaksi → Cannot delete          │
│     └── Hanya bisa transition ke INACTIVE                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Manajemen Instalasi

### 2.1 Overview

Instalasi adalah proses pemasangan aset perangkat dan material ke lokasi pelanggan.
Melibatkan tracking aset individual (router, ONT) dan material habis pakai (kabel, konektor).

### 2.2 Data Model

```
Installation
├── id: CUID
├── docNumber: INST-YYYY-MM-XXXX
├── requestNumber? (referensi request jika ada)
├── installationDate
├── technicianId/Name → User (teknisi lapangan)
├── customerId/Name → Customer
├── notes
├── status: ItemStatus (selalu COMPLETED pada create)
├── acknowledgerId/Name? (pihak yang mengetahui)
├── createdById?
├── version: Int (OCC)
│
├── assetsInstalled[] → Asset (M2M, aset individual)
├── materialsUsed[] → InstallationMaterial (material habis pakai)
└── attachments[] → Attachment

InstallationMaterial
├── id: auto-increment
├── installationId → Installation
├── materialAssetId? → Asset (specific source asset)
├── itemName, brand
├── quantity, unit
└── Indexed by installationId
```

### 2.3 Alur Instalasi

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ALUR INSTALASI                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Buat Instalasi Baru                                             │
│     ├── Route: /customers/installation/new                          │
│     ├── Pilih pelanggan (customer)                                  │
│     ├── Pilih teknisi (dari user aktif)                             │
│     ├── Tanggal instalasi                                           │
│     └── Catatan/notes                                                │
│                                                                      │
│  2. Pilih Aset untuk Instalasi                                      │
│     ├── Aset Individual (router, ONT, switch):                      │
│     │   ├── Hanya aset status IN_STORAGE atau IN_CUSTODY            │
│     │   ├── Pilih specific unit (by serial/name)                    │
│     │   └── Akan di-assign ke pelanggan                             │
│     │                                                                │
│     └── Material Habis Pakai (kabel, konektor):                     │
│         ├── Input: itemName, brand, quantity, unit                  │
│         └── Sistem akan consume dari stok (FIFO)                    │
│                                                                      │
│  3. Backend Processing (DB Transaction)                             │
│     │                                                                │
│     ├── a. Validasi semua aset exist & valid status                 │
│     ├── b. Validasi pelanggan exist                                 │
│     ├── c. Generate INST-YYYY-MM-XXXX                               │
│     ├── d. Create Installation record (status: COMPLETED)           │
│     │                                                                │
│     ├── e. Aset Individual:                                          │
│     │   ├── Status → IN_USE                                         │
│     │   ├── currentUserId → null (assigned to customer, not user)   │
│     │   ├── currentUserName → customer name                         │
│     │   └── Create StockMovement (INSTALLATION)                     │
│     │                                                                │
│     ├── f. Material Consumption (FIFO):                              │
│     │   ├── Cari aset matching IN_STORAGE (oldest first)            │
│     │   ├── MEASUREMENT: kurangi currentBalance                     │
│     │   │   └── Jika balance = 0 → CONSUMED                        │
│     │   ├── COUNT: kurangi quantity                                 │
│     │   │   └── Jika qty = 0 → CONSUMED                            │
│     │   ├── Container unit conversion:                               │
│     │   │   └── qty × capacityPerContainer = base units             │
│     │   └── Create StockMovement per consumption                    │
│     │                                                                │
│     ├── g. Update customer status:                                   │
│     │   └── INACTIVE/PROSPECT → ACTIVE (auto-transition)            │
│     │                                                                │
│     ├── h. Create ActivityLog                                       │
│     ├── i. Send notifications (WhatsApp + bell, async)              │
│     └── j. Emit SSE event                                           │
│                                                                      │
│  4. Output                                                          │
│     ├── Dokumen instalasi tersimpan                                 │
│     ├── Aset ter-assign ke pelanggan                                │
│     ├── Stok material berkurang                                     │
│     └── Timeline riwayat pelanggan terupdate                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Material Consumption Detail

```
┌─────────────────────────────────────────────────────────────┐
│          MATERIAL CONSUMPTION LOGIC (FIFO)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dua tipe tracking material:                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ MEASUREMENT (e.g., kabel)                           │    │
│  │ ├── Track by: currentBalance (Decimal)              │    │
│  │ ├── Consume: balance -= requested qty               │    │
│  │ ├── If balance = 0 → status CONSUMED                │    │
│  │ └── Unit: meter, cm, km                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ COUNT (e.g., konektor, dusbox)                      │    │
│  │ ├── Track by: quantity (Int)                        │    │
│  │ ├── Consume: quantity -= requested qty              │    │
│  │ ├── If qty = 0 → status CONSUMED                   │    │
│  │ └── Container support:                              │    │
│  │     └── 1 box = N pcs (via capacityPerContainer)   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  FIFO Order:                                                │
│  1. Cari semua aset match (name + brand) IN_STORAGE        │
│  2. Sort by createdAt ASC (oldest first)                    │
│  3. Konsumsi dari yang terlama                              │
│  4. Jika 1 aset tidak cukup → lanjut ke aset berikutnya    │
│  5. Record per-asset consumption as StockMovement           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Manajemen Maintenance

### 3.1 Overview

Maintenance mencakup perbaikan, penggantian perangkat, dan pemeliharaan rutin
pada lokasi pelanggan. Mendukung **replacement** aset (old → new) dan **material usage**.

### 3.2 Data Model

```
Maintenance
├── id: CUID
├── docNumber: MNT-YYYY-MM-XXXX
├── requestNumber?
├── maintenanceDate
├── technicianId/Name → User
├── customerId/Name → Customer
├── problemDescription (deskripsi masalah)
├── actionsTaken (tindakan yang dilakukan)
├── workTypes[] (array tipe pekerjaan)
├── priority? (HIGH/MEDIUM/LOW)
├── status: ItemStatus
├── completedById/Name?, completionDate?
├── notes?
├── version: Int (OCC)
│
├── assets[] → Asset (M2M, aset yang di-maintain)
├── materialsUsed[] → MaintenanceMaterial
├── replacements[] → MaintenanceReplacement
└── attachments[] → Attachment

MaintenanceMaterial (sama seperti InstallationMaterial)
├── id, maintenanceId, materialAssetId?
├── itemName, brand, quantity, unit

MaintenanceReplacement
├── id: auto-increment
├── maintenanceId → Maintenance
├── oldAssetId → Asset (aset yang diganti)
├── newAssetId → Asset (aset pengganti)
└── retrievedAssetCondition: AssetCondition
```

### 3.3 Alur Maintenance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ALUR MAINTENANCE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Buat Maintenance Baru                                               │
│     ├── Route: /customers/maintenance/new                               │
│     ├── Pilih pelanggan & teknisi                                       │
│     ├── Deskripsi masalah (problemDescription)                          │
│     ├── Tindakan yang dilakukan (actionsTaken)                          │
│     ├── Tipe pekerjaan (workTypes): array multi-select                  │
│     └── Priority: HIGH / MEDIUM / LOW                                   │
│                                                                          │
│  2. Operasi Maintenance                                                 │
│     │                                                                    │
│     ├── a. REPLACEMENT (Ganti Perangkat):                               │
│     │   ├── Pilih old asset (yang rusak/diganti) — harus INDIVIDUAL     │
│     │   ├── Pilih new asset (pengganti) — dari stok IN_STORAGE          │
│     │   ├── Input kondisi old asset saat ditarik:                       │
│     │   │   ├── BRAND_NEW/GOOD/USED_OKAY → IN_STORAGE (kembali gudang) │
│     │   │   ├── MINOR_DAMAGE → UNDER_REPAIR                            │
│     │   │   ├── MAJOR_DAMAGE → DAMAGED                                  │
│     │   │   └── FOR_PARTS → DECOMMISSIONED                              │
│     │   │                                                                │
│     │   ├── Old Asset:                                                   │
│     │   │   ├── Status berubah sesuai condition mapping                  │
│     │   │   ├── currentUserName → null (ditarik dari pelanggan)         │
│     │   │   └── StockMovement: IN_RETURN                                │
│     │   │                                                                │
│     │   └── New Asset:                                                   │
│     │       ├── Status → IN_USE                                         │
│     │       ├── currentUserName → customer name                          │
│     │       └── StockMovement: INSTALLATION                              │
│     │                                                                    │
│     ├── b. MATERIAL USAGE (Penggunaan Material):                        │
│     │   └── Sama dengan logika konsumsi material di Instalasi           │
│     │       (FIFO, MEASUREMENT/COUNT, container conversion)             │
│     │                                                                    │
│     └── c. INSPECTION ONLY (Hanya Cek):                                 │
│         └── No asset movement, hanya catat problemDescription           │
│                                                                          │
│  3. Backend Processing (DB Transaction)                                 │
│     ├── Generate MNT-YYYY-MM-XXXX                                       │
│     ├── Create Maintenance (status: COMPLETED langsung)                 │
│     ├── Process replacements & material consumption                      │
│     ├── Create ActivityLog                                               │
│     ├── Send notifications (async)                                       │
│     └── Emit SSE event                                                   │
│                                                                          │
│  4. Repair Management (dari hasil maintenance)                          │
│     ├── Aset yang ditarik dengan kondisi MINOR_DAMAGE → UNDER_REPAIR    │
│     ├── Halaman /repair untuk tracking aset dalam perbaikan             │
│     └── Flow perbaikan terpisah (repair modals)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Condition → Status Mapping

```
Retrieved Condition        → New Asset Status
──────────────────────────────────────────────
BRAND_NEW                  → IN_STORAGE (Gudang)
GOOD                       → IN_STORAGE (Gudang)
USED_OKAY                  → IN_STORAGE (Gudang)
MINOR_DAMAGE               → UNDER_REPAIR
MAJOR_DAMAGE               → DAMAGED
FOR_PARTS                  → DECOMMISSIONED
```

### 3.5 Repair Tracking

Aset yang dalam status `UNDER_REPAIR` dilacak di halaman terpisah:

```
Repair Management Page (/repair)
├── Daftar aset UNDER_REPAIR
├── StartRepairModal → Mulai proses perbaikan
├── UpdateRepairModal → Update progress
├── CompleteRepairModal → Selesai perbaikan → IN_STORAGE
├── ReceiveFromRepairModal → Terima dari vendor repair
└── Repair History per asset
```

---

## 4. Data Dismantle

### 4.1 Overview

Dismantle adalah proses pencabutan/pembongkaran aset dari lokasi pelanggan.
Hanya aset berstatus `IN_USE` yang bisa di-dismantle. Memiliki workflow
PENDING → IN_PROGRESS → COMPLETED.

### 4.2 Data Model

```
Dismantle
├── id: CUID
├── docNumber: DSM-YYYY-MM-XXXX
├── requestNumber?
├── assetId → Asset (aset yang di-dismantle)
├── assetName
├── dismantleDate
├── technicianId/Name → User (teknisi)
├── customerId/Name → Customer
├── customerAddress
├── retrievedCondition: AssetCondition
├── notes?
├── acknowledgerId/Name? (pihak mengetahui)
├── status: PENDING | IN_PROGRESS | COMPLETED
├── version: Int (OCC)
└── attachments[] → Attachment
```

### 4.3 Status Flow Dismantle

```
┌─────────────────────────────────────────────────────────────┐
│                DISMANTLE STATUS FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐                                                │
│  │ PENDING │ ← Create (aset harus IN_USE)                   │
│  └────┬────┘   └── Proteksi: tidak boleh duplikat            │
│       │            (per aset, max 1 pending/in_progress)     │
│       │                                                      │
│       │ Mulai proses                                         │
│       ▼                                                      │
│  ┌─────────────┐                                             │
│  │ IN_PROGRESS │                                             │
│  └──────┬──────┘                                             │
│         │                                                    │
│         │ Complete (isi kondisi + acknowledger)               │
│         ▼                                                    │
│  ┌───────────┐                                               │
│  │ COMPLETED │                                               │
│  └───────────┘                                               │
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
│      └── If NO → customer → INACTIVE                         │
│                                                              │
│  Delete: Hanya bisa delete jika masih PENDING                │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Alur Dismantle

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ALUR DISMANTLE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Buat Dismantle Request                                          │
│     ├── Route: /customers/dismantle/new                             │
│     ├── Pilih pelanggan                                             │
│     ├── Pilih aset (harus IN_USE, milik pelanggan)                  │
│     ├── Input tanggal & teknisi                                      │
│     ├── Kondisi aset saat pencabutan                                │
│     └── Catatan                                                      │
│                                                                      │
│  2. Validasi Backend                                                │
│     ├── Aset harus exist & IN_USE                                   │
│     ├── Tidak boleh ada PENDING/IN_PROGRESS dismantle untuk aset    │
│     │   yang sama (prevent duplicate)                                │
│     └── Pelanggan harus exist                                        │
│                                                                      │
│  3. Create Dismantle (status: PENDING)                              │
│     ├── Aset masih tetap IN_USE (belum dicabut fisik)               │
│     ├── WhatsApp notification sent (fire-and-forget)                │
│     └── SSE event emitted                                            │
│                                                                      │
│  4. Complete Dismantle                                               │
│     ├── Admin/Teknisi lengkapi data:                                │
│     │   ├── Kondisi saat dicabut (retrievedCondition)               │
│     │   ├── Acknowledger (saksi)                                     │
│     │   └── Notes tambahan                                           │
│     │                                                                │
│     ├── Asset status update:                                         │
│     │   ├── GOOD/USED_OKAY → IN_STORAGE (masuk gudang)              │
│     │   └── DAMAGED conditions → DAMAGED                             │
│     │                                                                │
│     ├── Customer status check:                                       │
│     │   └── Auto INACTIVE jika no remaining assets                  │
│     │                                                                │
│     └── StockMovement: IN_RETURN                                    │
│                                                                      │
│  5. Dismantle Status Sidebar                                        │
│     └── DismantleStatusSidebar menampilkan summary + actions         │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Komponen Frontend Dismantle

| Komponen                 | Fungsi                            |
| ------------------------ | --------------------------------- |
| `DismantleForm`          | Form buat dismantle baru          |
| `DismantleEditModal`     | Edit dismantle existing           |
| `DismantleTable`         | Tabel list dismantle              |
| `DismantleStatusSidebar` | Sidebar status + aksi kontekstual |
| Attachment support       | Upload foto bukti dismantle       |

---

## 5. Relasi Antar Modul

```
┌─────────────────────────────────────────────────────────────────────────┐
│              CUSTOMER LIFECYCLE — RELASI MODUL                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Customer (INACTIVE)                                                    │
│       │                                                                  │
│       │ Instalasi pertama                                               │
│       ▼                                                                  │
│  Customer (ACTIVE) ←──── Aset terpasang (IN_USE)                        │
│       │                                                                  │
│       ├── Maintenance (berkala/on-demand)                                │
│       │   ├── Cek & perbaiki                                            │
│       │   ├── Ganti perangkat (old → gudang, new → customer)            │
│       │   └── Pakai material tambahan                                   │
│       │                                                                  │
│       └── Dismantle (pencabutan)                                        │
│           ├── Aset kembali ke gudang (IN_STORAGE)                       │
│           └── Jika semua aset dicabut → Customer INACTIVE               │
│                                                                          │
│  Asset Flow per Customer:                                               │
│  IN_STORAGE → [Instalasi] → IN_USE → [Maintenance] → IN_USE            │
│                                    → [Dismantle] → IN_STORAGE/DAMAGED   │
│                                                                          │
│  Material Flow:                                                         │
│  IN_STORAGE → [Instalasi/Maintenance] → CONSUMED (qty/balance = 0)     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### Customer

| Method   | Endpoint                        | Permission         | Deskripsi         |
| -------- | ------------------------------- | ------------------ | ----------------- |
| `POST`   | `/api/v1/customers`             | `customers:create` | Buat pelanggan    |
| `GET`    | `/api/v1/customers`             | `customers:view`   | List pelanggan    |
| `GET`    | `/api/v1/customers/:id`         | `customers:view`   | Detail            |
| `GET`    | `/api/v1/customers/:id/assets`  | `customers:view`   | Aset pelanggan    |
| `GET`    | `/api/v1/customers/:id/history` | `customers:view`   | Riwayat aktivitas |
| `GET`    | `/api/v1/customers/:id/stats`   | `customers:view`   | Statistik         |
| `PATCH`  | `/api/v1/customers/:id`         | `customers:edit`   | Update            |
| `PATCH`  | `/api/v1/customers/:id/status`  | `customers:edit`   | Ubah status       |
| `DELETE` | `/api/v1/customers/:id`         | `customers:delete` | Hapus (soft)      |

### Installation

| Method   | Endpoint                             | Permission       | Deskripsi      |
| -------- | ------------------------------------ | ---------------- | -------------- |
| `POST`   | `/api/v1/installations`              | `assets:install` | Buat instalasi |
| `GET`    | `/api/v1/installations`              | `assets:install` | List           |
| `GET`    | `/api/v1/installations/summary`      | `assets:install` | Statistik      |
| `GET`    | `/api/v1/installations/customer/:id` | `assets:install` | By customer    |
| `GET`    | `/api/v1/installations/:id`          | `assets:install` | Detail         |
| `PATCH`  | `/api/v1/installations/:id`          | `assets:install` | Update         |
| `DELETE` | `/api/v1/installations/:id`          | `assets:install` | Hapus          |

### Maintenance

| Method   | Endpoint                                       | Permission            | Deskripsi            |
| -------- | ---------------------------------------------- | --------------------- | -------------------- |
| `POST`   | `/api/v1/maintenances`                         | `maintenances:create` | Buat maintenance     |
| `GET`    | `/api/v1/maintenances`                         | `maintenances:view`   | List (filterable)    |
| `GET`    | `/api/v1/maintenances/summary`                 | `maintenances:view`   | Statistik            |
| `GET`    | `/api/v1/maintenances/repair-assets`           | `maintenances:view`   | Aset dalam perbaikan |
| `GET`    | `/api/v1/maintenances/repair-summary`          | `maintenances:view`   | Statistik repair     |
| `GET`    | `/api/v1/maintenances/repair-history/:assetId` | `maintenances:view`   | Riwayat repair aset  |
| `GET`    | `/api/v1/maintenances/customer/:id`            | `maintenances:view`   | By customer          |
| `GET`    | `/api/v1/maintenances/:id`                     | `maintenances:view`   | Detail               |
| `PATCH`  | `/api/v1/maintenances/:id`                     | `maintenances:create` | Update               |
| `PATCH`  | `/api/v1/maintenances/:id/complete`            | `maintenances:create` | Complete             |
| `DELETE` | `/api/v1/maintenances/:id`                     | `maintenances:create` | Hapus                |

### Dismantle

| Method   | Endpoint                          | Permission         | Deskripsi            |
| -------- | --------------------------------- | ------------------ | -------------------- |
| `POST`   | `/api/v1/dismantles`              | `assets:dismantle` | Buat dismantle       |
| `GET`    | `/api/v1/dismantles`              | `assets:dismantle` | List                 |
| `GET`    | `/api/v1/dismantles/summary`      | `assets:dismantle` | Statistik            |
| `GET`    | `/api/v1/dismantles/customer/:id` | `assets:dismantle` | By customer          |
| `GET`    | `/api/v1/dismantles/asset/:id`    | `assets:dismantle` | By asset             |
| `GET`    | `/api/v1/dismantles/:id`          | `assets:dismantle` | Detail               |
| `PATCH`  | `/api/v1/dismantles/:id`          | `assets:dismantle` | Update               |
| `PATCH`  | `/api/v1/dismantles/:id/complete` | `assets:dismantle` | Complete             |
| `DELETE` | `/api/v1/dismantles/:id`          | `assets:dismantle` | Hapus (PENDING only) |

---

## 7. Catatan untuk Rebuild

1. **Customer status auto-transition** — penting untuk memastikan konsistensi status
2. **Delete protection** — customer dengan history tidak boleh dihapus
3. **Material FIFO consumption** — shared logic antara Instalasi dan Maintenance, extract ke shared service
4. **Replacement tracking** — old ↔ new asset mapping penting untuk audit trail
5. **Condition → Status mapping** — rule yang ketat untuk menentukan status aset setelah ditarik
6. **Dismantle duplicate protection** — 1 aset max 1 dismantle aktif
7. **Attachment per operation** — setiap instalasi/maintenance/dismantle bisa punya foto bukti
8. **Customer remaining assets check** — setelah dismantle, cek apakah customer masih punya aset aktif
9. **Work types** pada maintenance — array multi-select, bukan single value
10. **Priority** pada maintenance — untuk sorting dan dashboard prioritas
