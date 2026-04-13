# Hierarki Kategori & Model Aset — Referensi Implementasi

| Metadata        | Detail                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| **Versi**       | 1.0                                                                      |
| **Tanggal**     | 14 April 2026                                                            |
| **Status**      | ACTIVE — Referensi implementasi dari analisa versi lama                  |
| **Referensi**   | PRD v3.1 (F-02), SDD v3.1, OLD_VERSION/04_AKUN_DIVISI_KATEGORI_PEMBELIAN |
| **Sumber Data** | Dokumentasi versi lama (OLD_VERSION) + keputusan arsitektural baru       |

> **Tujuan**: Dokumen ini mendefinisikan hierarki kategori aset (3-level), Purchase Master Data,
> dan konfigurasi depresiasi. Menjadi acuan developer saat implementasi Category Management & Purchase.

---

## Daftar Isi

1. [Hierarki 3-Level](#1-hierarki-3-level)
2. [Data Model Reference](#2-data-model-reference)
3. [Contoh Hierarki Implementasi](#3-contoh-hierarki-implementasi)
4. [Purchase Master Data](#4-purchase-master-data)
5. [Alur Manajemen Kategori](#5-alur-manajemen-kategori)
6. [Business Rules](#6-business-rules)

---

## 1. Hierarki 3-Level

Sistem mengorganisir aset dalam hierarki **Category → Type → Model**:

```
AssetCategory (Level 1 — Grup besar)
│   Contoh: "Perangkat Jaringan", "Kabel", "Konektor & Aksesoris"
│
├── AssetType (Level 2 — Sub-kategori)
│   │   Contoh: "Router", "Switch", "Fiber Optic"
│   │
│   └── AssetModel (Level 3 — Spesifik brand + model)
│       Contoh: "Mikrotik RB750Gr3", "ZTE F660"
```

### Relasi

| Level    | Relasi Parent | Unique Constraint       | Keterangan                 |
| -------- | ------------- | ----------------------- | -------------------------- |
| Category | —             | `name` unique globally  | Top-level grouping         |
| Type     | Category      | `[categoryId, name]`    | Unique name per category   |
| Model    | Type          | `[typeId, name, brand]` | Unique name+brand per type |

---

## 2. Data Model Reference

### 2.1 AssetCategory (Level 1)

```
AssetCategory
├── id: auto-increment
├── name (unique)
├── isCustomerInstallable: Boolean
│   └── True = kategori ini bisa diinstal ke pelanggan
│       (muncul di form instalasi/maintenance)
├── isProjectAsset: Boolean
│   └── True = kategori ini untuk proyek infrastruktur
├── defaultClassification: ASSET | MATERIAL
│   └── Default klasifikasi untuk type/model di bawahnya
├── associatedDivisions[] ↔ Division (M2M)
│   └── Divisi mana yang handle kategori ini
└── types[] → AssetType
```

### 2.2 AssetType (Level 2)

```
AssetType
├── id: auto-increment
├── categoryId → AssetCategory
├── name
├── classification?: ASSET | MATERIAL
│   └── Override parent category's defaultClassification
├── trackingMethod?: INDIVIDUAL | BULK
│   └── INDIVIDUAL: per unit tracking (serial number)
│   └── BULK: aggregate tracking (qty/balance)
├── unitOfMeasure? (meter, pcs, unit, dll)
├── Unique: [categoryId, name]
└── models[] → AssetModel
```

### 2.3 AssetModel (Level 3)

```
AssetModel
├── id: auto-increment
├── typeId → AssetType
├── name, brand
├── bulkType?: COUNT | MEASUREMENT
│   └── COUNT: quantity-based (konektor per pcs)
│   └── MEASUREMENT: balance-based (kabel per meter)
├── unitOfMeasure? (unit display: "pcs", "meter")
├── baseUnitOfMeasure? (unit dasar untuk conversion)
├── quantityPerUnit? (conversion factor: 1 box = 100 pcs)
├── isInstallationTemplate: Boolean
│   └── True = muncul sebagai template saat form instalasi
├── Unique: [typeId, name, brand]
└── purchaseMasterData? → PurchaseMasterData (1-to-1)
```

---

## 3. Contoh Hierarki Implementasi

```
┌────────────────────────────────────────────────────────────────────┐
│                    CONTOH HIERARKI KATEGORI                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Perangkat Jaringan (Category)                                     │
│  ├── Classification: ASSET                                         │
│  ├── isCustomerInstallable: true                                   │
│  ├── Types:                                                        │
│  │   ├── Router [INDIVIDUAL]                                       │
│  │   │   ├── Mikrotik RB750Gr3 [brand: Mikrotik]                  │
│  │   │   ├── Mikrotik hAP ac² [brand: Mikrotik]                   │
│  │   │   └── TP-Link TL-R480T+ [brand: TP-Link]                   │
│  │   ├── Switch [INDIVIDUAL]                                       │
│  │   │   ├── Cisco SG350 [brand: Cisco]                           │
│  │   │   └── MikroTik CRS326 [brand: Mikrotik]                    │
│  │   └── ONT [INDIVIDUAL]                                          │
│  │       └── ZTE F660 [brand: ZTE]                                 │
│  │                                                                  │
│  Kabel (Category)                                                  │
│  ├── Classification: MATERIAL                                      │
│  ├── isCustomerInstallable: true                                   │
│  ├── Types:                                                        │
│  │   ├── Fiber Optic [BULK, MEASUREMENT, meter]                    │
│  │   │   ├── FO Single Mode 12 Core [brand: Furukawa]             │
│  │   │   └── Drop Cable 2 Core [brand: Furukawa]                  │
│  │   └── UTP [BULK, MEASUREMENT, meter]                            │
│  │       └── Cat6 UTP [brand: AMP]                                 │
│  │                                                                  │
│  Konektor & Aksesoris (Category)                                   │
│  ├── Classification: MATERIAL                                      │
│  ├── isCustomerInstallable: true                                   │
│  ├── Types:                                                        │
│  │   ├── Konektor [BULK, COUNT, pcs]                               │
│  │   │   ├── RJ45 Cat6 [brand: AMP, quantityPerUnit: 100 (box)]   │
│  │   │   └── SC/APC Connector [brand: Generic]                    │
│  │   └── Dusbox [BULK, COUNT, pcs]                                 │
│  │       └── OTB 12 Port [brand: Generic]                          │
│  │                                                                  │
│  Alat Kerja (Category)                                             │
│  ├── Classification: ASSET                                         │
│  ├── isCustomerInstallable: false                                  │
│  └── Types:                                                        │
│      ├── Power Tools [INDIVIDUAL]                                  │
│      └── Hand Tools [INDIVIDUAL]                                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Purchase Master Data

### 4.1 Overview

Purchase Master menyimpan data default pembelian per AssetModel. Relasi **1-to-1 dengan AssetModel**. Digunakan sebagai referensi harga, vendor, warranty, dan konfigurasi depresiasi.

### 4.2 Data Model

```
PurchaseMasterData
├── id: auto-increment
├── assetModelId → AssetModel (unique, 1-to-1)
│
├── Purchase Information:
│   ├── unitPrice: Decimal(15,2)
│   ├── vendor?
│   ├── poNumber?
│   ├── invoiceNumber?
│   └── purchaseDate?
│
├── Warranty Information:
│   ├── warrantyPeriodMonths?
│   ├── warrantyEndDate?
│   └── warrantyNotes?
│
├── Depreciation Configuration:
│   ├── depreciationMethod: STRAIGHT_LINE | DECLINING_BALANCE | UNITS_OF_ACTIVITY | NONE
│   ├── usefulLifeYears?
│   ├── salvageValue? (Decimal — nilai sisa)
│   └── depreciationRate? (% untuk declining balance)
│
├── Metadata:
│   ├── notes?, isActive
│   └── createdById?, updatedById?
│
└── assetModel → AssetModel
```

### 4.3 Auto-fill Behavior

Saat registrasi aset baru, jika AssetModel dipilih dan memiliki PurchaseMasterData:

- **unitPrice** → auto-fill ke `purchasePrice`
- **vendor** → auto-fill ke `vendor`
- **warrantyPeriodMonths** → auto-calculate `warrantyEndDate` dari `purchaseDate`
- User bisa override semua auto-filled values

### 4.4 Depreciation Methods

| Method              | Formula                                     | Use Case             |
| ------------------- | ------------------------------------------- | -------------------- |
| `STRAIGHT_LINE`     | (Cost - Salvage) / Useful Life Years        | Perangkat standar    |
| `DECLINING_BALANCE` | Book Value × Depreciation Rate %            | Perangkat high-value |
| `UNITS_OF_ACTIVITY` | (Cost - Salvage) / Total Units × Units Used | Material per-usage   |
| `NONE`              | Tidak ada depresiasi                        | Material habis pakai |

---

## 5. Alur Manajemen Kategori

```
Route: /settings/categories
Permission: categories:view (lihat), categories:manage (CRUD)

1. View Hierarki
   └── CategoryManagementPage menampilkan tree:
       Category → Types → Models (expandable/collapsible)

2. Create Category
   ├── Input: nama, defaultClassification, flags
   ├── isCustomerInstallable, isProjectAsset
   └── Set associated divisions (M2M)

3. Create Type (under Category)
   ├── Input: nama, classification (override), tracking method
   └── Unit of measure (meter, pcs, unit)

4. Create Model (under Type)
   ├── Input: nama + brand (unique combo per type)
   ├── Bulk config: bulkType, units, quantityPerUnit
   ├── isInstallationTemplate flag
   └── Opsional: link PurchaseMasterData

5. Bulk Update
   └── PUT /categories → update banyak category sekaligus

6. Delete Protection
   ├── Category: cek apakah ada asset yang menggunakan → warn/block
   ├── Type: cek asset count
   └── Model: cek asset count (by name + brand match)
```

---

## 6. Business Rules

| Rule                              | Detail                                                               |
| --------------------------------- | -------------------------------------------------------------------- |
| **3-level hierarchy wajib**       | Setiap aset harus punya Category. Type dan Model opsional            |
| **Unique constraints**            | Category name global unique, Type per category, Model per type+brand |
| **Classification inheritance**    | Type bisa override classification dari parent Category               |
| **Division association**          | Category M2M Division — menentukan scope akses                       |
| **InstallationTemplate**          | Model dengan flag ini muncul otomatis di form instalasi              |
| **Delete protection**             | Tidak bisa delete jika ada aset yang menggunakan                     |
| **PurchaseMaster 1-to-1**         | Tiap model max 1 purchase master data                                |
| **quantityPerUnit for container** | Wajib diisi untuk material yang dijual per container (box, roll)     |
