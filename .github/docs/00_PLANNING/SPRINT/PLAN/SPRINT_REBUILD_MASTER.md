# SPRINT REBUILD — Master Execution Plan

| Metadata      | Detail                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| **Versi**     | 1.0                                                                                 |
| **Tanggal**   | 14 April 2026                                                                       |
| **Tujuan**    | Single-source-of-truth untuk auto model (Sonnet 4.6 / Haiku 4.5) agar patuh konteks |
| **Referensi** | SPRINT_ROADMAP, SPRINT_0–5, 00_ANALISA_CURRENT_STATE, COVERAGE_ANALYSIS             |
| **Status**    | ACTIVE — Dokumen ini adalah panduan UTAMA untuk rebuild per-module                  |

---

## KONTEKS PENTING (WAJIB BACA SEBELUM KODE)

### Status Saat Ini

Sprint 1–6 (feature completion) telah **93.6% complete**. Semua gap fungsional sudah di-close.
REBUILD Sprint ini fokus pada **validasi logika bisnis**, **konsistensi kode**, dan **kepatuhan terhadap standar dokumentasi**.

### Masalah Utama yang Ditemukan

Berdasarkan `00_ANALISA_CURRENT_STATE.md`:

| Aspek            | Status | Persentase | Prioritas Rebuild              |
| ---------------- | ------ | :--------: | ------------------------------ |
| Business Logic   | ⚠️     |    55%     | **P0** — validasi & perbaikan  |
| Data Consistency | ❌     |    30%     | **P0** — end-to-end validation |
| Cross-Cutting    | ⚠️     |    45%     | **P1** — enrichment            |
| Domain Transaksi | ⚠️     |    59%     | **P0** — approval & state flow |
| Domain Pelanggan | ⚠️     |    56%     | **P1** — FIFO & condition map  |
| Domain Aset      | ⚠️     |    62%     | **P1** — state machine & FIFO  |
| Domain Dashboard | ⚠️     |    50%     | **P2** — data completeness     |

---

## STANDAR KODE (WAJIB DIPATUHI)

> Referensi lengkap: `02_STANDARDS_AND_PROCEDURES/`

### 1. Response Format (KONTRAK BAKU)

```typescript
// SUCCESS
{ success: true, data: T, message?: string, meta?: PaginationMeta }

// ERROR
{ success: false, statusCode: number, message: string, error: string, timestamp: string, path: string }

// PAGINATED
{ success: true, data: { items: T[], meta: { page, limit, total, totalPages } } }
```

### 2. Backend Pattern (NestJS)

```
Controller → routing + @AuthPermissions() + @Body()/@Param()/@Query()
Service    → business logic + prisma + throw NestJS exceptions
DTO        → class-validator decorators, pesan Bahasa Indonesia
```

**Aturan:**

- Controller TIDAK BOLEH akses PrismaClient langsung
- Controller TIDAK BOLEH mengandung bisnis logik
- Throw `NotFoundException`, `ConflictException`, `UnprocessableEntityException` — BUKAN `new Error()`
- Gunakan `prisma.$transaction()` untuk operasi atomik multi-step
- Explicit return type pada semua service methods
- `@AuthPermissions(PERMISSIONS.XXX)` pada semua endpoint

### 3. Frontend Pattern (React)

```
Server State → TanStack Query (useQuery / useMutation)
Client State → Zustand (useAuthStore, useUIStore)
Form         → React Hook Form + Zod schema (zodResolver)
API Layer    → object literal pattern: assetApi.getAll(), assetApi.create()
```

**Aturan:**

- Named export (bukan default export) — kecuali lazy-loaded pages
- Props interface dengan suffix `Props`
- `useQuery` dengan `queryKey` yang konsisten: `['resource', filters]`
- `useMutation` dengan `onSuccess → invalidateQueries`
- Toast notification: `toast.success('...')` atau `toast.error('...')`

### 4. TypeScript Rules

- `any` dilarang — gunakan `unknown` + type guard
- `// @ts-ignore` dilarang — perbaiki tipe
- Explicit return type pada service methods
- `interface` untuk object shapes, `type` untuk unions/intersections
- Enum Prisma digunakan langsung: `AssetStatus`, `UserRole`, `TransactionStatus`

### 5. Naming Conventions

| Tipe              | Pattern                    | Contoh                      |
| ----------------- | -------------------------- | --------------------------- |
| NestJS Controller | `{name}.controller.ts`     | `asset.controller.ts`       |
| NestJS Service    | `{name}.service.ts`        | `asset.service.ts`          |
| NestJS DTO        | `{action}-{name}.dto.ts`   | `create-asset.dto.ts`       |
| React Component   | `PascalCase.tsx`           | `AssetCard.tsx`             |
| React Page        | `PascalCase.tsx`           | `AssetListPage.tsx`         |
| Custom Hook       | `use{Name}.ts`             | `useAssetList.ts`           |
| Zod Schema        | `{name}.schema.ts`         | `asset.schema.ts`           |
| API Service (FE)  | `{name}.api.ts`            | `assets.api.ts`             |
| Zustand Store     | `use{Name}Store.ts`        | `useAuthStore.ts`           |
| Boolean vars      | `is/has/can/should` prefix | `isActive`, `canApprove`    |
| Enum values       | `UPPER_SNAKE_CASE`         | `IN_STORAGE`, `SUPER_ADMIN` |

### 6. Quality Gate (WAJIB setiap penulisan kode)

```bash
pnpm --filter ./apps/frontend/ lint
pnpm --filter ./apps/frontend/ typecheck
pnpm --filter ./apps/backend/ lint
```

**Warning = Error. SEMUA HARUS resolved. Tidak ada pengecualian.**

---

## DAFTAR FILE TARGET — PER SPRINT

### SPRINT 0: Foundation Validation

#### File yang DIREFAKTORING

| #   | File                                                                     | Alasan Refaktoring                                                      |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | `apps/backend/src/core/auth/auth.service.ts`                             | Validasi auth flow: login → JWT → refresh → logout → mustChangePassword |
| 2   | `apps/backend/src/core/auth/auth.controller.ts`                          | Validasi endpoint: login, refresh, logout, change-password              |
| 3   | `apps/backend/src/common/guards/jwt-auth.guard.ts`                       | Validasi JWT guard + token version check                                |
| 4   | `apps/backend/src/common/guards/permissions.guard.ts`                    | Validasi 3-tier permission model (default → restriction → mandatory)    |
| 5   | `apps/backend/src/common/guards/must-change-password.guard.ts`           | Validasi redirect + block API                                           |
| 6   | `apps/backend/src/common/guards/roles.guard.ts`                          | Validasi RBAC role enforcement                                          |
| 7   | `apps/backend/src/common/interceptors/response-transform.interceptor.ts` | Validasi konsistensi format response                                    |
| 8   | `apps/backend/src/common/interceptors/audit-trail.interceptor.ts`        | Validasi auto-logging CUD operations                                    |
| 9   | `apps/backend/src/common/filters/all-exceptions.filter.ts`               | Validasi Prisma error mapping + format                                  |
| 10  | `apps/backend/src/common/filters/prisma-exception.filter.ts`             | Validasi P2002/P2003/P2025 mapping                                      |
| 11  | `apps/backend/src/common/constants/permissions.constants.ts`             | Validasi 85+ permissions sesuai RBAC Matrix                             |
| 12  | `apps/frontend/src/components/guard/AuthGuard.tsx`                       | Validasi redirect ke /login jika unauthenticated                        |
| 13  | `apps/frontend/src/components/guard/RoleProtectedRoute.tsx`              | Validasi role-based route protection                                    |
| 14  | `apps/frontend/src/store/useAuthStore.ts`                                | Validasi token storage + refresh flow                                   |
| 15  | `apps/frontend/src/lib/axios.ts`                                         | Validasi interceptor: 401 → refresh → retry                             |
| 16  | `apps/frontend/src/routes/protected.tsx`                                 | Validasi semua protected routes apply RoleProtectedRoute                |
| 17  | `apps/frontend/src/routes/index.tsx`                                     | Validasi routing structure                                              |

#### File yang DITAMBAHKAN (jika belum ada)

| #   | File                              | Deskripsi                                        |
| --- | --------------------------------- | ------------------------------------------------ |
| —   | Tidak ada file baru pada Sprint 0 | Sprint ini murni validasi & refactoring existing |

---

### SPRINT 1: Master Data (Aset, Stok, Pembelian, Depresiasi)

#### File yang DIREFAKTORING

**Backend:**

| #   | File                                                                              | Alasan Refaktoring                                                                                                                                 |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/backend/src/modules/assets/categories/category.service.ts`                  | Cascade protection: delete category → check AssetType children                                                                                     |
| 2   | `apps/backend/src/modules/assets/categories/category.controller.ts`               | RBAC: hanya SA + AL                                                                                                                                |
| 3   | `apps/backend/src/modules/assets/types/type.service.ts`                           | Cascade protection: delete type → check AssetModel children                                                                                        |
| 4   | `apps/backend/src/modules/assets/models/model.service.ts`                         | Cascade protection: delete model → check Asset instances                                                                                           |
| 5   | `apps/backend/src/modules/assets/asset.service.ts`                                | Asset ID auto-generation (`AS-YYYY-MMDD-XXXX`), status state machine, classification (INDIVIDUAL/BULK), batch registration, soft delete protection |
| 6   | `apps/backend/src/modules/assets/asset.controller.ts`                             | RBAC endpoints, batch registration endpoint                                                                                                        |
| 7   | `apps/backend/src/modules/assets/dto/*.ts`                                        | DTO validasi: CreateAssetDto, UpdateAssetDto, AssetFilterDto                                                                                       |
| 8   | `apps/backend/src/modules/assets/purchases/purchase.service.ts`                   | Link pembelian → model, validasi fields                                                                                                            |
| 9   | `apps/backend/src/modules/assets/depreciation/depreciation.service.ts`            | Validasi straight-line + diminishing value formula                                                                                                 |
| 10  | `apps/backend/src/modules/transactions/stock-movements/stock-movement.service.ts` | FIFO consumption algorithm, movement type validation                                                                                               |

**Frontend:**

| #   | File                                                               | Alasan Refaktoring                                                   |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 11  | `apps/frontend/src/features/assets/pages/AssetListPage.tsx`        | Filter, search, pagination validation                                |
| 12  | `apps/frontend/src/features/assets/pages/AssetFormPage.tsx`        | Cascading selects (category→type→model), classification-based fields |
| 13  | `apps/frontend/src/features/assets/pages/AssetDetailPage.tsx`      | Status badge, stock movement timeline, QR section                    |
| 14  | `apps/frontend/src/features/assets/pages/StockPage.tsx`            | 3 perspektif view (gudang/divisi/pribadi), threshold indicator, RBAC |
| 15  | `apps/frontend/src/features/assets/pages/CategoriesModelsPage.tsx` | 3-tab view: Kategori/Tipe/Model                                      |
| 16  | `apps/frontend/src/features/assets/pages/PurchaseFormPage.tsx`     | Form validation, link to model                                       |
| 17  | `apps/frontend/src/features/assets/pages/DepreciationFormPage.tsx` | Formula validation UI                                                |
| 18  | `apps/frontend/src/features/assets/api/*.ts`                       | API bindings consistency                                             |
| 19  | `apps/frontend/src/features/assets/hooks/*.ts`                     | Query hooks consistency                                              |
| 20  | `apps/frontend/src/features/assets/schemas/*.ts`                   | Zod schema validation                                                |
| 21  | `apps/frontend/src/features/assets/types/*.ts`                     | TypeScript type definitions                                          |

#### File yang DITAMBAHKAN (jika belum ada)

| #   | File                                                          | Deskripsi                                      |
| --- | ------------------------------------------------------------- | ---------------------------------------------- |
| 1   | `apps/backend/src/modules/assets/asset-status.machine.ts`     | Asset status state machine (valid transitions) |
| 2   | `apps/backend/src/modules/assets/fifo-consumption.service.ts` | FIFO material consumption algorithm (shared)   |

---

### SPRINT 2: Transaksi (Approval Engine, Request, Loan, Return, Handover, Repair)

#### File yang DIREFAKTORING

**Backend:**

| #   | File                                                                              | Alasan Refaktoring                                                                                         |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | `apps/backend/src/modules/transactions/approval/approval.service.ts`              | Dynamic approval chain engine per PRD §6.3 (3 workflows)                                                   |
| 2   | `apps/backend/src/modules/transactions/approval/approval.controller.ts`           | Approve/reject endpoints                                                                                   |
| 3   | `apps/backend/src/modules/transactions/requests/request.service.ts`               | Per-item approval, partial approval, post-approval execution flow, purchase processing, asset registration |
| 4   | `apps/backend/src/modules/transactions/requests/request.controller.ts`            | All endpoints + RBAC                                                                                       |
| 5   | `apps/backend/src/modules/transactions/requests/dto/*.ts`                         | DTO validation                                                                                             |
| 6   | `apps/backend/src/modules/transactions/loans/loan.service.ts`                     | Create + approve + assign asset + execute + overdue logic                                                  |
| 7   | `apps/backend/src/modules/transactions/loans/loan.controller.ts`                  | All endpoints + RBAC                                                                                       |
| 8   | `apps/backend/src/modules/transactions/loans/dto/*.ts`                            | DTO validation                                                                                             |
| 9   | `apps/backend/src/modules/transactions/returns/return.service.ts`                 | Condition assessment, version/rejection, stock return                                                      |
| 10  | `apps/backend/src/modules/transactions/returns/return.controller.ts`              | All endpoints + RBAC                                                                                       |
| 11  | `apps/backend/src/modules/transactions/returns/dto/*.ts`                          | DTO validation                                                                                             |
| 12  | `apps/backend/src/modules/transactions/handovers/handover.service.ts`             | Ownership transfer, PIC update, StockMovement TRANSFER                                                     |
| 13  | `apps/backend/src/modules/transactions/handovers/handover.controller.ts`          | All endpoints + RBAC                                                                                       |
| 14  | `apps/backend/src/modules/transactions/handovers/dto/*.ts`                        | DTO validation                                                                                             |
| 15  | `apps/backend/src/modules/transactions/repairs/repair.service.ts`                 | 5-state workflow: UNDER_REPAIR → repair internal/service center → IN_STORAGE/DECOMMISSIONED                |
| 16  | `apps/backend/src/modules/transactions/repairs/repair.controller.ts`              | All endpoints + RBAC                                                                                       |
| 17  | `apps/backend/src/modules/transactions/repairs/dto/*.ts`                          | DTO validation                                                                                             |
| 18  | `apps/backend/src/modules/transactions/stock-movements/stock-movement.service.ts` | Movement tracking per transaksi                                                                            |

**Frontend:**

| #   | File                                                                   | Alasan Refaktoring                                            |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| 19  | `apps/frontend/src/features/transactions/pages/RequestDetailPage.tsx`  | Approval buttons onClick, rejection dialog, approval timeline |
| 20  | `apps/frontend/src/features/transactions/pages/RequestFormPage.tsx`    | Multi-item form, stock availability check                     |
| 21  | `apps/frontend/src/features/transactions/pages/RequestListPage.tsx`    | Filter, search, export button                                 |
| 22  | `apps/frontend/src/features/transactions/pages/LoanDetailPage.tsx`     | Approval buttons, asset assignment picker                     |
| 23  | `apps/frontend/src/features/transactions/pages/LoanFormPage.tsx`       | Form validation                                               |
| 24  | `apps/frontend/src/features/transactions/pages/LoanListPage.tsx`       | Filter, search                                                |
| 25  | `apps/frontend/src/features/transactions/pages/ReturnDetailPage.tsx`   | Condition assessment UI, approval                             |
| 26  | `apps/frontend/src/features/transactions/pages/ReturnFormPage.tsx`     | Select active loan, per-item condition                        |
| 27  | `apps/frontend/src/features/transactions/pages/ReturnListPage.tsx`     | Filter, search                                                |
| 28  | `apps/frontend/src/features/transactions/pages/HandoverDetailPage.tsx` | Approval buttons, print button                                |
| 29  | `apps/frontend/src/features/transactions/pages/HandoverFormPage.tsx`   | From/To/Witness user selection                                |
| 30  | `apps/frontend/src/features/transactions/pages/HandoverListPage.tsx`   | Filter, search, export button                                 |
| 31  | `apps/frontend/src/features/transactions/pages/RepairDetailPage.tsx`   | Status transition buttons per state                           |
| 32  | `apps/frontend/src/features/transactions/pages/RepairFormPage.tsx`     | Damage report form                                            |
| 33  | `apps/frontend/src/features/transactions/pages/RepairListPage.tsx`     | Filter, search, export button                                 |
| 34  | `apps/frontend/src/features/transactions/api/*.ts`                     | API bindings consistency                                      |
| 35  | `apps/frontend/src/features/transactions/hooks/*.ts`                   | Query/mutation hooks                                          |
| 36  | `apps/frontend/src/features/transactions/schemas/*.ts`                 | Zod validation schemas                                        |
| 37  | `apps/frontend/src/features/transactions/types/*.ts`                   | TypeScript type definitions                                   |

#### File yang DITAMBAHKAN (jika belum ada)

| #   | File                                                                           | Deskripsi                                             |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 1   | `apps/frontend/src/features/transactions/components/ApprovalTimeline.tsx`      | Timeline visual approval steps (shared component)     |
| 2   | `apps/frontend/src/features/transactions/components/RejectionDialog.tsx`       | Dialog input alasan rejection (shared component)      |
| 3   | `apps/frontend/src/features/transactions/components/ApprovalActionButtons.tsx` | Approve/Reject/Cancel buttons (shared component)      |
| 4   | `apps/backend/src/modules/transactions/approval/approval-matrix.constants.ts`  | Approval chain matrix per role + module (3 workflows) |

---

### SPRINT 3: Pelanggan & Proyek Infrastruktur

#### File yang DIREFAKTORING

**Backend:**

| #   | File                                                                          | Alasan Refaktoring                                                                        |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `apps/backend/src/modules/customers/clients/client.service.ts`                | Auto-status transition (INACTIVE↔ACTIVE), deletion protection                             |
| 2   | `apps/backend/src/modules/customers/clients/client.controller.ts`             | RBAC, division scoping                                                                    |
| 3   | `apps/backend/src/modules/customers/clients/dto/*.ts`                         | DTO validation                                                                            |
| 4   | `apps/backend/src/modules/customers/installations/installation.service.ts`    | Material FIFO consumption, unit conversion, asset status → IN_USE, auto-activate customer |
| 5   | `apps/backend/src/modules/customers/installations/installation.controller.ts` | RBAC endpoints                                                                            |
| 6   | `apps/backend/src/modules/customers/installations/dto/*.ts`                   | DTO validation                                                                            |
| 7   | `apps/backend/src/modules/customers/maintenance/maintenance.service.ts`       | Replacement logic (swap old↔new asset), material FIFO, condition mapping                  |
| 8   | `apps/backend/src/modules/customers/maintenance/maintenance.controller.ts`    | RBAC endpoints                                                                            |
| 9   | `apps/backend/src/modules/customers/maintenance/dto/*.ts`                     | DTO validation                                                                            |
| 10  | `apps/backend/src/modules/customers/dismantles/dismantle.service.ts`          | Asset return to storage, condition mapping, auto-deactivate customer                      |
| 11  | `apps/backend/src/modules/customers/dismantles/dismantle.controller.ts`       | RBAC endpoints                                                                            |
| 12  | `apps/backend/src/modules/customers/dismantles/dto/*.ts`                      | DTO validation                                                                            |
| 13  | `apps/backend/src/modules/transactions/projects/project.service.ts`           | Lifecycle state machine, task management, material allocation                             |
| 14  | `apps/backend/src/modules/transactions/projects/project.controller.ts`        | RBAC endpoints                                                                            |
| 15  | `apps/backend/src/modules/transactions/projects/dto/*.ts`                     | DTO validation                                                                            |

**Frontend:**

| #   | File                                                                    | Alasan Refaktoring                             |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| 16  | `apps/frontend/src/features/customers/pages/CustomerDetailPage.tsx`     | Tabs: Info, Aset Terpasang, Riwayat, Statistik |
| 17  | `apps/frontend/src/features/customers/pages/CustomerFormPage.tsx`       | Form validation                                |
| 18  | `apps/frontend/src/features/customers/pages/CustomerListPage.tsx`       | Filter, search, status indicator               |
| 19  | `apps/frontend/src/features/customers/pages/InstallationFormPage.tsx`   | Individual asset + material picker, FIFO info  |
| 20  | `apps/frontend/src/features/customers/pages/InstallationDetailPage.tsx` | Material list, complete button                 |
| 21  | `apps/frontend/src/features/customers/pages/MaintenanceFormPage.tsx`    | Work types multi-select, replacement picker    |
| 22  | `apps/frontend/src/features/customers/pages/MaintenanceDetailPage.tsx`  | Replacement section, material section          |
| 23  | `apps/frontend/src/features/customers/pages/DismantleFormPage.tsx`      | Asset selection, condition assessment          |
| 24  | `apps/frontend/src/features/customers/pages/DismantleDetailPage.tsx`    | Asset return status                            |
| 25  | `apps/frontend/src/features/transactions/pages/ProjectDetailPage.tsx`   | Task list, material allocation, team members   |
| 26  | `apps/frontend/src/features/transactions/pages/ProjectFormPage.tsx`     | Form validation                                |
| 27  | `apps/frontend/src/features/customers/api/*.ts`                         | API bindings                                   |
| 28  | `apps/frontend/src/features/customers/hooks/*.ts`                       | Query/mutation hooks                           |
| 29  | `apps/frontend/src/features/customers/schemas/*.ts`                     | Zod schemas                                    |
| 30  | `apps/frontend/src/features/customers/types/*.ts`                       | TypeScript types                               |

#### File yang DITAMBAHKAN (jika belum ada)

| #   | File                                                            | Deskripsi                                    |
| --- | --------------------------------------------------------------- | -------------------------------------------- |
| 1   | `apps/backend/src/modules/customers/condition-status-mapper.ts` | Shared condition → status mapping (reusable) |

---

### SPRINT 4: Dashboard & Cross-Cutting Features

#### File yang DIREFAKTORING

**Backend:**

| #   | File                                                              | Alasan Refaktoring                                       |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | `apps/backend/src/modules/dashboards/dashboard.service.ts`        | Semua 5 role dashboards: stats, charts, alerts, activity |
| 2   | `apps/backend/src/modules/dashboards/dashboard.controller.ts`     | RBAC per role endpoints, dateFrom/dateTo filter          |
| 3   | `apps/backend/src/modules/dashboards/dto/*.ts`                    | Filter DTOs                                              |
| 4   | `apps/backend/src/core/notifications/notification.service.ts`     | Auto-trigger on status change, routing per role/divisi   |
| 5   | `apps/backend/src/core/notifications/notification.controller.ts`  | List, markRead, markAllRead endpoints                    |
| 6   | `apps/backend/src/core/notifications/whatsapp.service.ts`         | WhatsApp integration via Fonnte/Wablas                   |
| 7   | `apps/backend/src/core/events/events.service.ts`                  | SSE push notification                                    |
| 8   | `apps/backend/src/core/events/events.controller.ts`               | SSE endpoint                                             |
| 9   | `apps/backend/src/core/scheduler/scheduler.service.ts`            | Cron jobs: overdue, reminder, threshold                  |
| 10  | `apps/backend/src/modules/qrcode/qrcode.service.ts`               | QR generation, batch QR                                  |
| 11  | `apps/backend/src/modules/qrcode/qrcode.controller.ts`            | QR endpoints                                             |
| 12  | `apps/backend/src/modules/exports/export.service.ts`              | Assets, stock, transactions, customers export            |
| 13  | `apps/backend/src/modules/exports/export.controller.ts`           | Export endpoints + RBAC                                  |
| 14  | `apps/backend/src/modules/imports/import.service.ts`              | Bulk asset import: validate → preview → confirm          |
| 15  | `apps/backend/src/modules/imports/import.controller.ts`           | Import endpoints                                         |
| 16  | `apps/backend/src/modules/uploads/upload.service.ts`              | File upload service                                      |
| 17  | `apps/backend/src/modules/uploads/upload.controller.ts`           | Upload endpoints                                         |
| 18  | `apps/backend/src/modules/settings/audit/audit.service.ts`        | Activity log query, filter, pagination                   |
| 19  | `apps/backend/src/modules/settings/profile/profile.service.ts`    | Profile + change password                                |
| 20  | `apps/backend/src/modules/settings/users/user.service.ts`         | User CRUD (SA only)                                      |
| 21  | `apps/backend/src/modules/settings/divisions/division.service.ts` | Division CRUD (SA only)                                  |

**Frontend:**

| #   | File                                                                 | Alasan Refaktoring                        |
| --- | -------------------------------------------------------------------- | ----------------------------------------- |
| 22  | `apps/frontend/src/features/dashboard/pages/SuperAdminDashboard.tsx` | Stats + charts + alerts + recent activity |
| 23  | `apps/frontend/src/features/dashboard/pages/FinanceDashboard.tsx`    | Spending per category, trend chart        |
| 24  | `apps/frontend/src/features/dashboard/pages/OperationsDashboard.tsx` | Daily ops summary, stock alerts           |
| 25  | `apps/frontend/src/features/dashboard/pages/DivisionDashboard.tsx`   | Division-scoped stats                     |
| 26  | `apps/frontend/src/features/dashboard/pages/PersonalDashboard.tsx`   | My assets, my transactions                |
| 27  | `apps/frontend/src/features/dashboard/pages/DashboardPage.tsx`       | Role-based dashboard routing              |
| 28  | `apps/frontend/src/features/notifications/pages/*.tsx`               | Notification list page                    |
| 29  | `apps/frontend/src/features/notifications/hooks/*.ts`                | Notification hooks                        |
| 30  | `apps/frontend/src/features/notifications/api/*.ts`                  | Notification API                          |
| 31  | `apps/frontend/src/components/layout/NotificationDropdown.tsx`       | Bell + dropdown + unread badge            |
| 32  | `apps/frontend/src/components/layout/CommandPalette.tsx`             | Global search Ctrl+K                      |
| 33  | `apps/frontend/src/components/layout/AppHeader.tsx`                  | Breadcrumb + notification bell            |
| 34  | `apps/frontend/src/components/layout/AppSidebar.tsx`                 | Role-based sidebar navigation             |
| 35  | `apps/frontend/src/components/form/ExportButton.tsx`                 | Export trigger component                  |
| 36  | `apps/frontend/src/components/form/ImportDialog.tsx`                 | Import dialog with preview                |
| 37  | `apps/frontend/src/components/form/QrCodeSection.tsx`                | QR code display + download                |
| 38  | `apps/frontend/src/components/form/QRScannerDialog.tsx`              | Camera QR scanner                         |
| 39  | `apps/frontend/src/components/form/AttachmentSection.tsx`            | File attachment viewer/uploader           |
| 40  | `apps/frontend/src/components/form/FileUpload.tsx`                   | Drag-drop file upload                     |
| 41  | `apps/frontend/src/hooks/use-sse.ts`                                 | SSE listener hook                         |
| 42  | `apps/frontend/src/hooks/use-export-import.ts`                       | Export/import hooks                       |
| 43  | `apps/frontend/src/hooks/use-attachments.ts`                         | Attachment hooks                          |
| 44  | `apps/frontend/src/lib/export-import.ts`                             | Export/import API bindings                |
| 45  | `apps/frontend/src/features/settings/pages/AuditLogPage.tsx`         | Activity log viewer (SA only)             |
| 46  | `apps/frontend/src/features/settings/pages/ProfilePage.tsx`          | Profile + change password                 |
| 47  | `apps/frontend/src/features/settings/pages/UsersDivisionsPage.tsx`   | Users + Divisions tabs                    |
| 48  | `apps/frontend/src/features/dashboard/api/*.ts`                      | Dashboard API bindings                    |
| 49  | `apps/frontend/src/features/dashboard/types/*.ts`                    | Dashboard types                           |

#### File yang DITAMBAHKAN (jika belum ada)

| #   | File                                                                   | Deskripsi                            |
| --- | ---------------------------------------------------------------------- | ------------------------------------ |
| 1   | `apps/frontend/src/features/dashboard/components/TimeFilter.tsx`       | Date range filter component (shared) |
| 2   | `apps/frontend/src/features/dashboard/components/StockAlertWidget.tsx` | Stock alert cards (shared)           |
| 3   | `apps/frontend/src/features/dashboard/hooks/*.ts`                      | Dashboard query hooks per role       |

---

### SPRINT 5: Stabilization

#### File yang DIREFAKTORING

| #   | File                                                     | Alasan Refaktoring                                              |
| --- | -------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `apps/backend/prisma/seed.ts`                            | UAT seed data: realistic users, assets, transactions, customers |
| 2   | `apps/backend/prisma/schema/*.prisma`                    | Index audit, relasi audit, enum completeness                    |
| 3   | Semua `*.service.ts` di modules/                         | Concurrency control (version check for OCC where applicable)    |
| 4   | `apps/frontend/src/components/ErrorBoundary.tsx`         | Graceful error boundary                                         |
| 5   | `apps/frontend/src/features/auth/pages/NotFoundPage.tsx` | 404 page                                                        |

#### File yang DITAMBAHKAN

| #   | File                | Deskripsi                                             |
| --- | ------------------- | ----------------------------------------------------- |
| —   | Tidak ada file baru | Sprint ini fokus stabilisasi, testing, security audit |

---

## APPROVAL MATRIX (3 WORKFLOWS)

### Workflow 1: Request Pengadaan

```
| Creator          | Step 1           | Step 2           | Step 3     | Step 4     | Executor         |
|------------------|------------------|------------------|------------|------------|------------------|
| STAFF            | LEADER (divisi)  | ADMIN_LOGISTIK   | ADMIN_PURCHASE | SUPER_ADMIN | ADMIN_LOGISTIK |
| LEADER           | ADMIN_LOGISTIK   | ADMIN_PURCHASE   | SUPER_ADMIN | —         | ADMIN_LOGISTIK   |
| ADMIN_LOGISTIK   | ADMIN_PURCHASE   | SUPER_ADMIN      | —          | —          | SA / AL          |
| ADMIN_PURCHASE   | ADMIN_LOGISTIK   | SUPER_ADMIN      | —          | —          | SA / AL          |
| SUPER_ADMIN      | ADMIN_LOGISTIK   | ADMIN_PURCHASE   | —          | —          | ADMIN_LOGISTIK   |
```

### Workflow 2: Loan, Return, Handover, Repair

```
| Creator          | Step 1           | Step 2           | CC (info)    | Executor         |
|------------------|------------------|------------------|--------------|------------------|
| STAFF            | LEADER (divisi)  | ADMIN_LOGISTIK   | SUPER_ADMIN  | ADMIN_LOGISTIK   |
| LEADER           | ADMIN_LOGISTIK   | —                | SUPER_ADMIN  | ADMIN_LOGISTIK   |
| ADMIN_LOGISTIK   | SUPER_ADMIN      | —                | —            | SA / AL          |
| ADMIN_PURCHASE   | ADMIN_LOGISTIK   | —                | SUPER_ADMIN  | SA / AL          |
| SUPER_ADMIN      | ADMIN_LOGISTIK   | —                | —            | ADMIN_LOGISTIK   |
```

### Workflow 3: Project, Installation, Maintenance, Dismantle

```
| Creator          | Step 1           | Step 2           | CC (info)    | Executor         |
|------------------|------------------|------------------|--------------|------------------|
| STAFF            | LEADER (divisi)  | ADMIN_LOGISTIK   | SUPER_ADMIN  | ADMIN_LOGISTIK   |
| LEADER           | ADMIN_LOGISTIK   | —                | SUPER_ADMIN  | ADMIN_LOGISTIK   |
```

---

## ASSET STATUS STATE MACHINE

```typescript
const VALID_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  IN_STORAGE: ['IN_USE', 'IN_CUSTODY', 'UNDER_REPAIR', 'DAMAGED', 'CONSUMED', 'DECOMMISSIONED'],
  IN_USE: ['IN_STORAGE', 'IN_CUSTODY', 'UNDER_REPAIR', 'DAMAGED', 'DECOMMISSIONED'],
  IN_CUSTODY: ['IN_USE', 'IN_STORAGE', 'UNDER_REPAIR', 'DAMAGED', 'DECOMMISSIONED'],
  UNDER_REPAIR: ['IN_STORAGE', 'IN_USE', 'DAMAGED', 'DECOMMISSIONED'],
  DAMAGED: ['IN_STORAGE', 'UNDER_REPAIR', 'DECOMMISSIONED'],
  CONSUMED: [], // terminal
  DECOMMISSIONED: [], // terminal
};
```

## CONDITION → STATUS MAPPING (Return/Dismantle)

```typescript
const CONDITION_STATUS_MAP: Record<AssetCondition, AssetStatus> = {
  BRAND_NEW: 'IN_STORAGE',
  GOOD: 'IN_STORAGE',
  USED_OKAY: 'IN_STORAGE',
  MINOR_DAMAGE: 'UNDER_REPAIR',
  MAJOR_DAMAGE: 'DAMAGED',
  FOR_PARTS: 'DECOMMISSIONED',
};
```

---

## STOCK MOVEMENT TYPES

```
NEW_STOCK         — registrasi aset baru
HANDOVER          — serah terima
LOAN_OUT          — pinjam keluar
LOAN_RETURN       — pinjam kembali
INSTALLATION      — instalasi ke pelanggan
MAINTENANCE       — material dipakai maintenance
DISMANTLE_RETURN  — aset kembali dari dismantle
REPAIR            — masuk/keluar perbaikan
ADJUSTMENT        — koreksi manual
CONSUMED          — material habis
TRANSFER          — transfer antar divisi/user
```

---

## URUTAN EKSEKUSI

```
Sprint 0 (Foundation)        → Validasi auth, guards, response format
    ↓
Sprint 1 (Master Data)       → Kategori hirarki, aset, stok, FIFO, pembelian, depresiasi
    ↓
Sprint 2 (Transactions)      → Approval engine, request, loan, return, handover, repair
    ↓
Sprint 3 (Customers/Projects)→ Customer ops, instalasi, maintenance, dismantle, project
    ↓
Sprint 4 (Dashboard/Cross)   → Dashboard per role, notifikasi, QR, export/import, settings
    ↓
Sprint 5 (Stabilization)     → Integration test, security audit, performance, UAT
```

**Prinsip:**

1. **Backend dulu** → Frontend (API ready sebelum UI di-wire)
2. **Per-module tuntas** → Baru lanjut module berikutnya
3. **Quality Gate setiap commit** → lint + typecheck 0 errors/warnings
4. **Changelog update setiap sprint** → `.github/docs/changelog/ReadMe.md`

---

## DEPENDENCY MAP ANTAR FILE

```
prisma/schema/*.prisma
    ↳ generated/prisma/ (auto-generated types)
        ↳ backend services (use Prisma types directly)
            ↳ backend DTOs (class-validator)
                ↳ backend controllers (routing + auth)

frontend types/index.ts (mirror Prisma types for FE)
    ↳ frontend api/*.ts (axios calls)
        ↳ frontend hooks/*.ts (TanStack Query wrappers)
            ↳ frontend pages/*.tsx (UI components)
                ↳ frontend schemas/*.ts (Zod validation for forms)
```

---

**— Akhir SPRINT_REBUILD_MASTER v1.0 —**
