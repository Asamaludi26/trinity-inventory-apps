System Design Document (SDD): Aplikasi Inventori Aset

- **Versi**: 2.0
- **Tanggal**: 09 April 2026
- **Pemilik Dokumen**: Angga Samuludi Septiawan

# 1 Struktur Folder

## 1.1 Frontend

```text
frontend/src/
├── assets/                    # Aset statis (images, icons, global.css)
├── components/                # Komponen global yang di-share (DRY)
│   ├── ui/                    # Komponen bawaan Shadcn UI (button, dialog, table, dll)
│   ├── form/                  # Komponen wrapper form (Input, Select) custom dgn React Hook Form
│   ├── layout/                # Sidebar, Header, PageContainer, Footer
│   └── guard/                 # RoleProtectedRoute, AuthGuard (Keamanan Role-Based)
├── config/                    # Konfigurasi global (ENV, Constants, Menu Navigation)
├── hooks/                     # Custom hooks global (useDebounce, useWindowSize, useToast)
├── lib/                       # Utilitas global
│   ├── utils.ts               # Utility functions (cn tailwind merge utk shadcn, formatter)
│   └── axios.ts               # Instance axios dengan interceptor (keamanan, auth, & error handling)
├── routes/                    # Konfigurasi React Router DOM
│   ├── index.tsx              # Router utama (createBrowserRouter)
│   ├── protected.tsx          # Definisi rute yang dibungkus RoleProtectedRoute
│   └── public.tsx             # Rute publik (Login, Error 404/500, dll)
├── store/                     # Global State (Zustand)
│   ├── useAuthStore.ts        # Menyimpan sesi, user, token, dan role aktif
│   └── useUIStore.ts          # Menyimpan state sidebar, theme, dan global modal
├── types/                     # Global Typescript interfaces (Pagination, API Response, Error Tpyes)
│
└── features/                  # DOMAIN DRIVEN MODULES (Inti Logika Bisnis Aplikasi)
    │
    ├── auth/                  # MODUL AUTENTIKASI (LOGIN)
    │   ├── api/               # Fungsi fetch API (loginUser, logoutUser, refreshToken)
    │   ├── components/        # Komponen UI spesifik auth (LoginForm)
    │   ├── pages/             # Halaman rute (LoginPage)
    │   ├── schemas/           # Zod schema untuk validasi form login
    │   └── types/             # Interface payload request (LoginDTO) & response (Token, UserData)
    │
    ├── dashboards/            # Fitur 1: DASHBOARD
    │   ├── api/               # Fungsi fetch API agregasi data statistik
    │   ├── components/        # Widget chart, stat cards, recent activity lists
    │   ├── pages/             # Halaman rute dashboard berdasarkan role
    │   │   ├── MainDashboard.tsx        # /dashboard (Superadmin)
    │   │   ├── FinanceDashboard.tsx     # /dashboard/finance (Admin Purchase)
    │   │   ├── OperationsDashboard.tsx  # /dashboard/operations (Admin Logistik)
    │   │   ├── DivisionDashboard.tsx    # /dashboard/division (Leader)
    │   │   └── PersonalDashboard.tsx    # /dashboard/personal (Staff)
    │   └── types/             # Interface untuk tipe data grafik dan metrik
    │
    ├── assets/                # Fitur 2: MANAJEMEN ASSET
    │   ├── api/               # API calls khusus module asset (CRUD)
    │   ├── components/        # Komponen spesifik asset (AssetCard, DetailModal, AssetForm)
    │   ├── schemas/           # Zod schema untuk form Create/Update Asset, Kategori, Depresiasi
    │   ├── store/             # Zustand slice lokal jika butuh state filter yang kompleks
    │   ├── types/             # Tipe data spesifik asset (IAsset, ICategory, dll)
    │   └── pages/             # Halaman rute terkait manajemen aset
    │       ├── list/          # /assets, /assets/new, /assets/:uuid
    │       ├── stock/         # /assets/stock?view=main|division|personal
    │       ├── categories/    # /assets/categories/*
    │       ├── types/         # /assets/types/*
    │       ├── models/        # /assets/models/*
    │       ├── purchases/     # /assets/purchases/*
    │       └── depreciation/  # /assets/depreciation/*
    │
    ├── transactions/          # Fitur 3: TRANSAKSI (Siklus Hidup Aset)
    │   ├── api/               # API calls untuk operasional logistik
    │   ├── components/        # Komponen approval workflow, timeline status, transaction form
    │   ├── schemas/           # Zod schema untuk validasi payload transaksi
    │   ├── types/             # Interface untuk state machine (PENDING, APPROVED, dll)
    │   └── pages/
    │       ├── requests/      # /requests/* (Permintaan Baru)
    │       ├── loans/         # /loans/* (Peminjaman)
    │       ├── returns/       # /returns/* (Pengembalian)
    │       ├── handovers/     # /handovers/* (Serah Terima)
    │       ├── repairs/       # /repairs/* (Lapor Rusak)
    │       └── projects/      # /projects/* (Proyek Infrastruktur)
    │
    ├── customers/             # Fitur 4: MANAJEMEN PELANGGAN & OPERASIONAL
    │   ├── api/               # API calls untuk data klien dan jadwal operasional
    │   ├── components/        # Komponen tab detail klien, form instalasi/maintenance
    │   ├── schemas/           # Zod schema form pelanggan dan tiket operasional
    │   ├── types/             # Interface data pelanggan dan SLA
    │   └── pages/
    │       ├── clients/       # /customers/* (Terdapat logic routing tab ke mt/dismantle)
    │       ├── installation/  # /installation/*
    │       ├── maintenance/   # /maintenance/*
    │       └── dismantle/     # /dismantle/*
    │
    └── settings/              # Fitur 5: PENGATURAN (SISTEM & AKUN)
        ├── api/               # API calls untuk konfigurasi sistem
        ├── components/        # Komponen manajemen RBAC, form user, form divisi
        ├── schemas/           # Zod schema untuk validasi update profile & registrasi user
        ├── types/             # Interface User, Division, Permissions
        └── pages/
            ├── profile/       # /settings/profile
            ├── users/         # /settings/users/* (Termasuk ganti password, assign role)
            └── divisions/     # /settings/divisions/*
```

## 1.2 Backend

```text
backend/
├── prisma/                    # Konfigurasi Database (ORM)
│   ├── schema.prisma          # Skema database relasional (Multiple schema terpusat)
│   ├── seed.ts                # Seeder awal untuk role (Superadmin) dan master data default
│   └── migrations/            # Direktori hasil generate migrasi database (Auto-generated)
│
├── src/
│   ├── app.module.ts          # Root module yang mengimpor semua feature/domain modules
│   ├── main.ts                # Entry point (Setup Swagger, Global Pipes, CORS, Security Headers)
│   │
│   ├── common/                # Komponen Shareable (Standardisasi & DRY)
│   │   ├── decorators/        # Custom decorators (@Roles(), @CurrentUser(), @Public())
│   │   ├── filters/           # Global Exception Filters (Mapping error Prisma ke HTTP status)
│   │   ├── guards/            # JwtAuthGuard, RolesGuard (Implementasi Keamanan OSI Layer 7)
│   │   ├── interceptors/      # Response Transform (Format baku { data, message, statusCode })
│   │   ├── interfaces/        # Global TypeScript interfaces
│   │   └── dto/               # Base DTO (PaginationQueryDto, DateRangeDto)
│   │
│   ├── core/                  # Modul Infrastruktur Inti Sistem
│   │   ├── config/            # Manajemen ENV (Validasi environment dengan Joi/Zod)
│   │   ├── database/          # PrismaModule & PrismaService (Akses database terpusat)
│   │   └── auth/              # MODUL AUTENTIKASI (INTI SISTEM)
│   │       ├── dto/           # Validasi body request { email, password }
│   │       ├── strategies/    # Logika Passport JWT & Passport Local
│   │       ├── auth.controller.ts # Endpoint: /auth/login, /auth/refresh-token, /auth/logout
│   │       ├── auth.service.ts    # Logika hash password, sign Access/Refresh Token
│   │       └── auth.module.ts     # Konfigurasi JwtModule
│   │
│   └── modules/               # DOMAIN DRIVEN MODULES (API Endpoints sesuai Frontend)
│       │
│       ├── dashboards/        # Fitur 1: DASHBOARD (Aggregation API, Read-Heavy)
│       │   ├── dashboard.controller.ts
│       │   └── dashboard.service.ts
│       │
│       ├── assets/            # Fitur 2: MANAJEMEN ASSET
│       │   ├── categories/    # Sub-domain Kategori Asset
│       │   ├── types/         # Sub-domain Tipe Asset
│       │   ├── models/        # Sub-domain Model Asset
│       │   ├── purchases/     # Sub-domain Data Pembelian
│       │   ├── depreciation/  # Sub-domain Logika Depresiasi
│       │   ├── dto/           # Validasi Payload Asset (CreateAssetDto, dll)
│       │   ├── asset.controller.ts
│       │   └── asset.service.ts
│       │
│       ├── transactions/      # Fitur 3: TRANSAKSI (Siklus & State Machine)
│       │   ├── requests/      # Permintaan Baru
│       │   ├── loans/         # Peminjaman
│       │   ├── returns/       # Pengembalian
│       │   ├── handovers/     # Serah Terima
│       │   ├── repairs/       # Lapor Rusak
│       │   ├── projects/      # Proyek Infrastruktur
│       │   └── history/       # Approval History & Tracking Status
│       │
│       ├── customers/         # Fitur 4: MANAJEMEN PELANGGAN
│       │   ├── clients/       # Data Induk Pelanggan
│       │   ├── installations/ # Tiket Instalasi
│       │   ├── maintenance/   # Tiket Maintenance
│       │   └── dismantles/    # Tiket Dismantle
│       │
│       └── settings/          # Fitur 5: PENGATURAN
│           ├── users/         # Manajemen Akun & Hak Akses
│           ├── divisions/     # Manajemen Divisi & Departemen
│           └── audit/         # Modul Audit Log / Activity Trail Controller
│
├── .env                       # Environment variables (DB URL, JWT Secrets, dll)
├── docker-compose.yml         # Konfigurasi container untuk App, PostgreSQL, Redis, PgBouncer
├── Dockerfile                 # Konfigurasi build image backend
├── .eslintrc.js               # Linter configuration (Clean Code standard)
└── tsconfig.json              # Konfigurasi TypeScript
```

# 2. Fitur Utama & URL Mapping

## 1. DASHBOARD

- **1.1 Dashboard Utama** (`/dashboard`)
  - **Role:** Superadmin
- **1.2 Dashboard Keuangan Asset** (`/dashboard/finance`)
  - **Role:** Admin Purchase
- **1.3 Dashboard Operasional Asset** (`/dashboard/operations`)
  - **Role:** Admin Logistik
- **1.4 Dashboard Divisi** (`/dashboard/division`)
  - **Role:** Leader
- **1.5 Dashboard Pribadi** (`/dashboard/personal`)
  - **Role:** Staff

---

## 2. MANAJEMEN ASSET

- **2.1 Daftar Asset** (`/assets`)
  - **Role:** Superadmin, Admin Logistik, Admin Purchase
  - **2.1.1 Form Asset** (`/assets/new`)
    - **Role:** Superadmin, Admin Logistik
  - **2.1.2 Detail Asset** (`/assets/:id`)
    - **Contoh:** `/assets/AS-2026-0318-0001`
    - **Ketentuan Akses:**
      - **Bentuk Halaman:** Khusus Superadmin, Admin Logistik, dan Admin Purchase.
      - **Bentuk Modal:** Semua Role (diakses melalui _linked_).
      - **Hak Edit Asset:** Khusus Superadmin dan Admin Logistik.
      - **Data Pembelian:** Khusus Superadmin dan Admin Purchase (hanya untuk melihat data pembelian terkait asset).

- **2.2 Stok Asset Gudang** (`/assets/stock?view=main`)
  - **Role:** Superadmin, Admin Logistik, Admin Purchase
  - **2.2.1 Stok Asset Gudang Divisi** (`/assets/stock?view=division`)
    - **Role:** Superadmin, Admin Logistik, Leader
  - **2.2.2 Stok Asset Pribadi** (`/assets/stock?view=personal`)
    - **Role:** Semua Role

- **2.3 Kategori Asset** (`/assets/categories`)
  - **Role:** Superadmin, Admin Logistik
  - **2.3.1.1 Form Kategori Asset** (`/assets/categories/new`)
    - **Role:** Superadmin, Admin Logistik
  - **2.3.1.2 Detail Kategori Asset** (`/assets/categories/:id`)
    - **Contoh:** `/assets/categories/1`
    - **Role:** Superadmin, Admin Logistik
  - **2.3.1 Tipe Asset** (`/assets/types`)
    - **Role:** Superadmin, Admin Logistik
    - **2.3.1.1 Form Tipe Asset** (`/assets/types/new`)
      - **Role:** Superadmin, Admin Logistik
    - **2.3.1.2 Detail Tipe Asset** (`/assets/types/:id`)
      - **Contoh:** `/assets/types/1`
      - **Role:** Superadmin, Admin Logistik

  - **2.3.2 Model Asset** (`/assets/models`)
    - **Role:** Superadmin, Admin Logistik
    - **2.3.2.1 Form Model Asset** (`/assets/models/new`)
      - **Role:** Superadmin, Admin Logistik
    - **2.3.2.2 Detail Model Asset** (`/assets/models/:id`)
      - **Contoh:** `/assets/models/1`
      - **Role:** Superadmin, Admin Logistik

- **2.4 Data Pembelian Asset** (`/assets/purchases`)
  - **Role:** Superadmin, Admin Purchase
  - **2.4.1 Detail Data Pembelian Asset** (`/assets/purchases/:uuid`)
    - **Contoh:** `/assets/purchases/Router`
    - **Role:** Superadmin, Admin Purchase
  - **2.4.2 Form Data Pembelian Asset** (`/assets/purchases/new?modelId=123`)
    - _Catatan: `id` diambil dari `model.id`_
    - **Role:** Superadmin, Admin Purchase

- **2.5 Depresiasi Asset** (`/assets/depreciation`)
  - **Role:** Superadmin, Admin Purchase
  - **2.5.1 Detail Depresiasi Asset** (`/assets/depreciation/:uuid`)
    - **Role:** Superadmin, Admin Purchase
  - **2.5.2 Form Depresiasi Asset** (`/assets/depreciation/new?purchaseUuid=123`)
    - _Catatan: `uuid` diambil dari `purchase.uuid`_
    - **Role:** Superadmin, Admin Purchase

---

## 3. TRANSAKSI

- **3.1 Permintaan Baru (Daftar Permintaan)** (`/requests`)
  - **Role:** Semua Role
  - **3.1.1 Detail Permintaan** (`/requests/:uuid`) | **Contoh:** `/requests/RQ-2026-0318-0001`
  - **3.1.2 Form Permintaan** (`/requests/new`)

- **3.2 Permintaan Peminjaman (Daftar Peminjaman)** (`/loans`)
  - **Role:** Semua Role
  - **3.2.1 Detail Peminjaman** (`/loans/:uuid`) | **Contoh:** `/loans/LN-2026-0318-0001`
  - **3.2.2 Form Peminjaman** (`/loans/new`)

- **3.3 Permintaan Pengembalian (Daftar Pengembalian)** (`/returns`)
  - **Role:** Semua Role
  - **3.3.1 Detail Pengembalian** (`/returns/:uuid`) | **Contoh:** `/returns/RT-2026-0318-0001`
  - **3.3.2 Form Pengembalian** (`/returns/new`)

- **3.4 Serah Terima (Daftar Serah Terima)** (`/handovers`)
  - **Role:** Semua Role
  - **3.4.1 Detail Serah Terima** (`/handovers/:uuid`) | **Contoh:** `/handovers/HD-2026-0318-0001`
  - **3.4.2 Form Serah Terima** (`/handovers/new`)

- **3.5 Lapor Asset Rusak (Daftar Lapor Rusak)** (`/repairs`)
  - **Role:** Semua Role
  - **3.5.1 Detail Lapor Rusak** (`/repairs/:uuid`) | **Contoh:** `/repairs/RP-2026-0318-0001`
  - **3.5.2 Form Lapor Rusak** (`/repairs/new`)

- **3.6 Proyek Infrastruktur (Daftar Proyek)** (`/projects`)
  - **Role:** Semua Role
  - **3.6.1 Detail Proyek** (`/projects/:uuid`) | **Contoh:** `/projects/PRJ-2026-0318-0001`
  - **3.6.2 Form Proyek** (`/projects/new`)

---

## 4. MANAJEMEN PELANGGAN

- **4.1 Daftar Pelanggan** (`/customers`)
  - **Role:** Semua Role & Divisi Tertentu
  - **4.1.1 Detail Pelanggan** (`/customers/:uuid`) | **Contoh:** `/customers/TMI-2026-0318-0001`
    - **4.1.1.1 Tab Detail Instalasi:** _Redirect ke_ `/installation/:id` (Contoh: `/installation/INT-2026-0318-0001`)
    - **4.1.1.2 Tab Detail Maintenance:** _Redirect ke_ `/maintenance/:id` (Contoh: `/maintenance/MT-2026-0318-0001`)
    - **4.1.1.3 Tab Detail Dismantle:** _Redirect ke_ `/dismantle/:id` (Contoh: `/dismantle/DSM-2026-0318-0001`)
  - **4.1.2 Form Pelanggan** (`/customers/new`)

- **4.2 Manajemen Instalasi (Daftar Instalasi)** (`/installation`)
  - **Role:** Semua Role & Divisi Tertentu
  - **4.2.1 Detail Instalasi** (`/installation/:id`) | **Contoh:** `/installation/INT-2026-0318-0001`
  - **4.2.2 Form Instalasi** (`/installation/new`)

- **4.3 Manajemen Maintenance (Daftar Maintenance)** (`/maintenance`)
  - **Role:** Semua Role & Divisi Tertentu
  - **4.3.1 Detail Maintenance** (`/maintenance/:id`) | **Contoh:** `/maintenance/MT-2026-0318-0001`
  - **4.3.2 Form Maintenance** (`/maintenance/new`)

- **4.4 Data Dismantle (Daftar Dismantle)** (`/dismantle`)
  - **Role:** Semua Role & Divisi Tertentu
  - **4.4.1 Detail Dismantle** (`/dismantle/:id`) | **Contoh:** `/dismantle/DSM-2026-0318-0001`
  - **4.4.2 Form Dismantle** (`/dismantle/new`)

---

## 5. PENGATURAN

- **5.1 Kelola Akun** (`/settings/profile`)
  - **Role:** Semua Role
- **5.2 Akun & Divisi** (`/settings/users-divisions`)
  - **Role:** Khusus Superadmin
  - **5.2.1 Tab Ringkasan** (`/settings/users-divisions?tab=summary`)
  - **5.2.2 Tab Manajemen Akun (Daftar Akun)** (`/settings/users-divisions?tab=users`)
    - **5.2.2.1 Form Tambah Akun** (`/settings/users/new`)
    - **5.2.2.2 Detail Akun** (`/settings/users/:uuid`) | **Contoh:** `/settings/users/a1b2c3d4-xxxx`
  - **5.2.3 Tab Manajemen Divisi (Daftar Divisi)** (`/settings/users-divisions?tab=divisions`)
    - **5.2.3.1 Form Tambah Divisi** (`/settings/divisions/new`)
    - **5.2.3.2 Detail Divisi** (`/settings/divisions/:uuid`) | **Contoh:** `/settings/divisions/a1b2c3d4-xxxx`

# 3 Diagram Arsitektur

## 3.1 ERD (Entity Relationship Diagram)

## 3.2 Sequence Diagram (UML)

## 3.3 State Machine Diagram / Statechart (UML)

## 3.4 Architecture Diagram (Infrastructure / Network Diagram)

## 3.5 C4 Model (Context, Containers, Components, Code)

## 3.6 Flowchart

# 4 Desain Basis Data (Prisma ORM Schema)

Berdasarkan hierarki URL pada Point 2, basis data harus dirancang secara relasional dan mendukung aturan bisnis mutlak seperti:

- Setiap asset harus memiliki kategori, tipe, dan model yang valid.
- Setiap transaksi harus terkait dengan asset yang valid dan memiliki status yang jelas.
- Setiap pelanggan harus memiliki data kontak yang valid dan terkait dengan instalasi, maintenance, atau dismantle tertentu.
- Setiap pengguna harus memiliki role yang valid untuk mengakses fitur tertentu.
- Setiap divisi harus memiliki struktur hierarki yang jelas untuk mengelompokkan asset dan transaksi.
- Setiap data pembelian harus terkait dengan asset yang valid dan memiliki informasi supplier yang lengkap.
- Setiap data depresiasi harus terkait dengan asset yang valid dan memiliki perhitungan yang akurat berdasarkan metode depresiasi yang dipilih.
- Setiap dashboard harus memiliki data agregasi yang akurat untuk menampilkan statistik dan grafik yang relevan.

## 4.1 Skema Relasi

Menggunakan Prisma ORM multiple schema untuk memisahkan domain utama:

- **Schema Auth**: User, Role, Permission
- **Schema Asset**: Asset, Category, Type, Model, Purchase, Depreciation
- **Schema Transaction**: Request, Loan, Return, Handover, Repair, Project
- **Schema Customer**: Customer, Installation, Maintenance, Dismantle
- **Schema Setting**: User, Division
- **Schema Audit**: AuditLog (Menggunakan struktur Partisi Bulanan pada PostgreSQL)

## 4.2 Contoh Skema Prisma untuk Modul Asset

```prisma
// Seusaikan dengan versi Prisma terbaru dan kebutuhan aplikasi
// Contoh ini untuk modul Asset, skema lain mengikuti pola serupa dan dikembangkan, ditingkatkan sesuai kebutuhan dan aturan bisnis yang berlaku
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Asset {
  id          String   @id @default(uuid())
  name        String
  categoryId  String
  typeId      String
  modelId     String
  purchaseId  String
  depreciationId String?
  status      AssetStatus
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    Category @relation(fields: [categoryId], references: [id])
  type        Type     @relation(fields: [typeId], references: [id])
  model       Model    @relation(fields: [modelId], references: [id])
  purchase    Purchase @relation(fields: [purchaseId], references: [id])
  depreciation Depreciation? @relation(fields: [depreciationId], references: [id])

  @@index([status])
  @@index([categoryId])
  @@index([createdAt])
}
// Model lain mengikuti pola yang sama dengan relasi yang jelas dan aturan bisnis yang berlaku. Setiap model harus memiliki validasi yang ketat untuk memastikan integritas data dan konsistensi antar tabel.

```

# 5 API Endpoints (RESTful API Design)

Bagian ini menetapkan standar komunikasi antara Frontend dan Backend agar mematuhi prinsip DRY dan konsistensi.

## 5.1 Standar Format Respons Global

Setiap API wajib mengembalikan respons melalui Interceptor di NestJS dengan format baku:
// Contoh format respons untuk endpoint GET code 200 OK, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 200,
  "message": "Berhasil mengambil data aset",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150
  } // Opsional, hanya untuk endpoint list/pagination
}
```

// Contoh format respons untuk endpoint POST code 201 Created, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 201,
  "message": "Berhasil membuat aset baru",
  "data": { ... }
}
```

// Contoh format respons untuk endpoint PUT/PATCH code 200 OK, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 200,
  "message": "Berhasil memperbarui data aset",
  "data": { ... }
}
```

// Contoh format respons untuk endpoint DELETE code 204 No Content, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 204,
  "message": "Berhasil menghapus aset",
  "data": null
}
```

// Contoh format respons untuk endpoint error code 400 Bad Request, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 400,
  "message": "Gagal membuat aset baru",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "name",
        "message": "Nama aset wajib diisi"
      },
      {
        "field": "categoryId",
        "message": "Kategori aset tidak valid"
      }
    ]
  }
}
```

// Contoh format respons untuk endpoint error code 401 Unauthorized, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Token tidak valid atau sudah expired"
  }
}
```

// Contoh format respons untuk endpoint error code 403 Forbidden, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "details": "Anda tidak memiliki izin untuk mengakses resource ini"
  }
}
```

// Contoh format respons untuk endpoint error code 404 Not Found, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 404,
  "message": "Not Found",
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "details": "Resource yang Anda cari tidak ditemukan"
  }
}
```

// Contoh format respons untuk endpoint error code 500 Internal Server Error, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "details": "Terjadi kesalahan pada server. Silakan coba lagi nanti."
  }
}
```

// Contoh format respons untuk endpoint error code 503 Service Unavailable, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 503,
  "message": "Service Unavailable",
  "data": null,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "details": "Layanan sedang tidak tersedia. Silakan coba lagi nanti."
  }
}
```

// Contoh format respons untuk endpoint error code 504 Gateway Timeout, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 504,
  "message": "Gateway Timeout",
  "data": null,
  "error": {
    "code": "GATEWAY_TIMEOUT",
    "details": "Permintaan Anda memakan waktu terlalu lama. Silakan coba lagi nanti."
  }
}
```

// Contoh format respons untuk endpoint error code 422 Unprocessable Entity, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 422,
  "message": "Unprocessable Entity",
  "data": null,
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "details": "Data yang Anda kirim tidak dapat diproses. Silakan periksa kembali input Anda."
  }
}
```

// Contoh format respons untuk endpoint error code 429 Too Many Requests, endpoint lain menyesuaikan dengan status code dan kebutuhan data yang dikembalikan

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "data": null,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "details": "Anda telah mengirim terlalu banyak permintaan dalam waktu singkat. Silakan coba lagi nanti."
  }
}
```

// dan seterusnya untuk status code lain sesuai kebutuhan aplikasi

## 5.2 Contoh Endpoint Kontrak

// Contoh GET /api/v1/assets
**Deskripsi**: Mendapatkan daftar asset dengan pagination dan filter berdasarkan kategori, tipe, model, status, dan tanggal pembelian. Endpoint ini mendukung query params untuk mengatur halaman, jumlah item per halaman, dan kriteria filter lainnya.
**Headers**: Authorization: Bearer <JWT Token>
**Query Params**: ?page=1&limit=10&status=AVAILABLE&categoryId=xxx&typeId=xxx&modelId=xxx&purchaseDateFrom=2026-01-01&purchaseDateTo=2026-12-31
**Response**: 200 OK dengan format respons global yang telah ditentukan, termasuk data array asset dan metadata pagination. Jika terjadi error, akan mengembalikan respons error dengan format yang sesuai. \*_Contoh lainnya untuk endpoint GET, POST, PUT/PATCH, DELETE mengikuti pola yang sama dengan deskripsi yang jelas, header yang diperlukan, query params jika ada, dan format respons global yang konsisten sesuai dengan status code yang relevan._

- **GET /assets** - Mendapatkan daftar asset dengan pagination dan filter
- **GET /assets/:id** - Mendapatkan detail asset berdasarkan ID
- **GET /assets/stock?view=main** - Mendapatkan stok asset di gudang utama
- **GET /assets/stock?view=division** - Mendapatkan stok asset di gudang divisi
- **GET /assets/stock?view=personal** - Mendapatkan stok asset pribadi
- **GET /assets/categories** - Mendapatkan daftar kategori asset
- dan seterusnya untuk endpoint GET lainnya sesuai dengan fitur yang telah ditentukan

// Contoh POST /api/v1/assets
**Deskripsi**: Membuat asset baru dengan data yang valid. Endpoint ini menerima body request dengan format JSON yang sesuai dengan CreateAssetDto, termasuk nama, kategori, tipe, model, data pembelian, dan informasi lainnya yang diperlukan untuk membuat asset baru. Endpoint ini memerlukan otentikasi dan hanya dapat diakses oleh role yang memiliki izin untuk membuat asset.
**Body Request**:
// Contoh body request untuk membuat asset baru, field lain dapat ditambahkan sesuai kebutuhan dan aturan bisnis yang berlaku

```json
{
  "name": "Router",
  "categoryId": "xxx",
  "typeId": "xxx",
  "modelId": "xxx",
  "purchaseId": "xxx"
  // field lain sesuai kebutuhan
}
```

**Response**: 201 Created dengan format respons global yang telah ditentukan, termasuk data asset yang baru dibuat. Jika terjadi error, akan mengembalikan respons error dengan format yang sesuai.

- **POST /assets** - Membuat asset baru
- **POST /assets/categories** - Membuat kategori asset baru
- **POST /assets/types** - Membuat tipe asset baru
- **POST /assets/models** - Membuat model asset baru
- **POST /assets/purchases** - Membuat data pembelian asset baru
- **POST /assets/depreciation** - Membuat data depresiasi asset baru
- dan seterusnya untuk endpoint POST lainnya sesuai dengan fitur yang telah ditentukan

// Contoh PUT/PATCH /api/v1/assets
**Deskripsi**: Memperbarui data asset yang sudah ada berdasarkan ID. Endpoint ini menerima body request dengan format JSON yang sesuai dengan UpdateAssetDto, termasuk field yang dapat diperbarui seperti nama, kategori, tipe, model, data pembelian, dan informasi lainnya yang relevan. Endpoint ini memerlukan otentikasi dan hanya dapat diakses oleh role yang memiliki izin untuk memperbarui asset.
**Response**: 200 OK dengan format respons global yang telah ditentukan, termasuk data asset yang sudah diperbarui. Jika terjadi error, akan mengembalikan respons error dengan format yang sesuai.

- **PUT /assets/:id** - Memperbarui data asset berdasarkan ID
- **PUT /assets/categories/:id** - Memperbarui data kategori asset berdasarkan ID
- **PUT /assets/types/:id** - Memperbarui data tipe asset berdasarkan ID
- **PUT /assets/models/:id** - Memperbarui data model asset berdasarkan ID
- **PUT /assets/purchases/:id** - Memperbarui data pembelian asset berdasarkan ID
- **PUT /assets/depreciation/:id** - Memperbarui data depresiasi asset berdasarkan ID
- dan seterusnya untuk endpoint PUT/PATCH lainnya sesuai dengan fitur yang telah ditentukan

// Contoh DELETE /api/v1/assets
**Deskripsi**: Menghapus data asset berdasarkan ID. Endpoint ini memerlukan otentikasi dan hanya dapat diakses oleh role yang memiliki izin untuk menghapus asset. Setelah berhasil dihapus, endpoint ini akan mengembalikan respons dengan status code 204 No Content. Jika terjadi error, akan mengembalikan respons error dengan format yang sesuai.
**Response**: 204 No Content dengan format respons global yang telah ditentukan, tanpa data yang dikembalikan. Jika terjadi error, akan mengembalikan respons error dengan format yang sesuai.

- **DELETE /assets/:id** - Menghapus data asset berdasarkan ID
- **DELETE /assets/categories/:id** - Menghapus data kategori asset berdasarkan ID
- **DELETE /assets/types/:id** - Menghapus data tipe asset berdasarkan ID
- **DELETE /assets/models/:id** - Menghapus data model asset berdasarkan ID
- **DELETE /assets/purchases/:id** - Menghapus data pembelian asset berdasarkan ID
- **DELETE /assets/depreciation/:id** - Menghapus data depresiasi asset berdasarkan ID
- dan seterusnya untuk endpoint DELETE lainnya sesuai dengan fitur yang telah ditentukan

# 6 Logika Bisnis & Mesin Status (Workflow State Machine)

Bagian ini mendokumentasikan bagaimana backend mengeksekusi kompleksitas matriks Approval dari PRD. Setiap transaksi (Permintaan, Peminjaman, Pengembalian, Serah Terima, Lapor Rusak, Proyek) memiliki state machine yang mengatur status dan transisi berdasarkan aksi pengguna dan aturan bisnis yang berlaku. State machine ini memastikan bahwa setiap transaksi mengikuti alur yang benar dan mematuhi aturan persetujuan yang telah ditetapkan.

## 6.1 Algoritma Approval Workflow

Sistem backend akan menggunakan tabel relasi dinamis untuk mengecek tahapan approval. Ketika pengguna membuat permintaan baru, sistem akan menentukan alur approval berdasarkan role dan divisi pengguna tersebut. Setiap tahapan approval akan memiliki aturan yang berbeda, misalnya:
// Contoh alur approval untuk permintaan baru yang dibuat oleh staff divisi A

- Tahap 1: Approval Leader (hanya untuk permintaan yang dibuat oleh staff di bawahnya)
- Tahap 2: Approval Admin Logistik (untuk tahapan validasi stock dan ketersediaan asset)
- Tahap 3: Approval Admin Purchase (untuk tahapan validasi pembelian asset baru jika diperlukan)
- Tahap 4: Approval Superadmin (untuk tahapan finalisasi dan eksekusi permintaan)
  Setiap tahapan approval akan memiliki status yang jelas (Pending, Approved, Rejected) dan sistem akan mengirim notifikasi kepada pengguna terkait setiap kali terjadi perubahan status. Jika permintaan disetujui di semua tahapan, maka status akhir akan menjadi Approved. Jika ada penolakan di salah satu tahapan, maka status akhir akan menjadi Rejected.

Pelacakan Transisi Status (Approval History): Untuk menghindari bottleneck pada proses persetujuan dan menjamin akuntabilitas, sistem akan merekam setiap transisi state machine ke dalam entitas ApprovalHistory. Entitas ini mencatat ID transaksi terkait, pengguna yang melakukan action, status sebelumnya (previous state), status baru (next state), timestamp, dan catatan/keterangan penolakan (jika ditolak). Riwayat ini digunakan untuk membangun garis waktu (timeline) persetujuan di UI Frontend sehingga pengguna dapat melacak dokumen mereka sedang "tertahan" di pihak mana.

Delegasi & SLA (Service Level Agreement): Bagaimana jika seorang Leader atau Superadmin sedang cuti? Sistem approval yang kaku bisa menjadi bottleneck. Pertimbangkan untuk merancang fitur "Delegasi Approval" sementara, atau notifikasi eskalasi otomatis jika sebuah tiket berstatus Pending lebih dari X hari kerja.

// Dan seterusnya untuk alur approval lainnya sesuai dengan jenis transaksi dan aturan bisnis yang berlaku

# 7 Arsitektur Infrastruktur & Deployment

Menjamin spesifikasi NFR terkait skalabilitas, ketersediaan 99.9%, dan lingkungan kerja yang aman.

## 7.1 Topologi & Containerization

- Backend dan Frontend akan di-deploy sebagai container terpisah menggunakan Docker, dengan konfigurasi yang diatur melalui docker-compose untuk memudahkan pengelolaan lingkungan pengembangan pada server pengembangan dan lingkungan produksi pada server produksi.
- Database PostgreSQL akan di-deploy sebagai container terpisah dengan volume untuk persistensi data, dan konfigurasi jaringan yang memungkinkan komunikasi yang aman antara backend dan database.
- Infrastruktur akan dirancang untuk mendukung skalabilitas horizontal, dengan kemampuan untuk menambah instance backend dan frontend sesuai kebutuhan untuk menangani peningkatan beban pengguna dan transaksi.
- Load balancer akan digunakan untuk mendistribusikan trafik secara merata ke instance backend dan frontend, memastikan ketersediaan yang tinggi dan respons yang cepat bagi pengguna.
- Setiap container akan dikonfigurasi dengan variabel lingkungan yang aman untuk mengelola kredensial dan konfigurasi lainnya, serta menggunakan jaringan internal untuk komunikasi antar container guna meningkatkan keamanan.
- Backup dan monitoring akan diimplementasikan untuk memastikan data aman dan kinerja sistem tetap optimal, dengan alerting untuk mendeteksi dan merespons masalah secara proaktif.
- Infrastruktur akan dirancang untuk mendukung deployment yang mulus dan rollback yang cepat jika terjadi masalah, dengan strategi deployment seperti blue-green atau canary deployment untuk meminimalkan downtime dan risiko selama proses deployment.
- Dokumentasi lengkap tentang konfigurasi Docker, docker-compose, dan strategi deployment akan disediakan untuk memastikan tim pengembangan dapat dengan mudah memahami dan mengelola infrastruktur yang telah dibangun.
- Web Server / Reverse Proxy Nginx mengarahkan trafik dari port 80/443 (HTTP/HTTPS) ke kontainer Frontend dan Backend.
- Frontend Container: ReactJS dijalankan menggunakan server ringan (seperti Nginx Alpine) untuk menyajikan static files hasil build.
- Backend Container: Node.js (NestJS) berjalan pada port internal (misal 3000). Hanya dapat diakses oleh Load Balancer.
- Database Container: PostgreSQL berjalan pada port internal (misal 5432) dengan volume terisolasi untuk data persisten. Port 5432 tidak diekspos ke publik, hanya beroperasi pada jaringan Docker internal.
- Database Connection Management: Untuk menangani lonjakan trafik dan multiple instance dari Backend NestJS, koneksi ke PostgreSQL akan dikelola menggunakan Connection Pooling. Di level aplikasi, PrismaClient akan dikonfigurasi dengan limit koneksi yang optimal. Jika skala deployment meningkat secara signifikan, sebuah container independen berisi PgBouncer akan disisipkan di antara Backend dan PostgreSQL untuk bertindak sebagai connection pooler terpusat, mencegah database connection exhaustion (kehabisan koneksi).
- Redis Container: Redis berjalan pada port internal (misal 6379) untuk caching dan session management. Port 6379 tidak diekspos ke publik, hanya beroperasi pada jaringan Docker internal.
- Load Balancer (misal Nginx atau HAProxy) mendistribusikan trafik ke beberapa instance Backend untuk skalabilitas dan ketersediaan tinggi. Load Balancer juga menangani SSL termination untuk keamanan komunikasi.
- Setiap container dikonfigurasi dengan variabel lingkungan yang aman untuk mengelola kredensial dan konfigurasi lainnya, serta menggunakan jaringan internal untuk komunikasi antar container guna meningkatkan keamanan.

## 7.2 CI/CD Pipeline (GitHub Actions)

- Code Commit & PR: Menjalankan pnpm run lint dan pengujian unit untuk memastikan kualitas kode sebelum merge ke main branch.
- Build Phase: Docker melakukan build image untuk frontend dan backend.
- Push: Mengunggah image ke Container Registry (DockerHub / GitHub Packages).
- Deploy: Melakukan koneksi SSH ke VPS/Server Production, mengeksekusi docker-compose pull && docker-compose up -d, serta menjalankan npx prisma migrate deploy untuk pembaruan database (untuk hotreload tanpa downtime dan data di produksi tetap aman tidak terpengaruh saat proses deployment).
- Build & Test: Setelah merge, pipeline akan membangun image Docker untuk frontend dan backend, menjalankan pengujian integrasi, dan melakukan static code analysis untuk mendeteksi potensi masalah keamanan atau kualitas kode.
- Deployment: Jika semua tahap sebelumnya berhasil, pipeline akan mendorong image Docker ke registry (seperti Docker Hub atau GitHub Container Registry) dan melakukan deployment otomatis ke lingkungan staging untuk pengujian lebih lanjut. Setelah pengujian di staging berhasil, deployment ke produksi dapat dilakukan secara otomatis atau dengan persetujuan manual untuk memastikan kontrol penuh atas proses deployment.
- Dokumentasi lengkap tentang pipeline CI/CD akan disediakan, termasuk konfigurasi GitHub Actions, strategi branching, dan prosedur rollback untuk memastikan tim pengembangan dapat dengan mudah memahami dan mengelola proses deployment yang telah dibangun.
- Migrasi Database Nol Downtime: Pada bagian CI/CD disebutkan npx prisma migrate deploy. Eksekusi ini aman, namun untuk tabel yang sangat besar, perubahan skema tertentu bisa mengunci tabel (table lock). Perlu ada catatan di SDD bahwa perubahan skema (migration) yang bersifat destruktif atau berat harus dilakukan dengan metode expand-and-contract agar tidak ada downtime di production. Metode ini melibatkan langkah-langkah seperti menambahkan kolom baru terlebih dahulu, memigrasi data secara bertahap, dan kemudian menghapus kolom lama setelah data berhasil dipindahkan, sehingga memastikan bahwa aplikasi tetap berjalan tanpa gangguan selama proses migrasi.

# 8 Keamanan, Kepatuhan, & Audit (Security & NFR)

Mendokumentasikan bagaimana sistem menangani kerentanan dan memenuhi spesifikasi pelacakan dari PRD.

## 8.1 Keamanan Aplikasi (OSI Layer 7)

- Autentikasi & Sesi: Menggunakan JWT (JSON Web Token) dengan implementasi token akses singkat (misal 15 menit) dan token penyegaran (refresh token). Refresh token disimpan dengan aman di database dan memiliki masa berlaku yang lebih lama (misal 7 hari). Setiap kali pengguna melakukan refresh token, token penyegaran yang lama akan dihapus dan digantikan dengan yang baru untuk mencegah penyalahgunaan.
- Otorisasi & RBAC: Implementasi Role-Based Access Control (RBAC) dengan role yang telah ditentukan (Superadmin, Admin Logistik, Admin Purchase, Leader, Staff). Setiap endpoint API akan dilindungi dengan guard yang memeriksa peran pengguna dan memastikan hanya pengguna dengan izin yang sesuai yang dapat mengaksesnya. Otorisasi (RBAC): NestJS Custom Guard (@Roles(Role.SUPER_ADMIN)) akan mengunci endpoint di tingkat controller.
- Proteksi Input: NestJS Validation Pipe dengan class-validator untuk mencegah eksploitasi dan injeksi karakter berbahaya pada form. Semua input dari pengguna akan divalidasi secara ketat untuk memastikan bahwa data yang diterima sesuai dengan format yang diharapkan dan tidak mengandung konten berbahaya.
- Proteksi CSRF: Implementasi token CSRF untuk melindungi endpoint yang memodifikasi data (POST, PUT, DELETE) dari serangan Cross-Site Request Forgery. Token CSRF akan dihasilkan dan diverifikasi untuk setiap permintaan yang memodifikasi data untuk memastikan bahwa permintaan tersebut berasal dari sumber yang sah.
- Proteksi XSS: Sanitasi output dan penggunaan Content Security Policy (CSP) untuk mencegah serangan Cross-Site Scripting. Semua data yang dikirim kembali ke klien akan disanitasi untuk memastikan bahwa tidak ada skrip berbahaya yang dapat dieksekusi di sisi klien.
- Proteksi SQL Injection: Penggunaan ORM (Prisma) dengan parameterized queries untuk mencegah serangan SQL Injection. Semua query ke database akan dilakukan melalui ORM yang secara otomatis menangani parameterisasi untuk mencegah injeksi SQL.
- Proteksi Brute Force: Implementasi rate limiting pada endpoint login untuk mencegah serangan brute force. Setiap upaya login yang gagal akan dihitung, dan jika jumlahnya melebihi batas yang ditentukan dalam jangka waktu tertentu, akses ke endpoint login akan diblokir sementara untuk mencegah serangan lebih lanjut. 3 kali percobaan login blok selama 30 detik, 4 kalai percobaan login blok selama 1 menit, 5 kali percobaan login blok selama 5 menit, dan seterusnya sampai percobaan ke 7 akun terblok dan memerlukan intervensi administrator untuk membuka blokir.
- Proteksi DDoS: Implementasi rate limiting dan penggunaan firewall untuk melindungi aplikasi dari serangan Distributed Denial of Service (DDoS). Rate limiting akan diterapkan pada semua endpoint untuk membatasi jumlah permintaan yang dapat dilakukan oleh satu sumber dalam jangka waktu tertentu, sementara firewall akan digunakan untuk memantau dan memblokir lalu lintas yang mencurigakan atau berbahaya.
- Proteksi Data Sensitif: Enkripsi data sensitif seperti password dan token di database menggunakan algoritma hashing yang kuat (misal bcrypt) untuk memastikan bahwa data tersebut tidak dapat diakses atau digunakan oleh pihak yang tidak berwenang.
- Proteksi API: Implementasi API Gateway untuk mengelola dan mengamankan akses ke API, termasuk autentikasi, otorisasi, dan pembatasan laju (rate limiting) untuk melindungi API dari penyalahgunaan dan serangan.
- Tidak memnampilkan data sensitif pada browser console, log, atau error message yang dapat diakses oleh pengguna atau pihak yang tidak berwenang. Data sensitif seperti password, token, atau informasi pribadi lainnya akan disembunyikan atau dienkripsi dalam log dan pesan error untuk mencegah kebocoran informasi yang dapat digunakan untuk serangan lebih lanjut. Misalnya, jika terjadi error saat login, pesan error yang dikembalikan akan bersifat umum dan tidak mengungkapkan apakah username atau password yang salah, untuk mencegah penyerang mendapatkan informasi tentang validitas username atau password. Selain itu, data sensitif yang mungkin muncul dalam log atau pesan error akan dienkripsi atau disamarkan untuk memastikan bahwa informasi tersebut tidak dapat diakses oleh pihak yang tidak berwenang. Header, body, atau query params yang mengandung data sensitif akan diproses untuk menyembunyikan informasi tersebut dalam log dan pesan error, sehingga meningkatkan keamanan aplikasi secara keseluruhan. Handling error dengan cara yang aman dan tidak mengungkapkan informasi sensitif kepada pengguna atau penyerang potensial adalah bagian penting dari strategi keamanan aplikasi.

## 8.2 Keamanan Infrastruktur (OSI Layer 3-4)

- Firewall: Konfigurasi firewall untuk membatasi akses ke port yang diperlukan saja (misal 80/443 untuk HTTP/HTTPS, 3000 untuk Backend, 5432 untuk Database, 6379 untuk Redis) dan memblokir akses dari IP yang mencurigakan atau tidak dikenal.
- Enkripsi Data: Menggunakan enkripsi untuk data yang disimpan (data at rest) dan data yang ditransmisikan (data in transit) untuk melindungi informasi sensitif dari akses yang tidak sah. Data at rest akan dienkripsi menggunakan algoritma yang kuat, sementara data in transit akan dilindungi dengan SSL/TLS untuk memastikan keamanan komunikasi antara klien dan server.
- Keamanan Jaringan: Implementasi Virtual Private Network (VPN) untuk akses internal ke server, serta segmentasi jaringan untuk memisahkan layanan dan meningkatkan keamanan. Akses ke server akan dibatasi hanya melalui VPN, dan jaringan akan diatur sedemikian rupa untuk memastikan bahwa layanan yang berbeda berada dalam segmen yang terpisah untuk mengurangi risiko penyebaran serangan jika terjadi pelanggaran keamanan.
- Keamanan Server: Konfigurasi server dengan patch keamanan terbaru, penggunaan sistem operasi yang aman, dan pengaturan akses yang ketat untuk mencegah akses tidak sah ke server. Server akan diperbarui secara rutin dengan patch keamanan terbaru, dan hanya pengguna yang memiliki izin yang sesuai yang akan diberikan akses ke server melalui SSH atau metode lainnya.

## 8.3 Implementasi Audit Trail & Soft Delete

- Audit Trail Interceptor: Middleware/Interceptor global di NestJS akan menangkap setiap request dengan metode POST, PUT, PATCH, dan DELETE. Sistem akan membaca payload pengguna yang terautentikasi (req.user.id) dan menyimpan log perubahan (Before dan After state) ke dalam tabel AuditLog tanpa mengganggu waktu respons utama Implementasi audit trail untuk mencatat semua perubahan data penting, termasuk siapa yang melakukan perubahan, kapan perubahan dilakukan, dan apa yang diubah. Audit trail akan disimpan secara aman dan hanya dapat diakses oleh pengguna yang memiliki izin yang sesuai. Setiap perubahan pada data penting seperti asset, transaksi, atau pelanggan akan dicatat dalam audit trail untuk memastikan transparansi dan akuntabilitas dalam sistem.
- Soft Delete: Diimplementasikan melalui Prisma Middleware atau Prisma Extension. Saat ada perintah prisma.asset.delete(), ekstensi secara otomatis mengubah query menjadi prisma.asset.update({ data: { isDeleted: true } }). Alih-alih menghapus data secara permanen, sistem akan menggunakan soft delete dengan menambahkan field isDeleted (boolean) pada tabel yang relevan. Data yang dihapus akan tetap ada di database tetapi tidak akan ditampilkan dalam query normal, memungkinkan pemulihan data jika diperlukan dan menjaga integritas referensial.
- Optimasi Penyimpanan Audit Log (Table Partitioning): Mengingat tingginya volume operasi mutasi (POST, PUT, PATCH, DELETE) yang akan dicatat, tabel AuditLog akan menggunakan mekanisme Table Partitioning bawaan PostgreSQL. Partisi akan dilakukan secara dinamis berdasarkan rentang waktu (misalnya, partisi bulanan: audit_logs_2026_04, audit_logs_2026_05). Hal ini menjamin performa query tetap stabil seiring membesarnya ukuran tabel dan memudahkan proses archiving data historis yang sudah usang.

## 8.4 Penanganan Kerentanan & Patch Management

- Penanganan Kerentanan: Proses untuk mengidentifikasi, menilai, dan mengatasi kerentanan keamanan dalam sistem. Ini termasuk pemantauan rutin, pemindaian kerentanan, dan penerapan patch keamanan untuk mengurangi risiko serangan.
- Patch Management: Proses untuk memastikan bahwa semua perangkat lunak dan sistem diperbarui dengan patch keamanan terbaru. Ini termasuk pengujian patch sebelum diterapkan, penerapan patch secara terjadwal, dan pemantauan untuk memastikan patch diterapkan dengan benar.
- Proses penanganan kerentanan dan patch management akan diintegrasikan ke dalam siklus pengembangan dan operasi untuk memastikan bahwa sistem tetap aman dan terlindungi dari ancaman yang berkembang.
- Setiap kerentanan yang ditemukan akan segera ditangani dengan langkah-langkah yang sesuai, termasuk penerapan patch, pembaruan konfigurasi, atau tindakan mitigasi lainnya untuk memastikan keamanan sistem tetap terjaga.
- Sistem akan memiliki prosedur yang jelas untuk menangani kerentanan, termasuk pelaporan, penilaian risiko, dan tindakan perbaikan untuk memastikan bahwa setiap kerentanan ditangani dengan cepat dan efektif.
- Tim pengembangan akan secara rutin melakukan pemindaian kerentanan dan audit keamanan untuk mengidentifikasi potensi risiko dan memastikan bahwa sistem tetap aman dari ancaman yang berkembang selama jangka waktu garansi dan setelahnya diserahkan ke tim internal untuk maintenance.
- Tim pengembangan akan bekerja sama dengan tim keamanan untuk memastikan bahwa setiap kerentanan yang ditemukan ditangani dengan cepat dan efektif, serta memastikan bahwa sistem tetap aman dan terlindungi dari ancaman yang berkembang selama jangka waktu garansi dan setelahnya diserahkan ke tim internal untuk maintenance.

## 8.5 Kepatuhan & Standar Industri

- Kepatuhan terhadap standar industri seperti OWASP Top 10 untuk memastikan bahwa aplikasi terlindungi dari kerentanan umum yang dapat dieksploitasi oleh penyerang.
- Kepatuhan terhadap regulasi yang relevan seperti GDPR untuk memastikan bahwa data pengguna dikelola dengan aman dan sesuai dengan persyaratan hukum yang berlaku.
- Implementasi kebijakan privasi dan perlindungan data yang sesuai untuk memastikan bahwa data pengguna dikelola dengan aman dan sesuai dengan persyaratan hukum yang berlaku di Indonesia.

# 9 Dokumentasi & Testing

Agar mematuhi spesifikasi NFR terkait dokumentasi dan testing, bagian ini mendokumentasikan bagaimana sistem akan didokumentasikan secara menyeluruh dan strategi pengujian yang akan diterapkan untuk memastikan kualitas dan keandalan aplikasi.

## 9.1 Dokumentasi API (Swagger/OpenAPI)

- Setiap endpoint API akan didokumentasikan dengan jelas menggunakan Swagger/OpenAPI, termasuk deskripsi endpoint, parameter yang diperlukan, format respons, dan contoh penggunaan. Dokumentasi API akan tersedia secara online dan dapat diakses oleh tim pengembangan untuk referensi untuk pengembangan dan pemeliharaan aplikasi via server development serta diberikan username dan password. Untuk server produksi, dokumentasi API tidak dapat diakses oleh publik untuk menjaga keamanan informasi tentang struktur API yang digunakan dalam aplikasi.
- Dokumentasi API akan diperbarui secara rutin untuk mencerminkan perubahan atau penambahan fitur baru, serta untuk memastikan bahwa informasi yang disediakan tetap akurat dan relevan bagi tim pengembangan.
- Dokumentasi API akan mencakup informasi tentang autentikasi, otorisasi, dan keamanan yang diperlukan untuk mengakses setiap endpoint, serta contoh respons untuk berbagai status code yang mungkin dikembalikan oleh API
- Dokumentasi API akan disusun dengan cara yang mudah dipahami dan diikuti oleh pengembang, dengan penggunaan bahasa yang jelas dan contoh yang relevan untuk membantu pengembang memahami cara menggunakan API dengan benar dan efektif.

// Contoh dokumentasi API untuk endpoint GET /api/v1/assets menggunakan Swagger/OpenAPI

```yaml
# Contoh OpenAPI Specification untuk endpoint GET /api/v1/assets
openapi: 3.0.0
info:
  title: Asset Management API
  version: 1.0.0
  description: API untuk mengelola aset, transaksi, pelanggan, dan pengaturan dalam sistem manajemen aset.
servers:
  - url: https://dev.tmi.net.id/api/v1/docs
    description: Development server
paths:
  /assets:
    get:
      summary: Mendapatkan daftar asset dengan pagination dan filter
      description: Endpoint ini digunakan untuk mendapatkan daftar asset dengan opsi pagination dan filter berdasarkan kategori, tipe, model, status, dan tanggal pembelian.
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
          description: Halaman yang ingin diambil (default: 1)
        - in: query
          name: limit
          schema:
            type: integer
            default: 10
          description: Jumlah item per halaman (default: 10)
        - in: query
          name: status
          schema:
            type: string
            enum: [AVAILABLE, LOANED, MAINTENANCE, DISMANTLED]
          description: Filter berdasarkan status asset
        - in: query
          name: categoryId
          schema:
            type: string
          description: Filter berdasarkan ID kategori asset
        - in: query
          name: typeId
          schema:
            type: string
          description: Filter berdasarkan ID tipe asset
        - in: query
          name: modelId
          schema:
            type: string
          description: Filter berdasarkan ID model asset
        - in: query
          name: purchaseDateFrom
          schema:
            type: string
            format: date
          description: Filter berdasarkan tanggal pembelian mulai dari (format YYYY-MM-DD)
        - in: query
          name: purchaseDateTo
          schema:
            type: string
            format: date
          description: Filter berdasarkan tanggal pembelian hingga (format YYYY-MM-DD)
      # Dan seterusnya ...
      responses:
        '200':
          description: Berhasil mengambil data aset dengan pagination dan filter yang diterapkan.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AssetListResponse'
        '400':
          description: Bad Request - Parameter query tidak valid atau tidak sesuai dengan format yang diharapkan.
        '401':
          description: Unauthorized - Token tidak valid atau sudah expired.
        '403':
          description: Forbidden - Pengguna tidak memiliki izin untuk mengakses resource ini.
        '404':
          description: Not Found - Resource yang dicari tidak ditemukan.
        '500':
          description: Internal Server Error - Terjadi kesalahan pada server. Silakan coba lagi nanti.
        # Dan seterusnya..
```

## 9.2 Dokumentasi Kode & Arsitektur

## 9.3 Testing Strategy (Unit, Integration, E2E)

## 9.4 Test Coverage & Quality Gates

## 9.5 Mocking & Test Data Management

## 9.6 Continuous Testing dalam CI/CD Pipeline
