# Siklus Hidup Aset & Manajemen Stok — Referensi Implementasi

| Metadata        | Detail                                                             |
| --------------- | ------------------------------------------------------------------ |
| **Versi**       | 1.0                                                                |
| **Tanggal**     | 14 April 2026                                                      |
| **Status**      | ACTIVE — Referensi implementasi dari analisa versi lama            |
| **Referensi**   | PRD v3.1 (F-02, F-03), SDD v3.1, OLD_VERSION/01_PENCATATAN_ASET    |
| **Sumber Data** | Dokumentasi versi lama (OLD_VERSION) + keputusan arsitektural baru |

> **Tujuan**: Dokumen ini mendefinisikan secara detail siklus hidup aset, manajemen stok,
> stock movement tracking, threshold alerting, FIFO consumption, dan unit conversion.
> Menjadi acuan utama developer saat mengimplementasikan modul Asset & Stock.

---

## Daftar Isi

1. [Klasifikasi Aset](#1-klasifikasi-aset)
2. [Status Aset (State Machine)](#2-status-aset-state-machine)
3. [Kondisi Aset](#3-kondisi-aset)
4. [Pencatatan Aset (Asset Registration)](#4-pencatatan-aset-asset-registration)
5. [Stock Movement Tracking](#5-stock-movement-tracking)
6. [Material Consumption (FIFO)](#6-material-consumption-fifo)
7. [Unit Conversion](#7-unit-conversion)
8. [Stock Threshold & Alert](#8-stock-threshold--alert)
9. [Stock Availability Check](#9-stock-availability-check)
10. [Handover Recommendations (FIFO)](#10-handover-recommendations-fifo)
11. [Personal Assets](#11-personal-assets)
12. [ID Generation Pattern](#12-id-generation-pattern)
13. [Data Model Reference](#13-data-model-reference)

---

## 1. Klasifikasi Aset

Sistem membedakan aset ke dalam 2 klasifikasi utama dengan 3 metode tracking:

```
ItemClassification
├── ASSET     → Aset individual (router, switch, ONT, laptop)
│              → Tracking: INDIVIDUAL (per unit, serial number)
│              → Setiap unit memiliki ID unik dan tracking mandiri
│
└── MATERIAL  → Material habis pakai (kabel, konektor, dusbox)
               → Tracking: BULK
                  ├── COUNT (quantity-based, e.g., konektor per pcs)
                  └── MEASUREMENT (balance-based, e.g., kabel per meter)
```

### Perbedaan Penanganan

| Aspek             | INDIVIDUAL (Asset)            | COUNT (Material)                      | MEASUREMENT (Material)                      |
| ----------------- | ----------------------------- | ------------------------------------- | ------------------------------------------- |
| **Tracking**      | Per unit (serial/MAC address) | Per quantity (integer)                | Per balance (decimal)                       |
| **Identifikasi**  | Serial Number / MAC Address   | Nama + Brand                          | Nama + Brand                                |
| **Stok tersedia** | Count unit status IN_STORAGE  | Sum `quantity` status IN_STORAGE      | Sum `currentBalance` status IN_STORAGE      |
| **Konsumsi**      | Assign unit ke user/customer  | Kurangi `quantity`, jika 0 → CONSUMED | Kurangi `currentBalance`, jika 0 → CONSUMED |
| **QR Code**       | Per unit                      | Per batch/record                      | Per batch/record                            |
| **Split**         | N/A                           | N/A                                   | Bisa split (potong kabel → child asset)     |

---

## 2. Status Aset (State Machine)

### 2.1 Diagram Transisi

```
                 ┌─────────────────────────────────────────┐
                 │           ASSET STATUS FLOW              │
                 ├─────────────────────────────────────────┤
                 │                                          │
Registrasi ───→ IN_STORAGE ───→ IN_USE ───→ UNDER_REPAIR  │
                 │    ↑              │            │         │
                 │    │              │            ↓         │
                 │    │              │        IN_STORAGE    │
                 │    │              │            │         │
                 │    │              ↓            │         │
                 │    │         IN_CUSTODY        │         │
                 │    │              │            │         │
                 │    │              ↓            │         │
                 │    └──── Dismantle Return ─────┘         │
                 │                                          │
                 │    IN_USE ───→ DAMAGED ───→ DECOMMISSIONED
                 │                                          │
                 │    BULK: IN_STORAGE ───→ CONSUMED        │
                 │    (saat balance/qty = 0)                │
                 └─────────────────────────────────────────┘
```

### 2.2 Valid Transitions

| Status Asal      | Status Tujuan yang Valid                                            | Trigger                                     |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| `IN_STORAGE`     | IN_USE, IN_CUSTODY, UNDER_REPAIR, DAMAGED, CONSUMED, DECOMMISSIONED | Handover, Loan, Instalasi, Lapor Rusak      |
| `IN_USE`         | IN_STORAGE, IN_CUSTODY, UNDER_REPAIR, DAMAGED, DECOMMISSIONED       | Dismantle, Return, Maintenance, Lapor Rusak |
| `IN_CUSTODY`     | IN_USE, IN_STORAGE, UNDER_REPAIR, DAMAGED, DECOMMISSIONED           | Handover, Return, Lapor Rusak               |
| `UNDER_REPAIR`   | IN_STORAGE, IN_USE, DAMAGED, DECOMMISSIONED                         | Repair complete, Disposal                   |
| `DAMAGED`        | IN_STORAGE, UNDER_REPAIR, DECOMMISSIONED                            | Repair start, Disposal                      |
| `CONSUMED`       | _(terminal state — tidak bisa transisi)_                            | —                                           |
| `DECOMMISSIONED` | _(terminal state — tidak bisa transisi)_                            | —                                           |

### 2.3 Status Deskripsi

| Status           | Deskripsi                                         | Ikon |
| ---------------- | ------------------------------------------------- | ---- |
| `IN_STORAGE`     | Aset di gudang, siap digunakan                    | 📦   |
| `IN_USE`         | Aset sedang digunakan (assigned ke user/customer) | 👤   |
| `IN_CUSTODY`     | Aset dalam tanggung jawab user (pinjam)           | 🔐   |
| `UNDER_REPAIR`   | Aset dalam proses perbaikan                       | 🔧   |
| `DAMAGED`        | Aset rusak, menunggu keputusan                    | ⚠️   |
| `CONSUMED`       | Material habis (balance/qty = 0)                  | ✓    |
| `DECOMMISSIONED` | Aset dihapuskan dari inventori                    | ⊘    |

---

## 3. Kondisi Aset

```
AssetCondition
├── BRAND_NEW     → Baru (baru datang dari vendor)
├── GOOD          → Baik (berfungsi normal)
├── USED_OKAY     → Bekas layak pakai
├── MINOR_DAMAGE  → Rusak ringan (masih bisa fungsi)
├── MAJOR_DAMAGE  → Rusak berat (perlu perbaikan major)
└── FOR_PARTS     → Hanya untuk parts/cannibalized
```

### Condition → Status Mapping (saat pencabutan/pengembalian)

Saat aset ditarik dari pelanggan (dismantle) atau dikembalikan dari maintenance:

| Kondisi Saat Ditarik | Status Aset Baru | Keterangan                        |
| -------------------- | ---------------- | --------------------------------- |
| `BRAND_NEW`          | `IN_STORAGE`     | Masuk gudang (normal)             |
| `GOOD`               | `IN_STORAGE`     | Masuk gudang (normal)             |
| `USED_OKAY`          | `IN_STORAGE`     | Masuk gudang (layak pakai)        |
| `MINOR_DAMAGE`       | `UNDER_REPAIR`   | Perlu perbaikan ringan            |
| `MAJOR_DAMAGE`       | `DAMAGED`        | Perlu keputusan lanjut            |
| `FOR_PARTS`          | `DECOMMISSIONED` | Hanya berguna sebagai suku cadang |

---

## 4. Pencatatan Aset (Asset Registration)

### 4.1 Konsep Batch Registration

Aset dicatat dalam **dokumen registrasi batch** — satu dokumen bisa berisi 1 hingga banyak item.

### 4.2 Alur Pencatatan

```
1. User membuka form registrasi aset
2. Input data batch:
   - Vendor, PO Number, Invoice Number
   - Tanggal registrasi
   - Link ke Request (opsional, jika pengadaan)
3. Tambah item aset (1 atau banyak):
   - Nama, Brand, Kategori/Type/Model
   - Serial Number / MAC Address (opsional, untuk INDIVIDUAL)
   - Harga, Quantity, Satuan
   - Kondisi, Lokasi
4. Validasi:
   - Serial number harus unik (jika diisi)
   - Kategori/Type/Model harus valid
5. Backend Processing (1 DB Transaction):
   a. Generate REG-YYYY-MM-XXXX (doc number)
   b. Generate ID per item (collision-safe retry loop)
   c. Create AssetRegistration document
   d. Create Asset records (status: IN_STORAGE, condition sesuai input)
   e. Create StockMovement per item (type: NEW_STOCK)
   f. Link attachments
   g. Create ActivityLog
6. Emit SSE event → semua client auto-refresh
```

### 4.3 Fitur Khusus

| Fitur                         | Detail                                                                |
| ----------------------------- | --------------------------------------------------------------------- |
| **Batch Registration**        | 1 dokumen = banyak aset. Setiap item mendapat Asset ID unik           |
| **Smart Suggestions**         | Auto-suggest berdasarkan data sebelumnya (nama, brand, price)         |
| **Excel Import**              | Import data aset dari spreadsheet untuk bulk registration             |
| **Bulk Label**                | Cetak label QR code massal setelah registrasi                         |
| **Attachment Support**        | Upload foto/dokumen (PO, invoice, foto aset)                          |
| **Auto ID Generation**        | Format ID dengan collision detection saat concurrent insert           |
| **Request Linking**           | Registrasi bisa di-link ke Request pengadaan yang sudah approved      |
| **Purchase Master Auto-fill** | Jika AssetModel punya PurchaseMasterData, harga/vendor bisa auto-fill |

---

## 5. Stock Movement Tracking

### 5.1 Konsep

Setiap pergerakan/perubahan aset **WAJIB** menghasilkan record `StockMovement` — ini adalah **audit trail stok** yang tidak boleh dilewati.

### 5.2 Movement Types

| Type           | Trigger                        | Deskripsi                            |
| -------------- | ------------------------------ | ------------------------------------ |
| `NEW_STOCK`    | Registrasi aset baru           | Aset masuk pertama kali              |
| `HANDOVER`     | Serah terima ke user           | Aset diserahkan ke user lain         |
| `INSTALLATION` | Instalasi ke pelanggan         | Aset/material digunakan              |
| `MAINTENANCE`  | Maintenance/replacement/repair | Material digunakan atau aset diganti |
| `IN_RETURN`    | Dismantle / pengembalian       | Aset kembali ke gudang               |
| `CONSUMED`     | Material habis                 | Balance/qty = 0                      |
| `ADJUSTMENT`   | Manual adjustment              | Koreksi stok manual oleh admin       |
| `TRANSFER`     | Transfer lokasi                | Perpindahan antar gudang             |

### 5.3 Data yang Dicatat per Movement

```
StockMovement
├── assetId → Asset yang bergerak
├── assetName, assetBrand (snapshot immutable, tidak berubah jika aset di-rename)
├── movementType: enum di atas
├── quantity: jumlah yang bergerak
├── balanceAfter: sisa balance setelah movement (untuk MEASUREMENT)
├── referenceId: link ke dokumen terkait (Installation ID, Handover ID, dll)
├── actorId, actorName: siapa yang melakukan
├── notes, locationContext: keterangan tambahan
├── relatedAssetId: untuk split/merge asset
└── createdAt: timestamp
```

---

## 6. Material Consumption (FIFO)

### 6.1 Prinsip FIFO (First In, First Out)

Material dikonsumsi dengan urutan **paling lama masuk duluan**. Ini memastikan rotasi stok yang sehat.

### 6.2 Algoritma Konsumsi

```
Input: Array of { itemName, brand, quantity, unit }
Context: customerId, technician, referenceId

Untuk setiap item:
  1. Cari semua aset matching (name + brand) dengan status IN_STORAGE
  2. Sort by createdAt ASC (oldest first) — FIFO
  3. Untuk setiap asset yang ditemukan (sampai qty terpenuhi):

     MEASUREMENT (kabel, dll):
       a. remainingToConsume = requested qty
       b. Jika asset.currentBalance >= remainingToConsume:
          - asset.currentBalance -= remainingToConsume
          - Jika currentBalance = 0 → status = CONSUMED
          - Create StockMovement (quantity: remainingToConsume, balanceAfter: sisa)
          - Done untuk item ini
       c. Jika asset.currentBalance < remainingToConsume:
          - remainingToConsume -= asset.currentBalance
          - asset.currentBalance = 0, status = CONSUMED
          - Create StockMovement
          - Lanjut ke asset berikutnya

     COUNT (konektor, dll):
       a. remainingToConsume = requested qty
       b. Jika asset.quantity >= remainingToConsume:
          - asset.quantity -= remainingToConsume
          - Jika quantity = 0 → status = CONSUMED
          - Create StockMovement
          - Done
       c. Jika asset.quantity < remainingToConsume:
          - remainingToConsume -= asset.quantity
          - asset.quantity = 0, status = CONSUMED
          - Create StockMovement
          - Lanjut ke asset berikutnya

  4. Jika semua asset habis tapi qty belum terpenuhi → error: stok tidak cukup
```

---

## 7. Unit Conversion

### 7.1 Kapan Diperlukan

Saat unit yang diminta berbeda dengan unit base asset. Contoh:

- Order dalam **box**, stok dalam **pcs** → 1 box = 100 pcs (quantityPerUnit di AssetModel)
- Order dalam **roll**, stok dalam **meter** → 1 roll = 300 meter

### 7.2 Mekanisme

```
Jika unit order ≠ unit base asset:
  actualQuantity = requestedQuantity × AssetModel.quantityPerUnit

Contoh:
  Request: 2 box konektor RJ45
  AssetModel: quantityPerUnit = 100, baseUnitOfMeasure = "pcs"
  Actual consumption: 2 × 100 = 200 pcs dari stok
```

### 7.3 Container Support

```
Container-based material (dusbox, box konektor):
├── quantityPerUnit: jumlah satuan per container
├── unitOfMeasure: unit container ("box", "roll")
├── baseUnitOfMeasure: unit dasar ("pcs", "meter")
└── Conversion: qty_ordered × quantityPerUnit = base units consumed
```

---

## 8. Stock Threshold & Alert

### 8.1 Mekanisme

```
StockThreshold
├── categoryId → AssetCategory
├── itemName, brand (spesifik per item + brand)
├── minThreshold: Int (minimum stok sebelum alert)
└── createdById → User yang set threshold
```

### 8.2 Alert Flow

```
1. Trigger: Otomatis setelah konsumsi stok, atau manual oleh admin
2. Sistem hitung available stock per threshold config
3. Jika stok < minThreshold:
   a. Generate in-app notification (bell) ke Admin Logistik + Super Admin
   b. Kirim WhatsApp alert (fire-and-forget, non-blocking)
   c. Tampilkan di Dashboard widget "StockAlertWidget" (kartu merah)
4. Admin bisa set threshold secara batch (BatchThresholdModal)
```

### 8.3 Dashboard Widget

- Widget "Stok Kritis" menampilkan daftar item di bawah threshold
- Klik item → navigasi ke halaman stok dengan filter aktif
- Sortir: paling kritis (selisih terbesar) di atas

---

## 9. Stock Availability Check

### 9.1 Kapan Digunakan

- Saat logistic approval pada request pengadaan (cek apakah stok cukup)
- Saat membuat handover (validasi ketersediaan)
- Saat membuat instalasi/maintenance (validasi material)

### 9.2 Algoritma

```
Input: Array of { itemName, brand, qty, unit }

Untuk setiap item:
  1. Cari aset matching (name + brand) status IN_STORAGE
  2. Hitung available stock:
     - INDIVIDUAL: count unit IN_STORAGE
     - COUNT: sum(quantity) dari record IN_STORAGE
     - MEASUREMENT: sum(currentBalance) dari record IN_STORAGE
  3. Unit conversion jika perlu (lihat Section 7)
  4. Return per item: { available, requested, shortage }

Output: {
  items: [{ itemName, brand, available, requested, shortage, sufficient }],
  hasShortage: boolean,
  summary: string
}
```

---

## 10. Handover Recommendations (FIFO)

Saat akan melakukan serah terima, sistem merekomendasikan aset berdasarkan:

1. **FIFO** — Aset yang lebih dulu masuk ke gudang diprioritaskan (createdAt ASC)
2. **Highest balance** — Untuk MEASUREMENT material, pilih yang stok terbanyak
3. **Status filter** — Hanya aset dengan status `IN_STORAGE` yang direkomendasikan

---

## 11. Personal Assets

### 11.1 Endpoint & View

| Endpoint              | Deskripsi                     | Role       |
| --------------------- | ----------------------------- | ---------- |
| `/stock/personal`     | Aset yang di-assign ke user   | Semua user |
| `/stock/role-summary` | Summary berdasarkan role user | Semua user |

### 11.2 Grouping

```
Personal Assets grouped by assignment type:
├── IN_USE     → Aset yang sedang digunakan user
├── IN_CUSTODY → Aset dalam tanggung jawab user (dipinjam)
└── ON_LOAN    → Aset yang dipinjam via loan request
```

### 11.3 Visibility per Role

| Role                | Bisa Lihat                               |
| ------------------- | ---------------------------------------- |
| SUPER_ADMIN / ADMIN | Semua aset semua user                    |
| LEADER              | Aset pribadi + aset anggota divisi       |
| STAFF / TEKNISI     | Hanya aset pribadi + aset divisi sendiri |

---

## 12. ID Generation Pattern

Semua dokumen menggunakan format ID dengan prefix + tanggal:

| Entitas            | Format              | Contoh            |
| ------------------ | ------------------- | ----------------- |
| Asset Registration | `REG-YYYY-MM-XXXX`  | REG-2026-04-0001  |
| Asset Item         | Auto CUID           | cm5x_abc123       |
| Request            | `RO-YYYY-MMDD-XXXX` | RO-2026-0414-0001 |
| Loan Request       | `RL-YY-MM-XXXX`     | RL-26-04-0001     |
| Asset Return       | `RTN-YY-MM-XXXX`    | RTN-26-04-0001    |
| Handover           | `HO-YY-MM-XXXX`     | HO-26-04-0001     |
| Installation       | `INST-YYYY-MM-XXXX` | INST-2026-04-0001 |
| Maintenance        | `MNT-YYYY-MM-XXXX`  | MNT-2026-04-0001  |
| Dismantle          | `DSM-YYYY-MM-XXXX`  | DSM-2026-04-0001  |
| Customer           | `CUST-XXXX`         | CUST-0001         |

### Collision-Safe Generation

```
ID generation menggunakan retry loop untuk concurrent insert:
1. Query last doc number for current period
2. Increment counter
3. Try insert
4. If unique constraint violation → retry with next number
5. Max retry: 5 attempts
```

---

## 13. Data Model Reference

### 13.1 AssetRegistration (Dokumen Batch)

```
AssetRegistration
├── id: REG-YYYY-MM-XXXX (auto-generated)
├── registrationDate
├── recordedById → User
├── poNumber, invoiceNumber, vendor (referensi pembelian)
├── requestId → Request? (link ke pengadaan jika ada)
├── totalItems, totalValue
├── notes
├── attachments[] → Attachment
└── assets[] → Asset (1-to-many)
```

### 13.2 Asset (Item Individual)

```
Asset
├── id: CUID (auto-generated)
├── registrationId → AssetRegistration
├── name, brand
├── categoryId → AssetCategory
├── typeId → AssetType?
├── modelId → AssetModel?
├── serialNumber?, macAddress? (identifier unik)
├── purchasePrice, vendor, poNumber, invoiceNumber, purchaseDate
├── warrantyEndDate, warrantyPeriodMonths
├── depreciationMethod?, usefulLifeYears?, salvageValue?
├── status: AssetStatus (IN_STORAGE default)
├── condition: AssetCondition
├── location, locationDetail
├── currentUserId?, currentUserName?
├── initialBalance?, currentBalance? (untuk material bulk)
├── quantity? (default 1, untuk item count)
├── version: Int (OCC - Optimistic Concurrency Control)
└── stockMovements[] → StockMovement
```

### 13.3 StockMovement

```
StockMovement
├── id: auto-increment
├── assetId → Asset
├── assetName, assetBrand (immutable snapshot)
├── movementType: MovementType enum
├── quantity
├── balanceAfter?
├── referenceId? (link ke dokumen terkait)
├── actorId, actorName
├── notes?, locationContext?
├── relatedAssetId? (untuk split/merge)
└── createdAt
```

### 13.4 StockThreshold

```
StockThreshold
├── id
├── categoryId → AssetCategory
├── itemName, brand
├── minThreshold: Int
├── createdById → User
└── timestamps
```

---

## Catatan Implementasi Rebuild

1. **OCC (version field)** wajib pada setiap entity utama — mencegah race condition concurrent update
2. **Stock movement WAJIB** dibuat untuk setiap pergerakan aset — ini audit trail
3. **Serial number** harus unique globally (bukan per type/model)
4. **FIFO** adalah default algorithm untuk material consumption
5. **Unit conversion** penting — pastikan AssetModel.quantityPerUnit terisi untuk container materials
6. **SSE events** di-emit setelah setiap mutasi stok untuk real-time sync
7. **WhatsApp notification** fire-and-forget (non-blocking, jangan tunggu response)
8. **QR Code** mendukung scan by ID, serial number, dan MAC address
