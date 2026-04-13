# 04 — Kelola Akun, Akun & Divisi, Kategori Model, Data Pembelian

> Dokumentasi lengkap alur pengelolaan akun user, manajemen divisi,
> hierarki kategori aset, dan data master pembelian pada versi lama.

---

## 1. Kelola Akun (Account Management)

### 1.1 Overview

Halaman kelola akun memungkinkan user mengelola profil pribadi, keamanan akun,
dan melihat overview aktivitas pribadi.

### 1.2 Route & Permission

- **Route**: `/settings/profile`
- **Permission**: `account:manage`

### 1.3 Komponen & Tab

```
ManageAccountPage
├── AccountOverviewTab
│   ├── Ringkasan data akun
│   ├── Role & divisi
│   ├── Last login info
│   └── Activity summary
│
├── AccountProfileTab
│   ├── Edit nama
│   ├── Edit email
│   └── Update profil
│
└── AccountSecurityTab
    ├── Change Password
    │   ├── Input current password (verify dulu)
    │   ├── Input new password
    │   ├── PasswordStrengthMeter (visual feedback)
    │   └── Confirm new password
    │
    ├── Force Change Password
    │   └── Jika mustChangePassword = true (setelah reset)
    │
    └── Session Info
        └── Token version & active sessions
```

### 1.4 Alur Ganti Password

```
┌─────────────────────────────────────────────────────────────┐
│                ALUR GANTI PASSWORD                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User-Initiated:                                            │
│  1. User buka Security Tab                                  │
│  2. Masukkan current password                               │
│  3. POST /users/:id/verify-password → OK                    │
│  4. Masukkan new password + confirm                         │
│  5. PATCH /users/:id/change-password                        │
│  6. Password updated, session tetap aktif                   │
│                                                              │
│  Admin Reset:                                                │
│  1. Admin buka user detail                                  │
│  2. PATCH /users/:id/reset-password                         │
│  3. Password di-reset ke yang baru                          │
│  4. tokenVersion di-increment (invalidate semua session)    │
│  5. mustChangePassword = true                               │
│  6. User harus ganti password saat login berikutnya         │
│                                                              │
│  Force Change Password:                                     │
│  1. User login → mustChangePassword = true                  │
│  2. ForceChangePasswordModal muncul (tidak bisa dismiss)    │
│  3. User HARUS ganti password                               │
│  4. Setelah sukses → mustChangePassword = false              │
│  5. ReloginSuccessModal → login ulang dengan password baru  │
└─────────────────────────────────────────────────────────────┘
```

### 1.5 Password Strength Meter

```
PasswordStrengthMeter evaluates:
├── Length ≥ 8 characters
├── Lowercase letter present
├── Uppercase letter present
├── Number present
├── Special character present
│
Strength Levels:
├── Weak (≤ 2 criteria)
├── Fair (3 criteria)
├── Good (4 criteria)
└── Strong (5 criteria)
```

### 1.6 Custom Hooks

| Hook                    | Fungsi                                                |
| ----------------------- | ----------------------------------------------------- |
| `useManageAccountLogic` | Logic untuk halaman manage account (tabs, form state) |
| `useAccountsLogic`      | Logic untuk halaman akun & divisi (admin view)        |

---

## 2. Akun & Divisi (Users & Divisions Management)

### 2.1 Overview

Halaman admin untuk mengelola user accounts dan divisi organisasi.
Mengatur role, permission, dan pembatasan akun per role.

### 2.2 Route & Permission

- **Route**: `/settings/users-divisions`
- **Permission**: `users:view` (untuk melihat), `users:create/edit/delete` (untuk manage)

### 2.3 Data Model

```
User
├── id: auto-increment
├── name, email (unique, case-insensitive)
├── password (bcrypt hashed)
├── role: UserRole
├── divisionId? → Division
├── permissions: String[] (RBAC array)
│
├── Password Management:
│   ├── passwordResetToken?, passwordResetExpires?
│   ├── passwordResetRequested, passwordResetRequestDate?
│   └── mustChangePassword (force change flag)
│
├── Session:
│   ├── lastLoginAt?
│   ├── refreshToken?
│   └── tokenVersion (increment = invalidate sessions)
│
├── isActive: Boolean
└── timestamps

Division
├── id: auto-increment
├── name (unique)
├── canDoFieldwork: Boolean
├── users[] → User
├── assetCategories[] → AssetCategory (M2M)
└── timestamps
```

### 2.4 Role System

```
┌──────────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SUPER_ADMIN (max 1 akun)                                        │
│  ├── Full access semua fitur                                     │
│  ├── Final approval request                                      │
│  ├── Manage semua users                                          │
│  └── Warna: Purple                                               │
│                                                                   │
│  ADMIN_LOGISTIK (max 3 akun)                                     │
│  ├── Manage aset, stok, registrasi                               │
│  ├── Logistic approval pada request                              │
│  ├── Approve loan request                                        │
│  ├── Manage handover                                              │
│  └── Warna: Sky blue                                              │
│                                                                   │
│  ADMIN_PURCHASE (max 3 akun)                                     │
│  ├── Isi detail pembelian pada request                           │
│  ├── Manage purchase master data                                  │
│  ├── View harga & financial data                                 │
│  └── Warna: Teal                                                  │
│                                                                   │
│  LEADER (unlimited)                                              │
│  ├── View dashboard & summary                                    │
│  ├── Create request untuk divisinya                              │
│  ├── Approve request divisi                                      │
│  └── Warna: Indigo                                                │
│                                                                   │
│  STAFF (unlimited)                                               │
│  ├── Create request                                              │
│  ├── View aset pribadi                                           │
│  ├── Request pinjam                                              │
│  └── Warna: Slate                                                 │
│                                                                   │
│  TEKNISI (unlimited — mapped as Staff role)                      │
│  ├── Field work: instalasi, maintenance, dismantle               │
│  ├── View aset & pelanggan terkait                               │
│  └── Warna: Orange/Amber                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 2.5 Account Limits

```
validateRoleAccountLimit():
├── SUPER_ADMIN:    max 1
├── ADMIN_LOGISTIK: max 3
├── ADMIN_PURCHASE: max 3
├── LEADER:         unlimited
├── STAFF:          unlimited
└── TEKNISI:        unlimited

GET /users/role-limits → returns current counts vs max per role
```

### 2.6 Permission System (RBAC)

```
┌──────────────────────────────────────────────────────────────────┐
│                   PERMISSION MANAGEMENT                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Permissions stored as String[] pada User model                  │
│  Format: "resource:action" atau "resource:action:scope"          │
│                                                                   │
│  Examples:                                                        │
│  ├── "assets:view"            → Lihat semua aset                 │
│  ├── "assets:create"          → Buat aset baru                   │
│  ├── "assets:edit"            → Edit aset                        │
│  ├── "assets:delete"          → Hapus aset                       │
│  ├── "assets:handover"        → Serah terima aset                │
│  ├── "assets:install"         → Instalasi aset                   │
│  ├── "assets:dismantle"       → Dismantle aset                   │
│  ├── "assets:repair:manage"   → Manage repair                    │
│  ├── "assets:view-price"      → Lihat harga                      │
│  ├── "requests:view:own"      → Lihat request sendiri            │
│  ├── "requests:create"        → Buat request                     │
│  ├── "requests:approve"       → Approve request                  │
│  ├── "loan-requests:view:own" → Lihat pinjaman sendiri           │
│  ├── "loan-requests:create"   → Buat pinjaman                    │
│  ├── "loan-requests:approve"  → Approve pinjaman                 │
│  ├── "customers:view"         → Lihat pelanggan                  │
│  ├── "customers:create"       → Buat pelanggan                   │
│  ├── "customers:edit"         → Edit pelanggan                   │
│  ├── "customers:delete"       → Hapus pelanggan                  │
│  ├── "maintenances:view"      → Lihat maintenance                │
│  ├── "maintenances:create"    → Buat maintenance                 │
│  ├── "users:view"             → Lihat user                       │
│  ├── "users:create"           → Buat user                        │
│  ├── "users:edit"             → Edit user                        │
│  ├── "users:delete"           → Delete user                      │
│  ├── "users:reset-password"   → Reset password user              │
│  ├── "users:manage-permissions"→ Manage permissions               │
│  ├── "divisions:manage"       → Manage divisi                    │
│  ├── "categories:view"        → Lihat kategori                   │
│  ├── "categories:manage"      → Manage kategori                  │
│  ├── "projects:view"          → Lihat proyek                     │
│  ├── "dashboard:view"         → Dashboard                        │
│  └── "account:manage"         → Kelola akun sendiri              │
│                                                                   │
│  Permission Sanitization:                                        │
│  ├── Role-based mandatory permissions (auto-added)               │
│  ├── Role-based restricted permissions (auto-removed)            │
│  └── Invalid keys stripped                                        │
│                                                                   │
│  UI: PermissionManager component untuk admin edit permissions    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.7 Alur Manajemen User

```
┌─────────────────────────────────────────────────────────────────┐
│                  ALUR MANAJEMEN USER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Create User                                                 │
│     ├── Route: /settings/users/new                              │
│     ├── Input: nama, email, role, divisi                        │
│     ├── Password: opsional (default → DEFAULT_USER_PASSWORD)    │
│     │   └── Jika default → mustChangePassword = true            │
│     ├── Validasi: email unique, role limit check                │
│     ├── Password hashed (bcrypt)                                │
│     └── SSE event emitted                                       │
│                                                                  │
│  2. Edit User                                                   │
│     ├── Route: /settings/users/:id/edit                         │
│     ├── Smart updates:                                          │
│     │   ├── Role change → re-validate limit (exclude self)      │
│     │   ├── Permission change → sanitize + invalidate JWT cache │
│     │   └── Password change → hash + maybe set mustChange       │
│     └── SSE event emitted                                       │
│                                                                  │
│  3. Delete/Deactivate User                                      │
│     ├── Soft delete: isActive = false                           │
│     └── Permission: users:delete                                │
│                                                                  │
│  4. Reset Password (Admin)                                      │
│     ├── Permission: users:reset-password                        │
│     ├── Set new password (hashed)                               │
│     ├── Increment tokenVersion (invalidate all sessions)        │
│     └── Set mustChangePassword = true                           │
│                                                                  │
│  5. Manage Permissions                                          │
│     ├── Permission: users:manage-permissions                    │
│     ├── PermissionManager UI                                    │
│     ├── Backend sanitizes against role                          │
│     ├── Invalidate JWT cache                                    │
│     └── Audit logged                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.8 Alur Manajemen Divisi

```
┌─────────────────────────────────────────────────────────────┐
│                ALUR MANAJEMEN DIVISI                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Division Properties:                                       │
│  ├── name: unique                                           │
│  ├── canDoFieldwork: Boolean                                │
│  │   └── True = divisi bisa tugas lapangan                  │
│  │       (instalasi, maintenance, dismantle)                │
│  └── assetCategories: M2M → AssetCategory                   │
│      └── Divisi mana bisa akses kategori aset mana          │
│                                                              │
│  CRUD Operations:                                           │
│  ├── POST /divisions → Create (name + canDoFieldwork)       │
│  ├── GET /divisions → List (with user counts)               │
│  ├── GET /divisions/:id → Detail (with active users)        │
│  ├── PATCH /divisions/:id → Update                          │
│  └── DELETE /divisions/:id → Hard delete                    │
│                                                              │
│  Permission: divisions:manage                               │
│                                                              │
│  Frontend:                                                  │
│  ├── DivisionsTable component pada halaman Akun & Divisi   │
│  ├── DivisionFormPage (/settings/divisions/new & :id/edit) │
│  └── DivisionDetailPage (/settings/divisions/:id)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Kategori & Model (Category Management)

### 3.1 Overview

Sistem hierarki 3-level untuk mengorganisir aset:
**Category → Type → Model**

### 3.2 Data Model (Hierarki)

```
AssetCategory (Level 1)
├── id: auto-increment
├── name (unique)
├── isCustomerInstallable: Boolean
│   └── True = kategori ini bisa diinstal ke pelanggan
├── isProjectAsset: Boolean
│   └── True = kategori ini untuk proyek infra
├── defaultClassification: ASSET | MATERIAL
├── associatedDivisions[] ↔ Division (M2M)
│   └── Divisi mana yang handle kategori ini
└── types[] → AssetType

AssetType (Level 2)
├── id: auto-increment
├── categoryId → AssetCategory
├── name
├── classification?: ASSET | MATERIAL (override parent)
├── trackingMethod?: INDIVIDUAL | BULK
├── unitOfMeasure? (meter, pcs, unit, dll)
├── Unique: [categoryId, name]
└── models[] → AssetModel

AssetModel (Level 3)
├── id: auto-increment
├── typeId → AssetType
├── name, brand
├── bulkType?: COUNT | MEASUREMENT
├── unitOfMeasure?, baseUnitOfMeasure?
├── quantityPerUnit? (conversion factor)
├── isInstallationTemplate: Boolean
│   └── True = muncul sebagai template saat instalasi
├── Unique: [typeId, name, brand]
└── purchaseMasterData? → PurchaseMasterData (1-to-1)
```

### 3.3 Contoh Hierarki

```
┌────────────────────────────────────────────────────────────────────┐
│                    CONTOH HIERARKI KATEGORI                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Perangkat Jaringan (Category) [ASSET, installable]                │
│  ├── Router (Type) [INDIVIDUAL]                                    │
│  │   ├── Mikrotik RB750Gr3 (Model) [brand: Mikrotik]              │
│  │   ├── Mikrotik hAP ac² (Model) [brand: Mikrotik]               │
│  │   └── TP-Link TL-R480T+ (Model) [brand: TP-Link]               │
│  ├── Switch (Type) [INDIVIDUAL]                                    │
│  │   ├── Cisco SG350 (Model) [brand: Cisco]                       │
│  │   └── MikroTik CRS326 (Model) [brand: Mikrotik]                │
│  └── ONT (Type) [INDIVIDUAL]                                      │
│      └── ZTE F660 (Model) [brand: ZTE]                             │
│                                                                     │
│  Kabel (Category) [MATERIAL]                                       │
│  ├── Fiber Optic (Type) [BULK, MEASUREMENT, meter]                 │
│  │   ├── FO Single Mode 12 Core (Model) [brand: Furukawa]         │
│  │   └── Drop Cable 2 Core (Model) [brand: Furukawa]              │
│  └── UTP (Type) [BULK, MEASUREMENT, meter]                         │
│      └── Cat6 UTP (Model) [brand: AMP]                             │
│                                                                     │
│  Konektor & Aksesoris (Category) [MATERIAL]                        │
│  ├── Konektor (Type) [BULK, COUNT, pcs]                            │
│  │   ├── RJ45 Cat6 (Model) [brand: AMP, qty/box: 100]             │
│  │   └── SC/APC Connector (Model) [brand: Generic]                │
│  └── Dusbox (Type) [BULK, COUNT, pcs]                              │
│      └── OTB 12 Port (Model) [brand: Generic]                     │
└────────────────────────────────────────────────────────────────────┘
```

### 3.4 Alur Manajemen Kategori

```
┌─────────────────────────────────────────────────────────────────┐
│              ALUR MANAJEMEN KATEGORI                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Route: /settings/categories                                    │
│  Permission: categories:view (lihat), categories:manage (CRUD)  │
│                                                                  │
│  1. View Hierarki                                               │
│     └── CategoryManagementPage menampilkan tree:                │
│         Category → Types → Models (expandable)                  │
│                                                                  │
│  2. Create Category                                             │
│     ├── Input: nama, classification, flags                      │
│     └── Set associated divisions (M2M)                          │
│                                                                  │
│  3. Create Type (under Category)                                │
│     ├── Input: nama, classification (override), tracking method │
│     └── Unit of measure                                         │
│                                                                  │
│  4. Create Model (under Type)                                   │
│     ├── Input: nama + brand (unique combo per type)             │
│     ├── Bulk config: bulkType, units, quantityPerUnit           │
│     └── isInstallationTemplate flag                             │
│                                                                  │
│  5. Bulk Update                                                 │
│     └── PUT /categories → update banyak category sekaligus      │
│                                                                  │
│  6. Delete Protection                                           │
│     ├── Category: cek apakah ada asset yang menggunakan         │
│     ├── Type: cek asset count                                   │
│     └── Model: cek asset count (by name + brand)                │
│                                                                  │
│  7. Division-Category Association                               │
│     └── Update category → set associatedDivisions (set semantics)│
│         Menentukan divisi mana yang bisa manage aset kategori ini│
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Pembelian (Purchase Master)

### 4.1 Overview

Purchase Master menyimpan data default pembelian per AssetModel.
Digunakan sebagai referensi harga, vendor, dan konfigurasi penyusutan.
**Relasi 1-to-1 dengan AssetModel**.

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
│   ├── salvageValue? (Decimal)
│   └── depreciationRate? (% untuk declining balance)
│
├── Metadata:
│   ├── notes?, isActive
│   └── createdById?, updatedById?
│
└── assetModel → AssetModel
```

### 4.3 Kalkulasi Penyusutan (Depreciation)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KALKULASI PENYUSUTAN                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Method 1: STRAIGHT_LINE (Garis Lurus)                              │
│  ├── annualDepreciation = (unitPrice - salvageValue) / usefulLife   │
│  ├── monthlyDepreciation = annual / 12                              │
│  ├── accumulatedDepreciation = annual × elapsedYears                │
│  └── bookValue = unitPrice - accumulated                            │
│                                                                      │
│  Method 2: DECLINING_BALANCE (Saldo Menurun)                       │
│  ├── Rate determined by depreciationRate (%)                        │
│  ├── Year 1: depreciation = unitPrice × rate                       │
│  ├── Year N: depreciation = bookValue_prev × rate                  │
│  ├── Handles partial first year                                     │
│  └── Constrained: bookValue ≥ salvageValue                         │
│                                                                      │
│  Method 3: NONE                                                     │
│  └── No depreciation calculated                                    │
│                                                                      │
│  Output: {                                                          │
│    annualDepreciation, monthlyDepreciation,                         │
│    accumulatedDepreciation, bookValue,                              │
│    depreciationPercentage                                           │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 Alur Data Pembelian

```
┌─────────────────────────────────────────────────────────────────┐
│                  ALUR DATA PEMBELIAN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Route: /settings/purchase-master                               │
│  Permission: assets:view-price                                  │
│                                                                  │
│  1. List Purchase Master                                        │
│     ├── Filterable: search, categoryId, typeId, isActive        │
│     ├── Pagination: page + limit                                │
│     ├── Include depreciation calculations (opsional)            │
│     └── Sort: by category name → asset name                    │
│                                                                  │
│  2. Create Purchase Record                                      │
│     ├── Route: /settings/purchase-master/new (form page)        │
│     ├── Pilih AssetModel (1-to-1, satu record per model)       │
│     ├── Input data pembelian (harga, vendor, PO, invoice)       │
│     ├── Input data garansi                                      │
│     ├── Konfigurasi penyusutan                                  │
│     └── Validasi: duplicate check (per assetModelId)            │
│                                                                  │
│  3. View Detail + Depreciation                                  │
│     ├── Route: /settings/purchase-master/:id                    │
│     ├── Data pembelian + garansi                                │
│     └── Kalkulasi penyusutan real-time                          │
│                                                                  │
│  4. Bulk Upsert                                                 │
│     ├── POST /purchase-master/bulk                              │
│     └── Insert or update banyak record sekaligus               │
│                                                                  │
│  5. Statistics                                                  │
│     ├── Total value (semua aset)                                │
│     ├── Accumulated depreciation                                │
│     ├── Current book value                                      │
│     └── Per-category breakdown                                  │
│                                                                  │
│  6. Integrasi dengan Registrasi                                 │
│     └── Saat registrasi aset baru:                              │
│         ├── findByAssetModelId() → auto-fill harga/vendor       │
│         └── Copy depreciation config ke Asset record            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Komponen Frontend

| Komponen                   | Fungsi                        |
| -------------------------- | ----------------------------- |
| `PurchaseMasterPage`       | Halaman list data pembelian   |
| `PurchaseMasterFormPage`   | Form create/edit              |
| `PurchaseMasterDetailPage` | Detail + kalkulasi penyusutan |

---

## 5. Relasi Antar Modul

```
┌─────────────────────────────────────────────────────────────────────────┐
│              RELASI PENGATURAN — DATA MASTER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Division ←──M2M──→ AssetCategory                                      │
│  └── Menentukan divisi mana yang handle kategori aset apa               │
│                                                                          │
│  User ──→ Division                                                      │
│  └── User berdasarkan divisi, permission berdasarkan role               │
│                                                                          │
│  AssetCategory → AssetType → AssetModel                                 │
│  └── Hierarki 3-level untuk organisasi aset                             │
│                                                                          │
│  AssetModel ←──1:1──→ PurchaseMasterData                                │
│  └── Satu record harga per model                                       │
│                                                                          │
│  PurchaseMasterData → Asset (indirect via AssetModel)                   │
│  └── Saat registrasi: price/vendor/depreciation auto-fill               │
│                                                                          │
│  User.permissions[] → Sidebar Menu Filtering                            │
│  └── Sidebar item visibility berdasarkan user permissions               │
│                                                                          │
│  Division.canDoFieldwork → User Assignment                              │
│  └── Hanya user dari divisi fieldwork yang bisa jadi teknisi             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### User Management

| Method   | Endpoint                            | Permission                 | Deskripsi              |
| -------- | ----------------------------------- | -------------------------- | ---------------------- |
| `POST`   | `/api/v1/users`                     | `users:create`             | Buat user              |
| `GET`    | `/api/v1/users`                     | `users:view`               | List user              |
| `GET`    | `/api/v1/users/role-limits`         | `users:view`               | Account limits         |
| `GET`    | `/api/v1/users/:id`                 | `users:view`               | Detail                 |
| `PATCH`  | `/api/v1/users/:id`                 | `users:edit`               | Update                 |
| `DELETE` | `/api/v1/users/:id`                 | `users:delete`             | Deactivate             |
| `PATCH`  | `/api/v1/users/:id/change-password` | authenticated              | Ganti password sendiri |
| `POST`   | `/api/v1/users/:id/verify-password` | authenticated              | Verifikasi password    |
| `PATCH`  | `/api/v1/users/:id/reset-password`  | `users:reset-password`     | Admin reset            |
| `PATCH`  | `/api/v1/users/:id/permissions`     | `users:manage-permissions` | Update permission      |

### Division Management

| Method   | Endpoint                | Permission         | Deskripsi   |
| -------- | ----------------------- | ------------------ | ----------- |
| `POST`   | `/api/v1/divisions`     | `divisions:manage` | Buat divisi |
| `GET`    | `/api/v1/divisions`     | `divisions:manage` | List divisi |
| `GET`    | `/api/v1/divisions/:id` | `divisions:manage` | Detail      |
| `PATCH`  | `/api/v1/divisions/:id` | `divisions:manage` | Update      |
| `DELETE` | `/api/v1/divisions/:id` | `divisions:manage` | Hapus       |

### Category Management

| Method   | Endpoint                        | Permission          | Deskripsi     |
| -------- | ------------------------------- | ------------------- | ------------- |
| `POST`   | `/api/v1/categories`            | `categories:manage` | Buat kategori |
| `GET`    | `/api/v1/categories`            | `categories:view`   | List semua    |
| `PUT`    | `/api/v1/categories`            | `categories:manage` | Bulk update   |
| `GET`    | `/api/v1/categories/:id`        | `categories:view`   | Detail        |
| `PATCH`  | `/api/v1/categories/:id`        | `categories:manage` | Update        |
| `DELETE` | `/api/v1/categories/:id`        | `categories:manage` | Hapus         |
| `POST`   | `/api/v1/categories/types`      | `categories:manage` | Buat type     |
| `GET`    | `/api/v1/categories/types`      | `categories:view`   | List types    |
| `GET`    | `/api/v1/categories/types/:id`  | `categories:view`   | Detail type   |
| `PATCH`  | `/api/v1/categories/types/:id`  | `categories:manage` | Update type   |
| `DELETE` | `/api/v1/categories/types/:id`  | `categories:manage` | Hapus type    |
| `POST`   | `/api/v1/categories/models`     | `categories:manage` | Buat model    |
| `GET`    | `/api/v1/categories/models`     | `categories:view`   | List models   |
| `GET`    | `/api/v1/categories/models/:id` | `categories:view`   | Detail model  |
| `PATCH`  | `/api/v1/categories/models/:id` | `categories:manage` | Update model  |
| `DELETE` | `/api/v1/categories/models/:id` | `categories:manage` | Hapus model   |

### Purchase Master

| Method   | Endpoint                               | Permission          | Deskripsi   |
| -------- | -------------------------------------- | ------------------- | ----------- |
| `POST`   | `/api/v1/purchase-master`              | `assets:view-price` | Buat record |
| `GET`    | `/api/v1/purchase-master`              | `assets:view-price` | List        |
| `GET`    | `/api/v1/purchase-master/statistics`   | `assets:view-price` | Statistik   |
| `GET`    | `/api/v1/purchase-master/by-model/:id` | `assets:view-price` | By model    |
| `GET`    | `/api/v1/purchase-master/:id`          | `assets:view-price` | Detail      |
| `PATCH`  | `/api/v1/purchase-master/:id`          | `assets:view-price` | Update      |
| `DELETE` | `/api/v1/purchase-master/:id`          | `assets:view-price` | Hapus       |
| `POST`   | `/api/v1/purchase-master/bulk`         | `assets:view-price` | Bulk upsert |

---

## 7. Catatan untuk Rebuild

1. **Role account limits** — penting untuk enforce di backend, bukan hanya frontend
2. **Permission sanitization** — auto-add mandatory + auto-remove restricted per role
3. **Token versioning** — increment saat admin reset password = invalidate semua session
4. **mustChangePassword flow** — wajib ganti password sebelum bisa akses fitur lain
5. **Default password** → otomatis set `mustChangePassword = true`
6. **Division-Category M2M** — menentukan scope akses per divisi
7. **3-level hierarki** kategori → type → model — immutable structure
8. **Purchase 1-to-1** dengan AssetModel — satu harga per model
9. **Depreciation calculation** — 3 metode, real-time calculation
10. **canDoFieldwork** pada Division — filter siapa yang bisa jadi teknisi
