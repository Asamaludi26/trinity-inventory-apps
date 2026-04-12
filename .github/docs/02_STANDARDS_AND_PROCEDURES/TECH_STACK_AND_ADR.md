# Tech Stack & Architecture Decision Records (ADR) — Trinity Inventory Apps

**Versi**: 1.0.0
**Tanggal**: 10 April 2026
**Referensi Utama**: PRD v3.1, SDD v3.1
**Status**: FINAL — Setiap perubahan teknologi harus melalui proses Change Request formal.

---

## Daftar Isi

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Detail Versi & Ekosistem](#2-detail-versi--ekosistem)
3. [Architecture Decision Records (ADR)](#3-architecture-decision-records-adr)
4. [Containerization & Environment](#4-containerization--environment)
5. [Dependency Management](#5-dependency-management)

---

## 1. Tech Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│  React 19 · TypeScript 6.0 · Vite 8 · Tailwind 3.4  │
│  Shadcn UI · React Hook Form · Zod 4 · TanStack Query│
│  Zustand · React Router 7                            │
├─────────────────────────────────────────────────────┤
│                    API LAYER                          │
│  NestJS 11 · TypeScript 5.7 · Express 5              │
│  Passport (JWT) · class-validator · Swagger/OpenAPI  │
│  Helmet · compression · rate-limiting                │
├─────────────────────────────────────────────────────┤
│                    DATA LAYER                         │
│  Prisma ORM 7.2 · PostgreSQL 16 · Redis 7            │
│  Multi-file Schema · Soft Delete Extension            │
├─────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                  │
│  Docker · Node 22 · pnpm 10.x · GitHub Actions       │
│  Nginx (reverse proxy) · Prometheus (monitoring)     │
├─────────────────────────────────────────────────────┤
│                   TESTING LAYER                       │
│  Jest (backend) · Vitest (frontend) · Cypress (E2E) │
│  MSW (mock service worker) · axe-core (a11y)        │
└─────────────────────────────────────────────────────┘
```

---

## 2. Detail Versi & Ekosistem

### 2.1 Runtime & Tooling

| Teknologi      | Versi                   | Keterangan                                          |
| -------------- | ----------------------- | --------------------------------------------------- |
| **Node.js**    | 22 (LTS)                | Runtime JavaScript — Docker image: `node:22-alpine` |
| **pnpm**       | 10.18.x                 | Package manager — workspace monorepo support        |
| **TypeScript** | 5.7.3 (BE) / 6.0.2 (FE) | Strict mode enabled di kedua project                |
| **Docker**     | Latest (Compose v2)     | Multi-stage build, resource limits                  |

### 2.2 Frontend

| Teknologi           | Versi    | Fungsi                                   |
| ------------------- | -------- | ---------------------------------------- |
| **React**           | ^19.2.4  | UI library (hooks-based)                 |
| **Vite**            | ^8.0.4   | Build tool & dev server                  |
| **Tailwind CSS**    | ^3.4.19  | Utility-first CSS framework              |
| **Shadcn UI**       | (latest) | Component library (Radix UI primitives)  |
| **TanStack Query**  | ^5.97.0  | Server state management (cache, refetch) |
| **Zustand**         | ^5.0.12  | Client state management                  |
| **React Router**    | ^7.14.0  | Client-side routing                      |
| **React Hook Form** | ^7.72.1  | Form state management                    |
| **Zod**             | ^4.3.6   | Schema validation (form + API)           |
| **Recharts**        | ^2.15.1  | Dashboard charts & graphs                |
| **Lucide React**    | ^1.8.0   | Icon library                             |
| **date-fns**        | ^4.1.0   | Date utility (tree-shakeable)            |
| **Vitest**          | ^3.0.0   | Unit testing framework                   |
| **MSW**             | (latest) | Mock Service Worker for API testing      |
| **axe-core/react**  | (latest) | Runtime accessibility checks             |

### 2.3 Backend

| Teknologi              | Versi    | Fungsi                                       |
| ---------------------- | -------- | -------------------------------------------- |
| **NestJS**             | ^11.0.1  | Application framework (modular architecture) |
| **Express**            | ^5.0.6   | HTTP platform (via @nestjs/platform-express) |
| **Prisma ORM**         | ^7.7.0   | Type-safe database client & migration tool   |
| **@prisma/adapter-pg** | ^7.7.0   | PostgreSQL adapter for Prisma                |
| **@nestjs/jwt**        | ^11.0.2  | JWT token generation & verification          |
| **@nestjs/passport**   | ^11.0.5  | Authentication middleware                    |
| **passport-jwt**       | ^4.0.1   | JWT strategy for Passport                    |
| **class-validator**    | ^0.15.1  | DTO validation decorators                    |
| **class-transformer**  | ^0.5.1   | DTO transformation (type coercion)           |
| **Zod**                | ^3.25.76 | ENV validation, complex schema validation    |
| **bcrypt**             | ^6.0.0   | Password hashing (cost factor ≥ 12)          |
| **helmet**             | ^8.1.0   | Security HTTP headers                        |
| **compression**        | (latest) | Response compression (gzip)                  |
| **cache-manager**      | ^7.2.8   | Caching abstraction layer                    |
| **ioredis**            | ^5.3.2   | Redis client                                 |
| **@nestjs/swagger**    | ^11.1.7  | OpenAPI documentation                        |
| **Jest**               | ^30.0.4  | Unit testing framework                       |
| **@nestjs/testing**    | ^11.1.12 | NestJS testing utilities                     |

### 2.4 Database & Cache

| Teknologi      | Versi     | Keterangan                                    |
| -------------- | --------- | --------------------------------------------- |
| **PostgreSQL** | 16-alpine | Primary database — SCRAM-SHA-256 auth         |
| **Redis**      | 7-alpine  | Cache layer + session store — AOF persistence |

### 2.5 Infrastructure

| Teknologi          | Versi/Config | Keterangan                                     |
| ------------------ | ------------ | ---------------------------------------------- |
| **Nginx**          | Latest       | Reverse proxy, SSL termination, static serving |
| **Prometheus**     | Latest       | Metrics collection & monitoring                |
| **GitHub Actions** | v4           | CI/CD pipeline                                 |

### 2.6 E2E Testing

| Teknologi   | Versi   | Keterangan                              |
| ----------- | ------- | --------------------------------------- |
| **Cypress** | ^13.6.0 | End-to-end testing (browser automation) |

---

## 3. Architecture Decision Records (ADR)

### ADR-001: Monorepo dengan pnpm Workspaces

- **Status**: Accepted
- **Tanggal**: Oktober 2025
- **Konteks**: Proyek terdiri dari 3 package (backend, frontend, e2e) yang berbagi dependensi.
- **Keputusan**: Menggunakan pnpm workspaces untuk mengelola monorepo.
- **Alasan**:
  - **Disk space efficiency**: pnpm menggunakan content-addressable store — dependency yang sama disimpan sekali.
  - **Strict dependency resolution**: Phantom dependencies tidak diizinkan (lebih aman dari npm/yarn).
  - **Native workspace support**: `pnpm --filter backend start:dev` — eksekusi per-package.
  - **Lockfile integrity**: `pnpm-lock.yaml` lebih deterministik.
- **Alternatif yang ditolak**: npm workspaces (hoisting issues), Yarn Berry (complexity), Turborepo (overhead untuk 3 packages).

---

### ADR-002: NestJS sebagai Backend Framework

- **Status**: Accepted
- **Tanggal**: Oktober 2025
- **Konteks**: Butuh framework backend TypeScript yang terstruktur, modular, dan siap enterprise.
- **Keputusan**: Menggunakan NestJS (Angular-inspired architecture).
- **Alasan**:
  - **Modular architecture**: Module → Controller → Service → DTO pattern mencegah kode spaghetti.
  - **Built-in DI (Dependency Injection)**: Testabilitas tinggi — service mudah di-mock.
  - **Decorator-based**: `@Controller()`, `@Get()`, `@Body()` — deklaratif dan bersih.
  - **Guard & Interceptor pattern**: RBAC, audit trail, response transformation mudah diimplementasi secara cross-cutting.
  - **Ekosistem lengkap**: Passport auth, Swagger, Validation Pipe, Config Module — semuanya first-party.
  - **TypeScript-first**: Bukan afterthought — framework didesain dari awal untuk TypeScript.
- **Alternatif yang ditolak**: Express.js murni (tidak terstruktur), Fastify standalone (butuh banyak boilerplate), Hono (terlalu minimalis untuk enterprise).

---

### ADR-003: Prisma ORM untuk Database Access

- **Status**: Accepted
- **Tanggal**: Oktober 2025
- **Konteks**: Butuh ORM TypeScript yang type-safe untuk PostgreSQL.
- **Keputusan**: Menggunakan Prisma ORM dengan multi-file schema.
- **Alasan**:
  - **Type-safety bawaan**: Query result ter-typed otomatis — `prisma.asset.findMany()` return `Asset[]`.
  - **Auto-generated client**: Setelah `prisma generate`, client ter-update sesuai schema.
  - **Migration management**: `prisma migrate dev` untuk migrasi deklaratif.
  - **Multi-file schema**: Schema dipecah per domain bisnis (`auth.prisma`, `asset.prisma`, dll).
  - **Introspection & Studio**: `prisma studio` untuk GUI database browser.
  - **Soft delete extension**: Custom client extension untuk soft delete otomatis.
- **Alternatif yang ditolak**: TypeORM (decorator-heavy, migration fragile), Drizzle (immature ecosystem saat evaluasi), Knex (no type-safety).
- **Trade-off**: Prisma tidak ideal untuk query SQL yang sangat kompleks — fallback ke `$queryRaw` untuk kasus tersebut.

---

### ADR-004: React + Vite untuk Frontend

- **Status**: Accepted
- **Tanggal**: Oktober 2025
- **Konteks**: Butuh SPA framework yang modern, cepat, dan memiliki ekosistem besar.
- **Keputusan**: React 19 dengan Vite sebagai build tool.
- **Alasan**:
  - **React**: Ekosistem terbesar (TanStack Query, React Hook Form, Zustand, dll). Component-based architecture yang matang.
  - **Vite**: HMR instan (<100ms), build cepat (esbuild + Rollup), konfigurasi minimal.
  - **SPA vs SSR**: Aplikasi internal (bukan publik) — tidak butuh SEO, SSR unnecessary overhead.
- **Alternatif yang ditolak**: Next.js (SSR/RSC overhead untuk internal app), Angular (learning curve, opinionated), Vue (ekosistem lebih kecil untuk enterprise tooling).

---

### ADR-005: Zustand + TanStack Query untuk State Management

- **Status**: Accepted
- **Tanggal**: Oktober 2025 (divalidasi April 2026)
- **Konteks**: Butuh strategi state management yang jelas untuk memisahkan server state dan client state.
- **Keputusan**: TanStack Query (server state) + Zustand (client state).
- **Alasan**:
  - **TanStack Query**: Cache otomatis, background refetching, stale-while-revalidate, mutation invalidation. Menghilangkan kebutuhan manual fetch + loading state.
  - **Zustand**: API minimalis (`create()` function), no boilerplate (vs Redux), TypeScript inference sempurna, middleware (persist, devtools).
  - **Separation of Concerns**: Server data (TanStack) dan UI state (Zustand) tidak tercampur.
- **Ownership Matrix**:
  | Data Type | Tool |
  | ------------- | --------------- |
  | Server data | TanStack Query |
  | Auth/session | Zustand+persist |
  | UI state | Zustand |
  | Form state | React Hook Form |
  | URL state | useSearchParams |
  | Ephemeral | useState |
- **Alternatif yang ditolak**: Redux Toolkit (boilerplate berlebihan untuk skala ini), Jotai (atomic model terlalu granular), SWR (TanStack Query lebih feature-rich).

---

### ADR-006: Shadcn UI sebagai Component Library

- **Status**: Accepted
- **Tanggal**: Oktober 2025
- **Konteks**: Butuh design system yang konsisten tanpa lock-in ke third-party.
- **Keputusan**: Shadcn UI (Radix UI primitives + Tailwind CSS styling).
- **Alasan**:
  - **Copy-paste, bukan dependency**: Komponen ada di `src/components/ui/` — full ownership, no version lock-in.
  - **Radix UI foundation**: Accessible primitives (keyboard navigation, screen reader, focus management) tanpa effort manual.
  - **Tailwind native**: Styling konsisten dengan Tailwind design token.
  - **Customizable**: Ubah langsung di source code — tidak perlu theme override yang kompleks.
  - **Dark mode**: Built-in support via CSS variables.
- **Alternatif yang ditolak**: MUI (heavy bundle, opinionated styling), Ant Design (opinionated, non-Tailwind), Chakra UI (performance concerns).

---

### ADR-007: PostgreSQL 16 sebagai Primary Database

- **Status**: Accepted
- **Tanggal**: Oktober 2025
- **Konteks**: Butuh RDBMS yang robust, open-source, dan mendukung JSON queries.
- **Keputusan**: PostgreSQL 16 (alpine image).
- **Alasan**:
  - **ACID compliance**: Transaksi atomik untuk approval workflow yang multi-step.
  - **JSON support**: `jsonb` column untuk flexible data (permissions, metadata).
  - **Full-text search**: `ILIKE`, `tsvector` — mengurangi kebutuhan search engine terpisah.
  - **Performance**: Parallel query execution, JIT compilation.
  - **Prisma compatibility**: First-class support dari Prisma ORM.
  - **Alpine image**: ~80MB (vs ~400MB standard) — efisien untuk container.
- **Alternatif yang ditolak**: MySQL (kurang fitur JSON/CTE), SQLite (tidak cocok untuk concurrent access), MongoDB (not relational — not ideal untuk inventory with complex relations).

---

### ADR-008: JWT dengan Refresh Token Rotation untuk Authentication

- **Status**: Accepted
- **Tanggal**: April 2026 (rebuild)
- **Konteks**: Versi lama tidak memiliki refresh token — sesi bisa dibajak.
- **Keputusan**: Access token (15 menit) + Refresh token (7 hari) dengan rotation.
- **Alasan**:
  - **Stateless verification**: Access token di-verify tanpa query database (JWT signature).
  - **Short-lived access token**: Jika bocor, hanya berlaku 15 menit.
  - **Refresh token rotation**: Setiap refresh menghasilkan token baru — token lama otomatis invalid.
  - **Reuse detection**: Jika refresh token yang sudah di-rotate digunakan lagi → semua token user di-invalidate (compromise protection).
  - **Token version**: Field `tokenVersion` di User model — increment saat force logout.
- **Alternatif yang ditolak**: Session-based auth (stateful, tidak scalable), OAuth2 (over-engineering untuk single-org app).

---

### ADR-009: Permission-Based Authorization (bukan Role-Based)

- **Status**: Accepted
- **Tanggal**: April 2026 (rebuild)
- **Konteks**: RBAC murni terlalu kaku — beberapa user perlu akses di luar role default mereka.
- **Keputusan**: Hybrid — role sebagai base + per-user permission override.
- **Alasan**:
  - **Granularity**: `assets:create`, `loans:approve` — lebih presisi dari `ADMIN_LOGISTIK`.
  - **Flexibility**: Superadmin bisa grant permission tambahan ke user tertentu.
  - **Backward compatible**: Role default tetap berfungsi — permission hanya override.
  - **Single SSoT**: `permissions.constants.ts` mendefinisikan semua permission keys, role defaults, restrictions.
- **Implementasi**:
  - Backend: `@AuthPermissions(PERMISSIONS.ASSETS_CREATE)` — composite decorator.
  - Frontend: `hasPermission(user, 'assets:create')` — guard komponen/rute.
  - Database: `User.permissions` JSON column — override dari role default.

---

### ADR-010: Docker Multi-Stage Build untuk Deployment

- **Status**: Accepted
- **Tanggal**: April 2026
- **Konteks**: Butuh deployment yang reproducible, isolated, dan efisien.
- **Keputusan**: Docker multi-stage build (4 stages).
- **Alasan**:
  - **Stage 1 (base)**: Install OS-level dependencies dan pnpm.
  - **Stage 2 (deps)**: Install npm dependencies sesuai lockfile.
  - **Stage 3 (builder)**: Compile TypeScript, generate Prisma client.
  - **Stage 4 (production)**: Copy hanya build artifacts — image size minimal.
  - **Reproducibility**: Same image = same behavior di semua environment.
  - **Security**: Production image tidak mengandung dev dependencies, source code, atau build tools.
- **Resource limits** (docker-compose):
  - Backend: 512MB memory, 1.0 CPU
  - PostgreSQL: 512MB memory, 1.0 CPU
  - Redis: 256MB memory, 0.5 CPU

---

### ADR-011: Redis untuk Caching & Session Store

- **Status**: Accepted
- **Tanggal**: April 2026
- **Konteks**: Butuh caching layer untuk mengurangi database load pada operasi read-heavy.
- **Keputusan**: Redis 7 (alpine) dengan AOF persistence.
- **Alasan**:
  - **In-memory speed**: Sub-millisecond reads untuk data yang sering diakses (dashboard stats, user permissions).
  - **AOF persistence**: Data tetap ada setelah restart (Append-Only File).
  - **LRU eviction**: Max memory 256MB dengan eviction policy `allkeys-lru`.
  - **JWT cache**: User data di-cache 30 detik (LRU, max 200 entries) — mengurangi DB query per request.
  - **NestJS integration**: `cache-manager` + `ioredis` — transparent caching.
- **Alternatif yang ditolak**: Memcached (no persistence), in-memory only (lost on restart), no caching (database overload risk).

---

## 4. Containerization & Environment

### 4.1 Docker Compose Services

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Nginx     │───→│   Backend   │───→│  PostgreSQL  │
│  (proxy)    │    │  (NestJS)   │───→│    (DB)      │
│  port: 80   │    │  port: 3001 │    │  port: 5432  │
└─────────────┘    └─────────────┘    └─────────────┘
                        │
                   ┌─────────────┐
                   │   Redis     │
                   │  (cache)    │
                   │  port: 6379 │
                   └─────────────┘
```

### 4.2 Docker Image Specs

| Service    | Base Image           | Size (approx.) | Health Check              |
| ---------- | -------------------- | -------------- | ------------------------- |
| Backend    | `node:22-alpine`     | ~180MB         | HTTP GET `/api/v1/health` |
| PostgreSQL | `postgres:16-alpine` | ~80MB          | `pg_isready`              |
| Redis      | `redis:7-alpine`     | ~30MB          | `redis-cli ping`          |
| Nginx      | `nginx:alpine`       | ~25MB          | —                         |

### 4.3 Environment Variables

| Variable                 | Stage        | Contoh                                           |
| ------------------------ | ------------ | ------------------------------------------------ |
| `NODE_ENV`               | all          | `development` / `staging` / `production`         |
| `DATABASE_URL`           | all          | `postgresql://user:pass@db:5432/trinity`         |
| `REDIS_HOST`             | all          | `redis` (container name)                         |
| `REDIS_PASSWORD`         | all          | (dari Docker secret / .env)                      |
| `JWT_SECRET`             | all          | (random 64-char string, rotasi tiap quarter)     |
| `JWT_REFRESH_SECRET`     | all          | (random 64-char string, berbeda dari JWT_SECRET) |
| `JWT_EXPIRATION`         | all          | `15m` (access token)                             |
| `JWT_REFRESH_EXPIRATION` | all          | `7d` (refresh token)                             |
| `CORS_ORIGIN`            | prod/staging | `https://app.trinitimedia.com`                   |
| `SWAGGER_ENABLED`        | dev/staging  | `true` / `false`                                 |
| `PORT`                   | all          | `3001`                                           |
| `UPLOAD_DIR`             | all          | `/app/uploads`                                   |

> **Keamanan**: File `.env` tidak pernah di-commit ke repository. Gunakan `.env.example` sebagai template.

### 4.4 Dockerfile — Multi-Stage Build

```dockerfile
# Stage 1: Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# Stage 4: Production
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
```

---

## 5. Dependency Management

### 5.1 Aturan Update

| Tipe Update | Frekuensi         | Proses                                                 |
| ----------- | ----------------- | ------------------------------------------------------ |
| Patch       | Otomatis (weekly) | `pnpm up --latest` + run tests → commit jika pass      |
| Minor       | Bi-weekly         | Baca changelog → update → run tests → review PR        |
| Major       | Quarterly         | Evaluasi breaking changes → branch terpisah → QA penuh |

### 5.2 Security Audit

```bash
# Cek vulnerability pada semua packages
pnpm audit

# Target: 0 kerentanan critical & high (NFR-03)
```

### 5.3 Dependency Approval

Setiap dependency baru harus memenuhi:

| Kriteria             | Threshold                                          |
| -------------------- | -------------------------------------------------- |
| npm weekly downloads | > 100,000                                          |
| Maintenance          | Last commit < 6 bulan                              |
| License              | MIT, Apache 2.0, ISC (bukan GPL)                   |
| Bundle size          | < 50KB gzipped (untuk frontend)                    |
| TypeScript support   | Wajib (`@types/*` atau built-in)                   |
| Alternatif built-in  | Jika Node/NestJS/React sudah bisa → jangan install |
