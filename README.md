# Trinity Inventory Apps

**Sistem Manajemen Inventaris & Aset Perusahaan** — Fullstack monorepo application untuk pengelolaan aset, transaksi, pembelian, proyek infrastruktur, dan layanan pelanggan.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

---

## Daftar Isi

- [Ringkasan Proyek](#ringkasan-proyek)
- [Arsitektur](#arsitektur)
- [Tech Stack](#tech-stack)
- [Fitur Utama](#fitur-utama)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Perintah Penting](#perintah-penting)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Database Schema](#database-schema)
- [Sistem Role & Permission (RBAC)](#sistem-role--permission-rbac)
- [Dokumentasi Lengkap (WAJIB BACA)](#dokumentasi-lengkap-wajib-baca)
- [Quality Gate](#quality-gate)
- [Deployment](#deployment)
- [Konvensi & Standar](#konvensi--standar)
- [Lisensi](#lisensi)

---

## Ringkasan Proyek

Trinity Inventory Apps adalah sistem enterprise-grade untuk:

- **Manajemen Aset** — Registrasi, pelacakan, depresiasi, QR code per aset
- **Transaksi Inventaris** — Permintaan barang, peminjaman, pengembalian, serah terima, dan perbaikan
- **Pembelian** — Master data pembelian, garansi, dan kalkulasi depresiasi
- **Proyek Infrastruktur** — Manajemen proyek, material, tim, dan task
- **Layanan Pelanggan** — Instalasi, maintenance, dismantle, dan tracking material
- **Approval Workflow** — Multi-level approval chain dengan 3 pola persetujuan
- **Export/Import** — Bulk data operasi via Excel/CSV
- **Dashboard & Reporting** — Statistik real-time, chart, dan summary

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (Reverse Proxy)                │
│                         Port 80/443                         │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐   ┌───────────────────────────────┐
│   Frontend (React 19)   │   │    Backend (NestJS 11)        │
│   Vite + shadcn/ui      │   │    REST API + JWT Auth        │
│   Port 5173 (dev)       │   │    Port 3001                  │
│   Static via Nginx      │   │    Global prefix: /api/v1     │
└─────────────────────────┘   └──────┬──────────────┬─────────┘
                                     │              │
                              ┌──────▼──────┐ ┌────▼──────┐
                              │ PostgreSQL  │ │   Redis   │
                              │  16-alpine  │ │ 7-alpine  │
                              │  Port 5432  │ │ Port 6379 │
                              └─────────────┘ └───────────┘
```

**API Pattern**: `{ success: boolean, data: T, meta?: PaginationMeta, error?: ErrorDetail }`

---

## Tech Stack

| Layer        | Teknologi                                                       |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 19, Vite 8, TypeScript 6, Tailwind CSS 3, shadcn/ui       |
| **State**    | Zustand 5 (global), TanStack React Query 5 (server state)       |
| **Forms**    | react-hook-form 7 + Zod 4                                       |
| **Tables**   | TanStack React Table 8                                          |
| **Routing**  | react-router-dom 7 (lazy loading)                               |
| **Backend**  | NestJS 11, TypeScript, Passport JWT, class-validator            |
| **Database** | PostgreSQL 16, Prisma 7 ORM (multi-file schema)                 |
| **Cache**    | Redis 7 (via ioredis + cache-manager)                           |
| **Security** | Helmet, Throttler, bcrypt, JWT + Refresh Token Rotation         |
| **Export**   | ExcelJS, PDFKit, QRCode                                         |
| **Infra**    | Docker Compose, Nginx, Husky, lint-staged, Conventional Commits |
| **Testing**  | Jest (backend), Vitest (frontend), MSW (mocking)                |

---

## Fitur Utama

### Modul Inti

| Modul             | Deskripsi                                            | Status      |
| ----------------- | ---------------------------------------------------- | ----------- |
| **Auth**          | Login, JWT, refresh token, RBAC 5 role               | ✅ Complete |
| **Dashboard**     | Statistik aset, chart, summary per role              | ✅ Complete |
| **Settings**      | CRUD Users, Divisions, profil                        | ✅ Complete |
| **Assets**        | Kategori → Type → Model → Asset, QR code, depresiasi | ✅ Complete |
| **Transactions**  | Request, Loan, Return, Handover, Repair              | ✅ Complete |
| **Customers**     | Customer, Installation, Maintenance, Dismantle       | ✅ Complete |
| **Purchases**     | Master data pembelian, garansi, depresiasi           | ✅ Complete |
| **Projects**      | InfraProject, Task, Material, Team                   | ✅ Complete |
| **Export/Import** | Excel/CSV bulk operations                            | ✅ Complete |
| **Notifications** | Sistem notifikasi per role                           | ✅ Complete |

### Fitur Cross-Cutting

- **Multi-level Approval Chain** — 3 pola persetujuan (sequential, parallel, threshold)
- **QR Code** — Generate & scan QR per aset
- **File Upload** — Attachment pada transaksi dan aset
- **Audit Trail** — Activity logging pada setiap operasi
- **Auto Sync Data** — SSE-based real-time synchronization antar admin (lihat [AUTO_SYNC_DATA.md](.github/docs/03_OPERATIONS/AUTO_SYNC_DATA.md))

---

## Struktur Proyek

```
trinity-inventory-apps/
├── apps/
│   ├── frontend/                # React 19 + Vite
│   │   ├── src/
│   │   │   ├── components/      # Shared UI (shadcn/ui, layout, form, guard)
│   │   │   ├── features/        # Feature modules (assets, auth, customers, ...)
│   │   │   │   └── <name>/
│   │   │   │       ├── pages/
│   │   │   │       ├── api/
│   │   │   │       ├── hooks/
│   │   │   │       └── components/
│   │   │   ├── hooks/           # Shared hooks
│   │   │   ├── lib/             # Utilities (axios, utils, export-import)
│   │   │   ├── routes/          # Route definitions (protected, public)
│   │   │   ├── store/           # Zustand stores
│   │   │   ├── types/           # Shared TypeScript types
│   │   │   └── validation/      # Zod schemas
│   │   └── public/
│   │
│   └── backend/                 # NestJS 11
│       ├── src/
│       │   ├── common/          # Decorators, DTOs, filters, guards, interceptors, pipes
│       │   ├── core/            # Auth, Config, Database, Notifications
│       │   ├── generated/       # Prisma Client (auto-generated)
│       │   └── modules/         # Feature modules
│       │       ├── assets/
│       │       ├── customers/
│       │       ├── dashboards/
│       │       ├── exports/
│       │       ├── imports/
│       │       ├── qrcode/
│       │       ├── settings/
│       │       ├── transactions/
│       │       └── uploads/
│       ├── prisma/
│       │   ├── schema/          # Multi-file Prisma schema
│       │   │   ├── schema.prisma
│       │   │   ├── auth.prisma
│       │   │   ├── asset.prisma
│       │   │   ├── transaction.prisma
│       │   │   ├── purchase.prisma
│       │   │   ├── project.prisma
│       │   │   └── customer.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       └── test/
│
├── nginx/                       # Nginx reverse proxy config
├── .github/
│   ├── docs/                    # 📚 DOKUMENTASI LENGKAP (WAJIB BACA)
│   ├── instructions/            # AI Orchestrator instructions
│   ├── skills/                  # AI Agent skills
│   └── agents/                  # AI Agent definitions
│
├── docker-compose.yml           # Full stack containerization
├── package.json                 # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
├── eslint.config.mjs
└── commitlint.config.js
```

---

## Prasyarat

| Tool        | Versi Minimum | Keterangan               |
| ----------- | ------------- | ------------------------ |
| **Node.js** | 20.x+         | LTS recommended          |
| **pnpm**    | 10.18+        | Package manager wajib    |
| **Docker**  | 24.x+         | Untuk PostgreSQL & Redis |
| **Git**     | 2.40+         | Conventional commits     |

---

## Instalasi & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Asamaludi26/trinity-inventory-apps.git
cd trinity-inventory-apps
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Sesuaikan variabel di .env (lihat bagian Konfigurasi Environment)
```

### 4. Jalankan Database (Docker)

```bash
docker compose up -d postgres redis
```

### 5. Setup Database

```bash
# Generate Prisma Client
cd apps/backend
pnpm prisma generate

# Jalankan migration
pnpm prisma migrate dev

# Seed data awal
pnpm prisma:seed
```

---

## Menjalankan Aplikasi

### Development (Lokal)

```bash
# Terminal 1 — Backend
pnpm --filter backend start:dev

# Terminal 2 — Frontend
pnpm --filter frontend dev
```

| Service  | URL                               |
| -------- | --------------------------------- |
| Frontend | http://localhost:5173             |
| Backend  | http://localhost:3001             |
| Swagger  | http://localhost:3001/api/v1/docs |

### Login Default

| Role       | Email                    | Password        |
| ---------- | ------------------------ | --------------- |
| Superadmin | superadmin@trinity.local | SuperAdmin@2026 |

### Production (Docker Compose)

```bash
# Build & start semua services
docker compose up -d --build

# Akses via Nginx
# http://localhost (port 80)
```

---

## Perintah Penting

### Development

```bash
# Start dev servers
pnpm --filter frontend dev              # Frontend dev server
pnpm --filter backend start:dev         # Backend dev server (--watch)

# Build
pnpm --filter frontend build            # Build frontend (dist/)
pnpm --filter backend build             # Build backend (dist/)
```

### Quality Gate (WAJIB sebelum commit)

```bash
pnpm --filter ./apps/frontend/ lint      # ESLint frontend
pnpm --filter ./apps/frontend/ typecheck # TypeScript check frontend
pnpm --filter ./apps/backend/ lint       # ESLint backend
```

### Database

```bash
cd apps/backend
pnpm prisma generate                     # Generate Prisma Client
pnpm prisma migrate dev                  # Buat & jalankan migration
pnpm prisma migrate deploy               # Deploy migration (production)
pnpm prisma:seed                         # Seed data
pnpm prisma:studio                       # Prisma Studio (port 5555)
```

### Testing

```bash
pnpm --filter backend test               # Unit tests (Jest)
pnpm --filter backend test:cov           # Coverage report
pnpm --filter backend test:e2e           # E2E tests
```

### Docker

```bash
docker compose up -d                     # Start semua services
docker compose up -d postgres redis      # Start database only
docker compose down                      # Stop semua
docker compose logs -f backend           # Follow backend logs
```

---

## Konfigurasi Environment

### Backend (`apps/backend/.env`)

| Variable                 | Deskripsi                    | Default                 |
| ------------------------ | ---------------------------- | ----------------------- |
| `NODE_ENV`               | Environment                  | `development`           |
| `PORT`                   | Port backend                 | `3001`                  |
| `DATABASE_URL`           | PostgreSQL connection string | (wajib)                 |
| `REDIS_HOST`             | Redis host                   | `localhost`             |
| `REDIS_PORT`             | Redis port                   | `6379`                  |
| `REDIS_PASSWORD`         | Redis password               | (opsional)              |
| `JWT_SECRET`             | Secret key JWT               | (wajib, jangan bocor!)  |
| `JWT_REFRESH_SECRET`     | Secret key refresh token     | (wajib, jangan bocor!)  |
| `JWT_EXPIRATION`         | JWT expiry                   | `15m`                   |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiry         | `7d`                    |
| `CORS_ORIGIN`            | Allowed origin               | `http://localhost:5173` |
| `SWAGGER_ENABLED`        | Aktifkan Swagger docs        | `true`                  |
| `UPLOAD_DIR`             | Direktori upload file        | `./uploads`             |

---

## Database Schema

Multi-file Prisma schema dengan 7 domain:

```
prisma/schema/
├── schema.prisma       # Generator, datasource, enum AssetStatus
├── auth.prisma         # User, Division, UserRole enum
├── asset.prisma        # AssetCategory, AssetType, AssetModel, Asset, AssetRegistration
├── transaction.prisma  # Request, Loan, Return, Handover, Repair (+ items)
├── purchase.prisma     # PurchaseMasterData, Depreciation
├── project.prisma      # InfraProject, Task, Material, TeamMember
└── customer.prisma     # Customer, Installation, Maintenance, Dismantle (+ materials)
```

### Model Utama

| Domain        | Models                                                           |
| ------------- | ---------------------------------------------------------------- |
| **Auth**      | User (5 roles), Division                                         |
| **Asset**     | AssetCategory → AssetType → AssetModel → Asset (hierarchical)    |
| **Transaksi** | Request, LoanRequest, AssetReturn, Handover, Repair              |
| **Pembelian** | PurchaseMasterData, Depreciation                                 |
| **Proyek**    | InfraProject, InfraProjectTask, InfraProjectMaterial, TeamMember |
| **Customer**  | Customer, Installation, Maintenance, Dismantle                   |

---

## Sistem Role & Permission (RBAC)

### 5 Role

| Role               | Akses Utama                                |
| ------------------ | ------------------------------------------ |
| **SUPERADMIN**     | Full access, manage users, system settings |
| **ADMIN_LOGISTIK** | Kelola aset, approve transaksi inventaris  |
| **ADMIN_PURCHASE** | Kelola pembelian, vendor, depresiasi       |
| **LEADER**         | Approve request tim, lihat dashboard       |
| **STAFF**          | Buat request, lihat aset yang ditugaskan   |

### Guards

- `JwtAuthGuard` — Autentikasi JWT pada semua endpoint (global)
- `RolesGuard` — Cek role user terhadap `@Roles()` decorator
- `ThrottlerGuard` — Rate limiting (global)

> **Detail lengkap**: Lihat [SECURITY_AND_RBAC_MATRIX.md](.github/docs/02_STANDARDS_AND_PROCEDURES/SECURITY_AND_RBAC_MATRIX.md)

---

## Dokumentasi Lengkap (WAJIB BACA)

> **Semua dokumentasi berada di `.github/docs/`.**  
> Index lengkap: [.github/docs/INDEX.md](.github/docs/INDEX.md)

Dokumentasi ini adalah **referensi wajib** untuk memahami keseluruhan sistem, arsitektur, standar, dan prosedur operasional proyek Trinity Inventory Apps.

### 📋 Business Logic

| Dokumen                        | Path                                                                                                | Deskripsi                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Product Requirements (PRD)** | [01_BUSINESS_LOGIC/PRD.md](.github/docs/01_BUSINESS_LOGIC/PRD.md)                                   | Kebutuhan produk lengkap — 5 role, 6 modul utama, approval workflow, NFR |
| **System Design (SDD)**        | [01_BUSINESS_LOGIC/SDD.md](.github/docs/01_BUSINESS_LOGIC/SDD.md)                                   | Desain sistem — arsitektur, API spec, database schema, state machine     |
| **UI/UX Design**               | [01_BUSINESS_LOGIC/UIUX_DESIGN_DOCUMENT.md](.github/docs/01_BUSINESS_LOGIC/UIUX_DESIGN_DOCUMENT.md) | Design tokens, typography, component library, wireframes                 |
| **User & System Flow**         | [01_BUSINESS_LOGIC/USER_SYSTEM_FLOW.md](.github/docs/01_BUSINESS_LOGIC/USER_SYSTEM_FLOW.md)         | Alur pengguna & sistem dengan Mermaid diagram                            |
| **User Manual & SOP**          | [01_BUSINESS_LOGIC/USER_MANUAL_SOP.md](.github/docs/01_BUSINESS_LOGIC/USER_MANUAL_SOP.md)           | Panduan penggunaan per role                                              |

### 📐 Standards & Procedures

| Dokumen                  | Path                                                                                                                            | Deskripsi                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **API Contract**         | [02_STANDARDS_AND_PROCEDURES/API_CONTRACT.md](.github/docs/02_STANDARDS_AND_PROCEDURES/API_CONTRACT.md)                         | REST contract, response format, error codes, endpoint catalog |
| **Coding Guidelines**    | [02_STANDARDS_AND_PROCEDURES/CODING_GUIDELINES.md](.github/docs/02_STANDARDS_AND_PROCEDURES/CODING_GUIDELINES.md)               | DRY, KISS, naming convention, pattern backend/frontend        |
| **Error Handling**       | [02_STANDARDS_AND_PROCEDURES/ERROR_HANDLING.md](.github/docs/02_STANDARDS_AND_PROCEDURES/ERROR_HANDLING.md)                     | Exception filter, error types, logging, developer checklist   |
| **Security & RBAC**      | [02_STANDARDS_AND_PROCEDURES/SECURITY_AND_RBAC_MATRIX.md](.github/docs/02_STANDARDS_AND_PROCEDURES/SECURITY_AND_RBAC_MATRIX.md) | OWASP Top 10, bcrypt, JWT, 85+ permissions, RBAC guards       |
| **Tech Stack & ADR**     | [02_STANDARDS_AND_PROCEDURES/TECH_STACK_AND_ADR.md](.github/docs/02_STANDARDS_AND_PROCEDURES/TECH_STACK_AND_ADR.md)             | Keputusan arsitektural dan rationale                          |
| **Git Workflow & CI/CD** | [02_STANDARDS_AND_PROCEDURES/GIT_WORKFLOW_AND_CICD.md](.github/docs/02_STANDARDS_AND_PROCEDURES/GIT_WORKFLOW_AND_CICD.md)       | Branching strategy, conventional commits, pipeline            |

### ⚙️ Operations

| Dokumen                         | Path                                                                                                          | Deskripsi                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Infrastructure & Deployment** | [03_OPERATIONS/INFRASTRUCTURE_AND_DEPLOYMENT.md](.github/docs/03_OPERATIONS/INFRASTRUCTURE_AND_DEPLOYMENT.md) | Docker topology, env config, deployment SOP    |
| **Database Migration & Backup** | [03_OPERATIONS/DATABASE_MIGRATION_AND_BACKUP.md](.github/docs/03_OPERATIONS/DATABASE_MIGRATION_AND_BACKUP.md) | Prisma migration SOP, backup & restore         |
| **Test Plan & UAT**             | [03_OPERATIONS/TEST_PLAN_AND_UAT.md](.github/docs/03_OPERATIONS/TEST_PLAN_AND_UAT.md)                         | Test matrix, UAT checklist, 20+ critical flows |
| **Logging & Monitoring**        | [03_OPERATIONS/LOGGING_AND_MONITORING.md](.github/docs/03_OPERATIONS/LOGGING_AND_MONITORING.md)               | Log standards, Prometheus, Grafana, alerts     |
| **Coverage Analysis**           | [03_OPERATIONS/COVERAGE_ANALYSIS.md](.github/docs/03_OPERATIONS/COVERAGE_ANALYSIS.md)                         | Coverage audit & gap analysis                  |
| **Auto Sync Data (SSE)**        | [03_OPERATIONS/AUTO_SYNC_DATA.md](.github/docs/03_OPERATIONS/AUTO_SYNC_DATA.md)                               | Real-time data synchronization plan            |

### 📝 Lainnya

| Dokumen             | Path                                                                | Deskripsi                |
| ------------------- | ------------------------------------------------------------------- | ------------------------ |
| **Changelog**       | [changelog/ReadMe.md](.github/docs/changelog/ReadMe.md)             | Riwayat perubahan proyek |
| **Troubleshooting** | [troubleshooting/ReadMe.md](.github/docs/troubleshooting/ReadMe.md) | Masalah umum & solusi    |

---

## Quality Gate

Setiap kode yang ditulis **WAJIB** melewati quality gate sebelum commit:

```bash
# SEMUA harus 0 error, 0 warning
pnpm --filter ./apps/frontend/ lint
pnpm --filter ./apps/frontend/ typecheck
pnpm --filter ./apps/backend/ lint
```

> **Warning = Error.** Tidak ada toleransi untuk warning.

### Pre-commit Hooks

Proyek ini menggunakan **Husky** + **lint-staged** yang otomatis menjalankan:

- ESLint fix + Prettier pada file yang di-stage
- Commitlint untuk validasi format commit message

### Conventional Commits

```
type(scope): description

# Contoh:
feat(assets): add QR code generation for asset labels
fix(auth): resolve refresh token rotation issue
docs(readme): update installation guide
```

| Type       | Penggunaan                      |
| ---------- | ------------------------------- |
| `feat`     | Fitur baru                      |
| `fix`      | Bug fix                         |
| `docs`     | Perubahan dokumentasi           |
| `style`    | Formatting (tanpa logic change) |
| `refactor` | Refactoring tanpa feat/fix      |
| `test`     | Menambah/memperbaiki test       |
| `chore`    | Build, tooling, CI              |

---

## Deployment

### Docker Compose (Recommended)

```bash
# 1. Setup .env
cp apps/backend/.env.example apps/backend/.env
# Edit JWT_SECRET, JWT_REFRESH_SECRET, POSTGRES_PASSWORD, dll.

# 2. Build & deploy
docker compose up -d --build

# 3. Run migration (first time)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend pnpm prisma:seed
```

### Topologi Docker

| Container        | Image              | Port | Resource Limit |
| ---------------- | ------------------ | ---- | -------------- |
| trinity-postgres | postgres:16-alpine | 5432 | 512MB, 1 CPU   |
| trinity-redis    | redis:7-alpine     | 6379 | 256MB, 0.5 CPU |
| trinity-backend  | Custom (NestJS)    | 3001 | 512MB, 1 CPU   |
| trinity-nginx    | nginx:alpine       | 80   | -              |

> **Detail lengkap**: [INFRASTRUCTURE_AND_DEPLOYMENT.md](.github/docs/03_OPERATIONS/INFRASTRUCTURE_AND_DEPLOYMENT.md)

---

## Konvensi & Standar

| Aspek                | Standar                                               |
| -------------------- | ----------------------------------------------------- |
| **TypeScript**       | Strict mode, no `any` tanpa justifikasi               |
| **API Response**     | `{ success, data, meta?, error? }`                    |
| **Error Handling**   | Global exception filter, no empty catch               |
| **Naming**           | camelCase (vars), PascalCase (class/component/type)   |
| **File Structure**   | Feature-based modules                                 |
| **State Management** | Zustand (client), TanStack Query (server)             |
| **Forms**            | react-hook-form + Zod schema validation               |
| **CSS**              | Tailwind CSS utility-first, shadcn/ui components      |
| **Database**         | Prisma ORM, parameterized queries, no raw SQL         |
| **Security**         | OWASP Top 10 compliance, bcrypt cost 12, JWT rotation |
| **Commits**          | Conventional Commits via commitlint                   |

> **Detail lengkap**: [CODING_GUIDELINES.md](.github/docs/02_STANDARDS_AND_PROCEDURES/CODING_GUIDELINES.md)

---

## Lisensi

UNLICENSED — Private repository.

---

<div align="center">

**[📚 Dokumentasi Lengkap](.github/docs/INDEX.md)** · **[📋 Changelog](.github/docs/changelog/ReadMe.md)** · **[🔧 Troubleshooting](.github/docs/troubleshooting/ReadMe.md)**

</div>
