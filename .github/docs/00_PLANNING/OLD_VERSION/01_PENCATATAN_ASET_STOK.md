# 01 — Pencatatan Aset & Stok Aset

> Dokumentasi lengkap alur pencatatan aset masuk (registrasi), manajemen stok,
> stock movement tracking, dan threshold alerting pada versi lama.

---

## 1. Pencatatan Aset (Asset Registration)

### 1.1 Overview

Pencatatan aset adalah proses memasukkan aset baru ke sistem inventory. Aset dicatat dalam
**dokumen registrasi batch** — satu dokumen bisa berisi 1 hingga banyak item aset sekaligus.

### 1.2 Data Model

```
AssetRegistration (Dokumen Batch)
├── id: REG-YYYY-MM-XXXX (auto-generated)
├── registrationDate
├── recordedById → User
├── poNumber, invoiceNumber, vendor (referensi pembelian)
├── requestId → Request? (link ke pengadaan jika ada)
├── totalItems, totalValue
├── notes
├── attachments[] → Attachment
└── assets[] → Asset (1-to-many)

Asset (Item Individual)
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
├── version: Int (OCC)
└── stockMovements[] → StockMovement
```

### 1.3 Alur Pencatatan Aset

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALUR PENCATATAN ASET                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────────┐                   │
│  │ User membuka │───→│ Form Registrasi Aset │                   │
│  │ /assets/new  │    │ (RegistrationForm)   │                   │
│  └──────────────┘    └──────────┬───────────┘                   │
│                                 │                                │
│                    ┌────────────▼────────────┐                   │
│                    │ Input data batch:       │                   │
│                    │ - Vendor, PO, Invoice   │                   │
│                    │ - Tanggal registrasi    │                   │
│                    │ - Request link (opsional)│                  │
│                    └────────────┬────────────┘                   │
│                                 │                                │
│                    ┌────────────▼────────────┐                   │
│                    │ Tambah item aset:       │                   │
│                    │ - Nama, Brand, Kategori │                   │
│                    │ - Type, Model           │                   │
│                    │ - Serial/MAC (opsional) │                   │
│                    │ - Harga, Qty, Satuan    │                   │
│                    │ - Kondisi, Lokasi       │                   │
│                    │ Bisa 1 atau banyak item │                   │
│                    └────────────┬────────────┘                   │
│                                 │                                │
│                    ┌────────────▼────────────┐                   │
│                    │ Validasi:               │                   │
│                    │ - Serial number unik?   │                   │
│                    │ - Kategori/Type valid?  │                   │
│                    └────────────┬────────────┘                   │
│                                 │                                │
│                    ┌────────────▼────────────┐                   │
│                    │ Backend Process         │                   │
│                    │ (dalam 1 DB Transaction)│                   │
│                    │                         │                   │
│                    │ 1. Generate REG-ID      │                   │
│                    │ 2. Generate AST-ID tiap │                   │
│                    │    item (collision-safe) │                   │
│                    │ 3. Create Registration   │                  │
│                    │    document              │                  │
│                    │ 4. Create Asset records  │                   │
│                    │    (status: IN_STORAGE)  │                   │
│                    │ 5. Create StockMovement  │                  │
│                    │    (type: NEW_STOCK)     │                   │
│                    │ 6. Link attachments     │                   │
│                    │ 7. Create ActivityLog   │                   │
│                    └────────────┬────────────┘                   │
│                                 │                                │
│                    ┌────────────▼────────────┐                   │
│                    │ Emit SSE event          │                   │
│                    │ → Frontend auto-refresh │                   │
│                    └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Fitur Khusus Pencatatan

| Fitur                         | Detail                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **Batch Registration**        | 1 dokumen = banyak aset. Setiap item mendapat Asset ID unik                   |
| **Smart Suggestions**         | Hook `useSmartSuggestions` memberikan saran otomatis berdasar data sebelumnya |
| **Excel Import**              | Modal `ExcelImportModal` untuk import data aset dari spreadsheet              |
| **Bulk Label**                | Modal `BulkLabelModal` untuk cetak label massal setelah registrasi            |
| **Attachment Support**        | Upload foto/dokumen terkait (PO, invoice, foto aset)                          |
| **Auto ID Generation**        | Format `AST-YYYY-XXXX` dengan collision detection saat concurrent insert      |
| **Request Linking**           | Registrasi bisa di-link ke Request pengadaan yang sudah approved              |
| **Purchase Master Auto-fill** | Jika AssetModel punya PurchaseMasterData, harga/vendor bisa auto-fill         |

### 1.5 Klasifikasi Aset

Sistem membedakan aset ke dalam 2 klasifikasi utama:

```
ItemClassification
├── ASSET     → Aset individual (router, switch, ONT)
│              → Tracking: INDIVIDUAL (per unit, serial number)
│
└── MATERIAL  → Material habis pakai (kabel, konektor)
                → Tracking: BULK
                   ├── COUNT (quantity-based, e.g., konektor)
                   └── MEASUREMENT (balance-based, e.g., kabel per meter)
```

### 1.6 Status Aset (State Machine)

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

Valid Transitions (dari service):
  IN_STORAGE    → IN_USE, IN_CUSTODY, UNDER_REPAIR, DAMAGED, CONSUMED, DECOMMISSIONED
  IN_USE        → IN_STORAGE, IN_CUSTODY, UNDER_REPAIR, DAMAGED, DECOMMISSIONED
  IN_CUSTODY    → IN_USE, IN_STORAGE, UNDER_REPAIR, DAMAGED, DECOMMISSIONED
  UNDER_REPAIR  → IN_STORAGE, IN_USE, DAMAGED, DECOMMISSIONED
  DAMAGED       → IN_STORAGE, UNDER_REPAIR, DECOMMISSIONED
  CONSUMED      → (terminal state, no transition)
  DECOMMISSIONED→ (terminal state, no transition)
```

### 1.7 Kondisi Aset

```
AssetCondition
├── BRAND_NEW     → Baru (baru datang dari vendor)
├── GOOD          → Baik (berfungsi normal)
├── USED_OKAY     → Bekas layak pakai
├── MINOR_DAMAGE  → Rusak ringan (masih bisa fungsi)
├── MAJOR_DAMAGE  → Rusak berat (perlu perbaikan major)
└── FOR_PARTS     → Hanya untuk parts/cannibalized
```

---

## 2. Stok Aset (Stock Management)

### 2.1 Overview

Stok aset menampilkan keseluruhan inventory dengan tracking pergerakan stok,
alert threshold, dan dashboard summary.

### 2.2 Halaman Stok (StockOverviewPage)

**Route**: `/stock`
**Permission**: `assets:view`

| Komponen                | Fungsi                                                  |
| ----------------------- | ------------------------------------------------------- |
| `StockTable`            | Tabel utama menampilkan semua aset dengan filter & sort |
| `StockSummaryDashboard` | Dashboard ringkasan stok per kategori/status            |
| `StockHistoryModal`     | Riwayat pergerakan stok per aset                        |
| `StockExportButtons`    | Export data stok ke Excel/PDF                           |
| `ReportDamageModal`     | Laporkan kerusakan aset dari halaman stok               |
| `BatchThresholdModal`   | Set threshold minimum stok secara batch                 |
| `RepairModals`          | Start/Complete/Decommission repair dari stok            |

### 2.3 Stock Movement Tracking

Setiap perubahan pada aset menghasilkan record `StockMovement`:

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

**Movement Types**:

| Type           | Trigger                | Deskripsi                          |
| -------------- | ---------------------- | ---------------------------------- |
| `NEW_STOCK`    | Registrasi aset baru   | Aset masuk pertama kali            |
| `HANDOVER`     | Serah terima           | Aset diserahkan ke user lain       |
| `INSTALLATION` | Instalasi ke pelanggan | Material digunakan untuk instalasi |
| `MAINTENANCE`  | Maintenance/repair     | Material digunakan untuk perbaikan |
| `IN_RETURN`    | Dismantle/pengembalian | Aset kembali dari pelanggan        |
| `CONSUMED`     | Habis pakai            | Material habis (balance = 0)       |
| `ADJUSTMENT`   | Manual adjustment      | Koreksi stok manual                |
| `TRANSFER`     | Transfer lokasi        | Perpindahan antar gudang           |

### 2.4 Stock Availability Check

Service `StockAvailabilityService` menyediakan:

```
┌──────────────────────────────────────────────────┐
│           STOCK AVAILABILITY CHECK                │
├──────────────────────────────────────────────────┤
│                                                   │
│  Input: Array of { itemName, brand, qty, unit }  │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Untuk setiap item:                          │ │
│  │ 1. Cari aset matching (name + brand)        │ │
│  │ 2. Hitung available stock:                  │ │
│  │    - INDIVIDUAL: count IN_STORAGE assets    │ │
│  │    - COUNT: sum(quantity) IN_STORAGE assets  │ │
│  │    - MEASUREMENT: sum(currentBalance)        │ │
│  │ 3. Unit conversion jika perlu               │ │
│  │ 4. Return: available, requested, shortage   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Output: { items[], hasShortage, summary }       │
└──────────────────────────────────────────────────┘
```

### 2.5 Stock Threshold & Alert

```
StockThreshold
├── id
├── categoryId → AssetCategory
├── itemName, brand
├── minThreshold: Int (minimum stok)
├── createdById → User
└── timestamps

Alert Flow:
1. Sistem cek stok < minThreshold
2. Jika di bawah: kirim WhatsApp alert ke Admin
3. Alert bisa di-trigger manual atau otomatis
4. Dashboard widget "StockAlertWidget" menampilkan item kritis
```

### 2.6 Handover Recommendations (FIFO)

Saat akan melakukan serah terima, sistem merekomendasikan aset berdasarkan:

1. **FIFO** — Aset yang lebih dulu masuk diprioritaskan
2. **Highest balance** — Untuk material measurement, pilih yang stok terbanyak
3. **Status filter** — Hanya aset IN_STORAGE yang direkomendasikan

### 2.7 Personal Assets

Fitur untuk melihat aset yang di-assign ke user tertentu:

```
GET /stock/personal → Aset milik current user
  └── Grouped by assignment type:
      ├── IN_USE    → Aset yang sedang digunakan
      ├── IN_CUSTODY → Aset dalam tanggung jawab
      └── ON_LOAN   → Aset yang dipinjam

GET /stock/role-summary → Summary berdasarkan role user
  └── SUPER_ADMIN/ADMIN: Lihat semua
  └── STAFF/TEKNISI: Hanya aset pribadi + divisi
```

---

## 3. Konsumsi Stok (Stock Consumption)

### 3.1 Alur Konsumsi Material

Material (kabel, konektor, dll.) dikonsumsi saat digunakan dalam operasi lapangan:

```
┌─────────────────────────────────────────────────────┐
│              ALUR KONSUMSI STOK                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Trigger: Instalasi / Maintenance / Manual           │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 1. Input: items to consume                     │  │
│  │    - itemName, brand, quantity, unit            │  │
│  │ 2. Context: customerId, technician, reference  │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 3. Untuk setiap item (FIFO):                   │  │
│  │    a. Cari aset IN_STORAGE matching name+brand │  │
│  │    b. Jika COUNT: kurangi quantity              │  │
│  │    c. Jika MEASUREMENT: kurangi currentBalance  │  │
│  │    d. Jika sisa = 0 → status CONSUMED          │  │
│  │    e. Buat StockMovement record                │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 4. Output: consumed items with movement details│  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Unit Conversion:                                    │
│  - Jika unit order ≠ unit aset → convert via         │
│    quantityPerUnit di AssetModel                     │
│  - Contoh: 1 box konektor = 100 pcs                 │
└─────────────────────────────────────────────────────┘
```

---

## 4. Komponen Frontend Terkait

### 4.1 Halaman Registrasi Aset (/assets)

| Komponen                   | File                                                         | Fungsi                                  |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `RegistrationPage`         | `pages/RegistrationPage.tsx`                                 | Halaman utama list registrasi           |
| `RegistrationForm`         | `features/assetRegistration/components/RegistrationForm.tsx` | Form input registrasi batch             |
| `RegistrationFormSections` | `...RegistrationFormSections.tsx`                            | Section-section form (vendor, items)    |
| `EnhancedAssetTable`       | `...EnhancedAssetTable.tsx`                                  | Tabel aset dalam registrasi             |
| `GroupedAssetTable`        | `...GroupedAssetTable.tsx`                                   | Tabel grouped by kategori               |
| `RegistrationTable`        | `...RegistrationTable.tsx`                                   | Tabel dokumen registrasi                |
| `AssetFilters`             | `...AssetFilters.tsx`                                        | Filter panel (status, kategori, search) |
| `BulkActionPanel`          | `...BulkActionPanel.tsx`                                     | Panel aksi massal                       |
| `FloatingBulkActionBar`    | `...FloatingBulkActionBar.tsx`                               | Action bar floating saat select         |
| `StockVisualization`       | `...StockVisualization.tsx`                                  | Visualisasi stok                        |

### 4.2 Custom Hooks

| Hook                   | Fungsi                               |
| ---------------------- | ------------------------------------ |
| `useRegistrationForm`  | State management form registrasi     |
| `useFormValidation`    | Validasi field-level                 |
| `useAssetCalculations` | Kalkulasi total, sisa stok           |
| `useSmartSuggestions`  | Auto-complete berdasar data existing |

### 4.3 Store Terkait

```typescript
// useAssetStore - Zustand Store
{
  assets: Asset[]
  categories: AssetCategory[]
  stockMovements: StockMovement[]
  thresholds: StockThreshold[]

  // Actions
  setAssets, addAsset, updateAsset, removeAsset
  setCategories, setStockMovements, setThresholds
}
```

---

## 5. API Endpoints

### Asset Registration

| Method   | Endpoint                                 | Permission      | Deskripsi             |
| -------- | ---------------------------------------- | --------------- | --------------------- |
| `POST`   | `/api/v1/asset-registrations`            | `assets:create` | Buat registrasi baru  |
| `GET`    | `/api/v1/asset-registrations`            | `assets:view`   | List semua registrasi |
| `GET`    | `/api/v1/asset-registrations/statistics` | `assets:view`   | Statistik registrasi  |
| `GET`    | `/api/v1/asset-registrations/:id`        | `assets:view`   | Detail registrasi     |
| `DELETE` | `/api/v1/asset-registrations/:id`        | `assets:create` | Hapus registrasi      |

### Assets

| Method   | Endpoint                        | Permission      | Deskripsi        |
| -------- | ------------------------------- | --------------- | ---------------- |
| `POST`   | `/api/v1/assets`                | `assets:create` | Buat aset satuan |
| `POST`   | `/api/v1/assets/bulk`           | `assets:create` | Buat aset bulk   |
| `GET`    | `/api/v1/assets`                | `assets:view`   | List aset        |
| `GET`    | `/api/v1/assets/:id`            | `assets:view`   | Detail aset      |
| `PATCH`  | `/api/v1/assets/:id`            | `assets:edit`   | Update aset      |
| `PATCH`  | `/api/v1/assets/:id/status`     | `assets:edit`   | Ubah status      |
| `PATCH`  | `/api/v1/assets/batch`          | `assets:edit`   | Batch update     |
| `DELETE` | `/api/v1/assets/:id`            | `assets:delete` | Hapus aset       |
| `POST`   | `/api/v1/assets/scan/:qrData`   | `assets:view`   | Scan QR code     |
| `GET`    | `/api/v1/assets/:id/qr-code`    | `assets:view`   | Generate QR      |
| `GET`    | `/api/v1/assets/user/my-assets` | authenticated   | Aset pribadi     |
| `POST`   | `/api/v1/assets/consume`        | `assets:edit`   | Konsumsi stok    |

### Stock

| Method | Endpoint                                 | Permission    | Deskripsi               |
| ------ | ---------------------------------------- | ------------- | ----------------------- |
| `POST` | `/api/v1/stock/check-availability`       | `assets:view` | Cek ketersediaan        |
| `GET`  | `/api/v1/stock/handover-recommendations` | `assets:view` | Rekomendasi FIFO        |
| `GET`  | `/api/v1/stock/below-threshold`          | `assets:view` | Item di bawah threshold |
| `POST` | `/api/v1/stock/send-alert`               | `assets:view` | Kirim alert manual      |
| `GET`  | `/api/v1/stock/personal`                 | authenticated | Stok personal           |
| `GET`  | `/api/v1/stock/role-summary`             | authenticated | Summary per role        |

---

## 6. Catatan untuk Rebuild

1. **ID Generation** harus collision-safe — versi lama menggunakan retry loop saat concurrent insert
2. **Serial number** validation — cek duplikat sebelum insert
3. **Stock movement** WAJIB dibuat untuk setiap pergerakan aset (audit trail)
4. **Material consumption** menggunakan FIFO — aset paling lama digunakan duluan
5. **Unit conversion** penting untuk material (box → pcs, roll → meter)
6. **Threshold alert** terintegrasi WhatsApp — kirim notifikasi saat stok kritis
7. **OCC (version field)** mencegah race condition pada concurrent update
8. **QR Code** mendukung scan by ID, serial number, dan MAC address
