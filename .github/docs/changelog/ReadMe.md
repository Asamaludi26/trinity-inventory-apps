# 📋 Changelog

> Catatan perubahan yang terjadi pada project Trinity Inventory Apps.
> Dikelola oleh **Documentation Agent** secara WAJIB setiap kali ada perubahan.

---

## Format Entry

Setiap perubahan dicatat menggunakan format **Keep a Changelog**:

```markdown
## [YYYY-MM-DD] — Session/Context Title

### Added

- Fitur baru yang ditambahkan

### Changed

- Perubahan pada fitur/behavior yang sudah ada

### Fixed

- Bug fixes dan perbaikan

### Security

- Perbaikan terkait keamanan

### Deprecated

- Fitur yang akan dihapus di versi mendatang

### Removed

- Fitur yang dihapus

### Agents Involved

- Agent yang terlibat dalam perubahan
```

---

## Log

<!-- Changelog entries ditambahkan di bawah baris ini, terbaru di atas -->

### [2026-04-15] — Sprint Rebuild Completion Analysis & Asset Bug Fix

#### Added

- `00_PLANNING/SPRINT/ANALYSIS/SPRINT_REBUILD_COMPLETION_ANALYSIS.md` — Comprehensive Sprint 0–5 completion analysis: per-task breakdown, gap analysis, blocking issues, remediation roadmap

#### Fixed

- `apps/frontend/src/features/assets/api/assets.api.ts` — Fixed `categoryApi`, `typeApi`, `modelApi` type definitions: changed from `ApiResponse<T[]>` to `ApiResponse<PaginatedResponse<T>>` to match backend paginated response
- `apps/frontend/src/features/assets/hooks/useCategories.ts` — Fixed `useCategories` hook: extract `res.data.data.data` (items array from paginated response) instead of `res.data.data` (paginated wrapper object)
- `apps/frontend/src/features/assets/hooks/useTypes.ts` — Same fix for `useTypes` hook
- `apps/frontend/src/features/assets/hooks/useModels.ts` — Same fix for `useModels` hook
- **Root Cause**: `categories?.map is not a function` — Backend returns `{ data: [], meta: {} }` (paginated), but frontend hooks treated it as flat array

#### Quality Gate

- ✅ Frontend typecheck: 0 errors
- ✅ Frontend lint: 0 errors

#### Agents Involved

- documentation (sprint analysis report)
- frontend (API type fix, hook data extraction fix)

### [2026-04-15] — Sprint 5 Stabilization: Security Audit, Performance, UAT Preparation

#### Added

- `apps/backend/prisma/schema/auth.prisma` — `failedLoginAttempts` (Int, default 0) and `lockedUntil` (DateTime?) fields for account lockout mechanism (T5-12: OWASP A07)
- `apps/backend/prisma/migrations/20260414174443_sprint5_account_lockout_and_performance_indexes/` — Migration: account lockout fields + composite performance indexes
- `apps/backend/test/helpers/test-app.helper.ts` — Shared E2E test utilities: `createTestApp()`, `loginUser()`, `authRequest()`, `TEST_USERS`
- `apps/backend/test/auth.e2e-spec.ts` — Auth flow E2E tests: login, refresh, logout, RBAC, account lockout (T5-01)
- `apps/backend/test/asset-lifecycle.e2e-spec.ts` — Asset lifecycle E2E tests: CRUD, categories, stock management (T5-01)
- `apps/backend/test/transaction-lifecycle.e2e-spec.ts` — Transaction lifecycle E2E tests: requests, loans, returns, handovers, repairs, OCC, response format consistency (T5-02)
- `apps/backend/test/customer-operations.e2e-spec.ts` — Customer operations E2E tests: CRUD, installations, maintenances, dismantles (T5-03)
- UAT test accounts seeded: `superadmin@test.com`, `logistik@test.com`, `purchase@test.com`, `leader@test.com`, `staff1@test.com`, `staff2@test.com` (T5-20)
- 11 additional users for realistic UAT data (16 total users, multi-division coverage) (T5-19)

#### Changed

- `apps/backend/src/core/auth/auth.service.ts` — Account lockout: 5 failed attempts → 15min lock; failed attempt counter; lockout check on login; auto-reset on successful login; detailed security logging (T5-12)
- `apps/backend/src/core/auth/auth.controller.ts` — Added `@Throttle()` to logout (10 req/min) and change-password (3 req/min) endpoints (T5-13)
- `apps/backend/src/main.ts` — Enhanced Helmet config: explicit CSP directives, HSTS (max-age 1 year + preload), frameguard DENY, X-Content-Type-Options, X-XSS-Protection (T5-13)
- `apps/backend/prisma/schema/asset.prisma` — Added composite indexes: `[status, modelId]`, `[status, currentUserId]`, `[isDeleted, status]`, `[createdAt]` (T5-15)
- `apps/backend/prisma/schema/transaction.prisma` — Added composite indexes: `[status, createdById]`, `[isDeleted, status]` on Requests and LoanRequests (T5-15)
- `apps/backend/prisma/schema/customer.prisma` — Added composite index: `[isActive, isDeleted]` on Customer (T5-15)
- `apps/backend/prisma/schema/schema.prisma` — Added composite indexes: `[assetId, type]`, `[assetId, createdAt]` on StockMovement (T5-15)
- `apps/frontend/src/components/form/QrCodeSection.tsx` — Added `loading="lazy"` to QR code image (T5-17)
- `apps/frontend/src/features/auth/pages/LoginPage.tsx` — Added `loading="lazy"` to logo image (T5-17)
- `apps/backend/prisma/seed.ts` — Expanded seed data: 16 users (6 UAT accounts + 5 additional), UAT credentials logged in summary (T5-19, T5-20)

#### Removed

- `xlsx` package from frontend dependencies — Prototype Pollution + ReDoS vulnerabilities (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9); not actually imported in code, backend uses `exceljs` instead (T5-14)

#### Security

- **OWASP A01 (Broken Access Control)**: Verified all endpoints use `@AuthPermissions()` guard; global JWT + Roles + Permissions guards in correct order (T5-09) ✅
- **OWASP A02 (Cryptographic Failures)**: bcrypt cost 12 ✅; JWT secret min 32 chars ✅; token version tracking ✅; access token in memory only ✅ (T5-10)
- **OWASP A03 (Injection)**: Zero raw SQL (`$queryRawUnsafe`) usage ✅; all queries via Prisma parameterized ✅; validation pipe global whitelist ✅ (T5-11)
- **OWASP A07 (Authentication Failures)**: Login throttled 5 req/min ✅; account lockout after 5 failed attempts ✅; token rotation via tokenVersion ✅; JWT 15m access + 7d refresh ✅ (T5-12)
- **Security Headers**: Helmet CSP + HSTS + frameguard + noSniff + xssFilter ✅ (T5-13)
- **Dependency Audit**: Removed vulnerable `xlsx` package; `@hono/node-server` (Prisma transitive dep, moderate) noted (T5-14)

#### Quality Gate

- ✅ Backend lint: 0 errors
- ✅ Frontend lint: 0 errors
- ✅ Frontend typecheck: 0 errors

#### Agents Involved

- security (OWASP audit T5-09 to T5-14)
- backend (account lockout, throttling, helmet config, auth service hardening)
- database (Prisma migration, composite indexes, UAT seed expansion)
- frontend (image lazy loading, dependency cleanup)
- documentation (changelog)

---

### [2026-04-15] — Sprint 4 Dashboard & Cross-Cutting: Time Filter, SSE Notifications

#### Added

- `apps/backend/src/modules/dashboards/dto/dashboard-query.dto.ts` — `DashboardPreset` union type, `DateRange` interface, `resolveDashboardDateRange()` helper function to compute `from`/`to` from preset or explicit dates; default: last 30 days
- `apps/backend/src/core/notifications/notification.service.ts` — SSE stream via `Subject<NotificationEvent>`; `getNotificationStream(userId)` returns `Observable<MessageEvent>` filtered by user; `create()` now emits to stream after DB insert
- `apps/backend/src/core/notifications/notification.controller.ts` — `@Sse('stream')` endpoint: JWT auth via query param `token`, heartbeat every 30s via `merge(notifications$, heartbeat$)`, no auth required (`@Public()`)
- `apps/backend/src/core/notifications/notification.module.ts` — Imports `JwtModule` for SSE token verification
- `apps/frontend/src/features/dashboard/components/DashboardTimeFilter.tsx` — Preset selector (Hari ini / 7 Hari / 30 Hari / 3 Bulan / 6 Bulan / 1 Tahun)
- `apps/frontend/src/features/notifications/hooks/useNotifications.ts` — `useNotificationSSE()` hook using `EventSource` for real-time bell badge updates; SSE stream connects on mount, invalidates notification query cache on each message

#### Changed

- `apps/backend/src/modules/dashboards/dashboard.service.ts` — `getStats()`, `getFinanceStats()`, `getOperationsStats()` now accept `DashboardQueryDto`; queries filter by `createdAt`/`updatedAt`/`purchaseDate` within the resolved date range
- `apps/backend/src/modules/dashboards/dashboard.controller.ts` — All stats endpoints now accept `@Query() query: DashboardQueryDto` with optional `preset`, `dateFrom`, `dateTo` params added via `@ApiQuery()`
- `apps/frontend/src/features/dashboard/api/dashboard.api.ts` — `getStats()`, `getFinanceStats()`, `getOperationsStats()` accept optional `DashboardFilter` param object
- `apps/frontend/src/features/dashboard/types/index.ts` — Added `DashboardPreset`, `DashboardFilter`, `PRESET_LABELS`
- `apps/frontend/src/features/dashboard/pages/SuperAdminDashboard.tsx` — State `filter` with `DashboardTimeFilter` widget; `queryKey` includes filter for cache separation
- `apps/frontend/src/features/dashboard/pages/FinanceDashboard.tsx` — Time filter integration with `DashboardTimeFilter`
- `apps/frontend/src/features/dashboard/pages/OperationsDashboard.tsx` — Time filter integration with `DashboardTimeFilter`
- `apps/frontend/src/features/notifications/index.ts` — Exports `useNotificationSSE`
- `apps/frontend/src/features/notifications/hooks/useNotifications.ts` — Reduced polling interval from 30s to 60s (fallback, primary is SSE); added `useNotificationSSE`

#### Quality Gate

- ✅ Backend lint: 0 errors
- ✅ Backend typecheck: 0 errors
- ✅ Frontend lint: 0 errors
- ✅ Frontend typecheck: 0 errors

#### Agents Involved

- backend (dashboard time filter, SSE notifications)
- frontend (DashboardTimeFilter component, SSE hook, dashboard pages)
- documentation (changelog)

### [2026-04-15] — Sprint 3 Customers & Projects: FIFO, Auto-Status, Condition Mapping

#### Added

- `prisma/migrations/20260414172049_sprint3_maintenance_priority_worktypes_replacement_assets` — Migration: `priority`, `workTypes` on Maintenance; `oldAssetId`, `newAssetId`, `conditionAfter` on MaintenanceReplacement; reverse relations on Asset
- `apps/backend/src/modules/customers/clients/client.service.ts` — `activateOnInstallation()`: T3-02 auto-activate INACTIVE→ACTIVE on first installation; `deactivateOnDismantle()`: auto-deactivate when 0 IN_USE assets; `remove()`: T3-04 deletion protection (checks installation/maintenance/dismantle history)
- `apps/backend/src/modules/customers/clients/client.controller.ts` — `DELETE /customers/:uuid` endpoint with `@HttpCode(204)`
- `apps/frontend/src/features/customers/types/index.ts` — `DismantleItem` interface; `priority`, `workTypes` on Maintenance; `modelId` on materials; `oldAssetId`/`newAssetId`/`conditionAfter` on replacements

#### Changed

- `apps/backend/src/modules/customers/installations/installation.service.ts` — Full rewrite: FIFO consumption via `FifoConsumptionService` for materials with `modelId`, customer auto-activation after complete
- `apps/backend/src/modules/customers/maintenance/maintenance.service.ts` — Full rewrite: FIFO consumption; T3-11 replacement logic (validates old=IN_USE, new=IN_STORAGE, condition→status mapping, dual StockMovements); resolution validation; priority/workTypes support
- `apps/backend/src/modules/customers/dismantles/dismantle.service.ts` — Full rewrite: `mapConditionToStatus()` (NEW/GOOD/FAIR→IN_STORAGE, POOR→UNDER_REPAIR, BROKEN→DAMAGED); customer auto-INACTIVE via `ClientService`
- `apps/backend/src/modules/customers/maintenance/maintenance.controller.ts` — `complete()` accepts `@Body('resolution')` parameter
- `apps/backend/src/modules/customers/dismantles/dismantle.controller.ts` — `complete()` accepts `@Body('itemConditions')` array with `{ assetId, conditionAfter }`; fixed `AssetCondition` type cast
- `apps/backend/src/modules/customers/maintenance/dto/create-maintenance.dto.ts` — Added `priority` (HIGH/MEDIUM/LOW), `workTypes[]`, `modelId` on materials, `oldAssetId`/`newAssetId`/`conditionAfter` on replacements
- `apps/backend/src/modules/customers/installations/dto/create-installation.dto.ts` — Added `modelId` on `InstallationMaterialDto`
- `apps/backend/src/modules/customers/installations/installation.module.ts` — Imports: `AssetModule`, `ClientModule`
- `apps/backend/src/modules/customers/maintenance/maintenance.module.ts` — Imports: `AssetModule`
- `apps/backend/src/modules/customers/dismantles/dismantle.module.ts` — Imports: `ClientModule`
- `apps/frontend/src/features/customers/api/customers.api.ts` — `maintenanceApi.complete()` accepts `{ resolution }` body; `dismantleApi.complete()` accepts `{ itemConditions }` body
- `apps/frontend/src/features/customers/hooks/useMaintenance.ts` — `useCompleteMaintenance` accepts `{ id, resolution }` object
- `apps/frontend/src/features/customers/hooks/useDismantles.ts` — `useCompleteDismantle` accepts `{ id, itemConditions }` object
- `apps/frontend/src/features/customers/schemas/index.ts` — Added `modelId` on installation/maintenance materials; `priority`/`workTypes` on maintenance; `items` array on dismantle
- `apps/frontend/src/features/customers/pages/MaintenanceDetailPage.tsx` — Priority badge, workTypes display, model column in materials table, asset code in replacements table, conditionAfter badge
- `apps/frontend/src/features/customers/pages/MaintenanceListPage.tsx` — Priority badge column
- `apps/frontend/src/features/customers/pages/DismantleDetailPage.tsx` — Items table (asset code/name, conditionAfter badge)
- `apps/frontend/src/features/customers/pages/DismantleListPage.tsx` — Items count column

#### Fixed

- `apps/backend/src/modules/dashboards/dashboard.service.ts` — Removed unused `DateRange` import and `dateFilter` variable (pre-existing lint errors)
- Dismantle complete: all returned assets were set to `IN_STORAGE` regardless of condition — now maps via `mapConditionToStatus()`
- Maintenance complete: replacements only tracked descriptions — now tracks actual asset IDs with condition→status transitions

#### Quality Gate

- ✅ Frontend lint: 0 errors
- ✅ Backend lint: 0 errors
- ✅ Frontend typecheck: 0 errors

#### Agents Involved

- backend (client, installation, maintenance, dismantle services/controllers/DTOs/modules)
- frontend (types, schemas, API, hooks, pages)
- database (Prisma migration)
- documentation (changelog)

### [2026-04-15] — Sprint 2 Transactions: Approval Engine, Request, Loan, Return, Handover, Repair

#### Added

- `prisma/migrations/20260414163543_sprint2_request_item_status_repair_category_return_rejection` — Migration: `RequestItemStatus` enum, `RepairCategory` enum, `itemStatus`/`itemReason` on RequestItem, `category` on Repair, `rejectionCount` on AssetReturn
- `apps/backend/src/modules/transactions/repairs/repair.service.ts` — `reportLost()`: bypass-approval LOST reporting with instant escalation to SA & AL; `resolveLost()`: FOUND → IN_STORAGE / NOT_FOUND → DECOMMISSIONED
- `apps/backend/src/modules/transactions/repairs/repair.controller.ts` — `POST /repairs/report-lost`, `PATCH /repairs/:id/resolve-lost` endpoints
- `apps/backend/src/modules/transactions/returns/return.service.ts` — `resubmit()`: re-submit rejected return (REJECTED → PENDING), `MAX_REJECTION_CYCLES = 3` enforcement on reject
- `apps/backend/src/modules/transactions/returns/return.controller.ts` — `PATCH /returns/:id/resubmit` endpoint
- `apps/frontend/src/features/transactions/components/ApprovalTimeline.tsx` — Reusable approval timeline UI: color-coded step icons (green/red/blue/gray), CC section, role labels, pulse animation on current step
- `apps/frontend/src/features/transactions/hooks/useRepairs.ts` — `useReportLost()`, `useResolveLost()` hooks
- `apps/frontend/src/features/transactions/hooks/useReturns.ts` — `useResubmitReturn()` hook
- `apps/frontend/src/features/transactions/api/transactions.api.ts` — `repairApi.reportLost()`, `repairApi.resolveLost()`, `returnApi.resubmit()`

#### Changed

- `apps/backend/src/modules/transactions/requests/request.service.ts` — `approve()` enhanced: per-item `itemStatus` (STOCK_ALLOCATED, PROCUREMENT_NEEDED, PARTIAL, REJECTED) with smart next-status logic
- `apps/backend/src/modules/transactions/requests/dto/approve-request.dto.ts` — `itemAdjustments` now includes `itemStatus` enum and `itemReason` fields
- `apps/backend/src/modules/assets/purchases/purchase.service.ts` — Added one-per-model validation + auto-calculate `totalPrice`
- `apps/backend/src/modules/assets/depreciation/depreciation.service.ts` — Added one-per-purchase validation
- `apps/backend/src/core/scheduler/scheduler.module.ts` — Added `ScheduleModule.forRoot()` import (cron jobs fix)
- `apps/frontend/src/features/transactions/types/index.ts` — Enhanced `ApprovalStep` (sequence, approverRole, type, SKIPPED status), added `RequestItemStatus`, `RepairCategory`, `approvalChain` on `AssetReturn`
- `apps/frontend/src/features/transactions/components/index.ts` — Export `ApprovalTimeline`
- `apps/frontend/src/features/transactions/pages/RequestDetailPage.tsx` — Replaced inline approval chain with `<ApprovalTimeline />`
- `apps/frontend/src/features/transactions/pages/LoanDetailPage.tsx` — Added `<ApprovalTimeline />`
- `apps/frontend/src/features/transactions/pages/ReturnDetailPage.tsx` — Added `<ApprovalTimeline />`
- `apps/frontend/src/features/transactions/pages/HandoverDetailPage.tsx` — Added `<ApprovalTimeline />`
- `apps/frontend/src/features/transactions/pages/RepairDetailPage.tsx` — Added `<ApprovalTimeline />`

#### Quality Gate

- ✅ Frontend lint: 0 errors
- ✅ Backend lint: 0 errors
- ✅ Frontend typecheck (strict tsconfig.app.json): 0 errors

#### Agents Involved

- backend (request.service, repair.service/controller, return.service/controller, purchase.service, depreciation.service, scheduler.module)
- frontend (ApprovalTimeline, detail pages, hooks, API, types)
- database (Prisma migration)
- documentation (changelog)

### [2026-04-14] — Sprint 0 Foundation Validation & Security Fix

#### Changed

- `apps/backend/src/core/auth/auth.service.ts` — Hapus `as any` type cast pada `expiresIn` JWT sign options; gunakan nullish coalescing (`?? '15m'`, `?? '7d'`) untuk default value yang type-safe
- `apps/frontend/src/store/useAuthStore.ts` — Hapus `accessToken` dari `partialize` Zustand persist dan dari `localStorage.setItem` — accessToken sekarang disimpan di memory (Zustand state) saja
- `apps/frontend/src/lib/axios.ts` — Gunakan `useAuthStore.getState().accessToken` (in-memory) menggantikan `localStorage.getItem('accessToken')`; gunakan `useAuthStore.getState().setTokens()` pada token refresh; gunakan `useAuthStore.getState().logout()` saat refresh gagal

#### Security

- **XSS Mitigation**: `accessToken` tidak lagi disimpan di `localStorage`. Dipindahkan ke Zustand memory store (non-persisted) untuk mencegah pencurian token via XSS attack. `refreshToken` tetap di `localStorage` untuk cross-session persistence.
- **Type Safety**: Eliminasi `as any` cast pada `JwtService.signAsync` options di `auth.service.ts`

#### Validated (Sprint 0 — Foundation)

- ✅ Auth flow: login → JWT → refresh → logout → mustChangePassword
- ✅ Rate limiting: `/auth/login` (5 req/min), `/auth/refresh` (10 req/min)
- ✅ bcrypt cost = 12
- ✅ tokenVersion check di JWT Strategy (`payload.tokenVersion !== user.tokenVersion`)
- ✅ Logout invalidates token (tokenVersion increment)
- ✅ MustChangePasswordGuard: block API + redirect `/change-password`
- ✅ PermissionsGuard: 3-tier model (default → restriction → mandatory)
- ✅ RolesGuard: RBAC role enforcement
- ✅ ResponseTransformInterceptor: format `{ success, data, meta? }`
- ✅ AuditTrailInterceptor: auto-logging CUD operations
- ✅ AllExceptionsFilter: unified Prisma + HTTP error mapping
- ✅ PrismaExceptionFilter: P2002/P2003/P2025 mapping
- ✅ 85+ permissions constants dengan 3-tier model
- ✅ AuthGuard: redirect ke `/login` jika unauthenticated
- ✅ RoleProtectedRoute: role-based route protection
- ✅ Protected routes apply RoleProtectedRoute sesuai scope

#### Agents Involved

- backend (auth.service.ts)
- frontend (useAuthStore.ts, axios.ts)
- security (XSS token storage audit)

### [2026-04-14] — Sprint Rebuild Master Execution Plan

#### Added

- `00_PLANNING/SPRINT/PLAN/SPRINT_REBUILD_MASTER.md` — Single-source-of-truth master execution plan untuk auto model (Sonnet 4.6 / Haiku 4.5) dengan:
  - Konteks status saat ini (93.6% feature complete, business logic 55%)
  - Standar kode lengkap (response format, backend/frontend pattern, TypeScript rules, naming conventions)
  - Daftar file target per sprint (Sprint 0–5): file direfaktoring + file baru
  - Approval matrix 3 workflows (request, loan/return/handover/repair, project/customer ops)
  - Asset status state machine + condition→status mapping
  - Stock movement types catalog
  - Dependency map antar file (schema → types → api → hooks → pages → schemas)
  - Urutan eksekusi + prinsip pengerjaan

#### Changed

- Konsolidasi dari 6 dokumen sprint terpisah + 3 analisis ke 1 dokumen master terpadu

#### Agents Involved

- `project-manager`
- `documentation`

---

### [2026-04-14] — Rebuild Sprint Documentation

#### Added

- `.github/sprints/REBUILD/INDEX.md` — Sprint roadmap rebuild dari analisa hingga UAT, dependency map, timeline overview
- `.github/sprints/REBUILD/00_ANALISA_CURRENT_STATE.md` — Analisa persentase kelengkapan kode saat ini vs PRD v3.1 (overall ~60%), gap analysis per domain (F-01 s/d F-07), quality gate status, compliance audit, risiko & rekomendasi
- `.github/sprints/REBUILD/01_SPRINT_FOUNDATION.md` — Sprint 0: validasi auth flow, RBAC guards, response format, base layout, Prisma schema integrity
- `.github/sprints/REBUILD/02_SPRINT_MASTER_DATA.md` — Sprint 1: kategori hirarki, pencatatan aset, status state machine, stok management, FIFO consumption, unit conversion, pembelian & depresiasi (14 tasks)
- `.github/sprints/REBUILD/03_SPRINT_TRANSACTIONS.md` — Sprint 2: approval engine dynamic chain, request pengadaan multi-stage, loan/return lifecycle, handover, repair + lapor hilang (21 tasks)
- `.github/sprints/REBUILD/04_SPRINT_CUSTOMERS_PROJECTS.md` — Sprint 3: customer auto-status, instalasi FIFO, maintenance replacement, dismantle condition mapping, InfraProject lifecycle (23 tasks)
- `.github/sprints/REBUILD/05_SPRINT_DASHBOARD_CROSSCUTTING.md` — Sprint 4: dashboard 5 role variants, notifikasi in-app + WA, QR/barcode, import/export Excel/PDF, settings enrichment (20 tasks)
- `.github/sprints/REBUILD/06_SPRINT_STABILIZATION.md` — Sprint 5: integration testing, security audit OWASP, performance optimization, UAT preparation, go-live criteria (22 tasks)

#### Agents Involved

- `project-manager`
- `documentation`

---

### [2026-07-16] — Business Logic Extraction from OLD_VERSION Docs

#### Added

- `.github/docs/01_BUSINESS_LOGIC/ASSET_LIFECYCLE.md` — Referensi lengkap lifecycle aset: klasifikasi (INDIVIDUAL/COUNT/MEASUREMENT), status state machine dengan valid transitions, asset conditions, registration flow, stock movement tracking (8 tipe), FIFO consumption algorithm, unit conversion, threshold alerts, availability check, ID generation patterns, data model reference
- `.github/docs/01_BUSINESS_LOGIC/TRANSACTION_WORKFLOWS.md` — Workflow detail semua transaksi: Request Pengadaan (5-stage approval per-item), Loan Request (status flow dengan assignment), Asset Return (per-item verification ACCEPT/REJECT), Handover (3-party system), Material Split Logic, notification triggers per workflow
- `.github/docs/01_BUSINESS_LOGIC/CUSTOMER_OPERATIONS.md` — Customer management: auto-status transitions (INACTIVE↔ACTIVE), installation flow (FIFO material consumption), maintenance (replacement/material/inspection), dismantle workflow (3-step dengan duplicate protection), repair tracking, data model reference
- `.github/docs/01_BUSINESS_LOGIC/CATEGORY_HIERARCHY.md` — Hierarki kategori 3-level (Category→Type→Model), Purchase Master Data (1-to-1 dengan AssetModel), depreciation configuration, contoh hierarki implementasi, deletion protection, Division-Category M2M

#### Changed

- `.github/docs/02_STANDARDS_AND_PROCEDURES/SECURITY_AND_RBAC_MATRIX.md` — Ditambahkan Section 9 (Role Account Limits: SUPER_ADMIN max 1, ADMIN_LOGISTIK max 3, ADMIN_PURCHASE max 3), Section 10 (Permission Sanitization: strip→restrict→inject 3-step flow), Division-Category Association

#### Files Modified

- `.github/docs/01_BUSINESS_LOGIC/ASSET_LIFECYCLE.md` — Baru
- `.github/docs/01_BUSINESS_LOGIC/TRANSACTION_WORKFLOWS.md` — Baru
- `.github/docs/01_BUSINESS_LOGIC/CUSTOMER_OPERATIONS.md` — Baru
- `.github/docs/01_BUSINESS_LOGIC/CATEGORY_HIERARCHY.md` — Baru
- `.github/docs/02_STANDARDS_AND_PROCEDURES/SECURITY_AND_RBAC_MATRIX.md` — Updated (Section 9-10)

#### Agents Involved

- `documentation`

---

### [2026-07-16] — Old App Feature Documentation for Rebuild Planning

#### Added

- `.github/docs/00_PLANNING/OLD_VERSION/README.md` — Index overview seluruh dokumentasi fitur apps lama dengan ringkasan tech stack
- `.github/docs/00_PLANNING/OLD_VERSION/01_PENCATATAN_ASET_STOK.md` — Dokumentasi lengkap asset registration, stock management, stock movements, threshold alerts, klasifikasi ASSET/MATERIAL, status state machine, FIFO consumption
- `.github/docs/00_PLANNING/OLD_VERSION/02_REQUEST_PINJAM_KEMBALI_HANDOVER.md` — Multi-stage approval workflow (logistic→purchase→CEO), loan request, asset return per-item verification, handover dengan material measurement split
- `.github/docs/00_PLANNING/OLD_VERSION/03_PELANGGAN_INSTALASI_MAINTENANCE_DISMANTLE.md` — Customer lifecycle, installation FIFO consumption, maintenance replacement logic, dismantle workflow
- `.github/docs/00_PLANNING/OLD_VERSION/04_AKUN_DIVISI_KATEGORI_PEMBELIAN.md` — Role system dengan account limits, permission system, 3-level category hierarchy, purchase master, depreciation calculation
- `.github/docs/00_PLANNING/OLD_VERSION/05_LOGIN_AUTH.md` — JWT auth flow, timing-safe comparison, token versioning, force change password, password reset via admin
- `.github/docs/00_PLANNING/OLD_VERSION/06_SIDEBAR_MINIMIZE_DROPDOWN.md` — Collapsed/expanded mode design, click-based flyout panels, permission-based menu filtering, active page sync

#### Files Modified

- `.github/docs/00_PLANNING/OLD_VERSION/README.md` — Baru
- `.github/docs/00_PLANNING/OLD_VERSION/01_PENCATATAN_ASET_STOK.md` — Baru
- `.github/docs/00_PLANNING/OLD_VERSION/02_REQUEST_PINJAM_KEMBALI_HANDOVER.md` — Baru
- `.github/docs/00_PLANNING/OLD_VERSION/03_PELANGGAN_INSTALASI_MAINTENANCE_DISMANTLE.md` — Baru
- `.github/docs/00_PLANNING/OLD_VERSION/04_AKUN_DIVISI_KATEGORI_PEMBELIAN.md` — Baru
- `.github/docs/00_PLANNING/OLD_VERSION/05_LOGIN_AUTH.md` — Baru
- `.github/docs/00_PLANNING/OLD_VERSION/06_SIDEBAR_MINIMIZE_DROPDOWN.md` — Baru

#### Agents Involved

- `documentation`

### [2026-04-14] — Backend Typecheck Remediation (Assets + Dashboard)

#### Fixed

- Perbaikan `AssetService.updateStockThreshold()` agar payload `stockThreshold.upsert().create` menyertakan `createdById` sesuai kontrak Prisma model `StockThreshold`
- Perbaikan endpoint threshold di controller agar meneruskan `@CurrentUser('id')` ke service untuk kebutuhan audit field `createdById`
- Perbaikan `DashboardService.getSpendingByCategory()` dari relasi include yang tidak valid menjadi mapping `modelId -> categoryId` melalui query `asset` yang typed-safe

#### Changed

- Signature method service threshold diupdate menjadi menerima `userId` sebagai parameter ketiga

#### Validation

- Backend typecheck: passed
- Frontend lint: passed
- Frontend typecheck: passed
- Backend lint: passed

#### Agents Involved

- `backend`
- `documentation`

### [2026-04-14] — Sprint 6 Remediation Completion (Gap Closure 100%)

#### Added

- Backend endpoint `PUT /api/v1/assets/models/:modelId/threshold` dengan DTO validasi `UpdateStockThresholdDto` dan service upsert `stockThreshold`
- Dashboard endpoint `GET /api/v1/dashboard/operations/daily-ops` untuk ringkasan transaksi harian (`request`, `loan`, `handover`, `return`)
- Dashboard endpoint `GET /api/v1/dashboard/finance/spending-by-category` untuk agregasi pengeluaran per kategori aset
- Frontend export binding baru: `exportApi.stock()`, `exportApi.handovers()`, `exportApi.repairs()`
- Frontend hooks baru: `useExportStock()`, `useExportHandovers()`, `useExportRepairs()`

#### Changed

- Dashboard Super Admin: tambah card metric `Dalam Perbaikan` (status-based `UNDER_REPAIR`)
- Dashboard Operations: tambah section `Aktivitas Hari Ini`
- Dashboard Finance: tambah section `Pengeluaran per Kategori`
- StockPage: threshold sekarang bisa diubah inline dan disimpan langsung dari UI
- HandoverListPage dan RepairListPage: tambah `ExportButton` untuk export data transaksi
- Dokumentasi `USER_SYSTEM_FLOW.md` §14 ditambahkan decision note: implementasi menggunakan mapping `PENDING = DRAFT + PLANNING`
- `SPRINT_PLAN.md` di-update ke v1.2: Sprint 2/3/4/6 menjadi 100% complete dan seluruh gap ditandai resolved

#### Fixed

- Gap Sprint 4 export frontend binding (stock, handover, repair) ditutup penuh
- Gap dashboard completeness (SA underRepair, Ops daily summary, Finance spending/category) ditutup penuh
- Gap stock threshold CRUD ditutup penuh melalui endpoint + UI inline editing

#### Agents Involved

- `backend`
- `frontend`
- `documentation`
- `orchestrator`

### [2026-04-14] — Sprint Completion Analysis & Remediation Plan

#### Added

- **SPRINT_ANALYSIS_REPORT.md** — File analisa lengkap tingkat penyelesaian Sprint 1–5 dengan persentase per sprint dan per task (93.6% overall completion)
- **Sprint 6 (Remediation Sprint)** — 7 task tambahan di SPRINT_PLAN.md untuk menutup semua gap: stock threshold CRUD, dashboard metrics (underRepair, daily ops, spending/category), export frontend bindings (stock, handover, repair), project lifecycle documentation

#### Changed

- **SPRINT_PLAN.md** — Updated ke v1.1: semua tracking matrix (USER_MANUAL_SOP, USER_SYSTEM_FLOW, API_CONTRACT, SECURITY_RBAC) di-update dari ⬜ ke ✅/⚠️ sesuai hasil verifikasi kode aktual. Status Saat Ini table di-update dengan coverage terkini. Acceptance Criteria per sprint di-update dengan status checked/partial

#### Agents Involved

- `project-manager` (analysis, planning)
- `documentation` (changelog, report)

---

### [2026-04-13] — Sprint 5 Completion (5.1-5.7)

#### Added

- **Sprint 5.1** - Global command palette (`Ctrl+K`) using `cmdk`; new shared UI primitive `components/ui/command.tsx`; quick navigation groups for dashboard, asset, transaction, customer, and settings pages
- **Sprint 5.5** - WhatsApp notification integration via `WhatsAppService` with optional env config (`WHATSAPP_API_URL`, `WHATSAPP_TOKEN`) and notification fan-out from `NotificationService`
- **Sprint 5.6** - Handover print support with `Cetak` action in handover detail page and print-focused stylesheet rules

#### Changed

- **Sprint 5.2** - Breadcrumb label coverage expanded for additional route segments (`notifications`, `installation`, dashboard subroutes, settings subroutes)
- **Sprint 5.3** - Asset list page now renders responsive mobile card layout (<768px) and desktop table layout (>=768px)
- **Sprint 5.4** - Theme persistence verified through existing Zustand `persist` store (`ui-storage`) and `ThemeProvider` DOM class sync

#### Fixed

- **Sprint 5.7** - Frontend change-password validation aligned with backend policy by requiring at least one special character
- Asset list desktop empty-state action now routes to create-asset page

#### Security

- Password validation compliance improved on forced password-change flow to enforce stronger password complexity at UI layer before API submission

#### Agents Involved

- `orchestrator` - coordinated Sprint 5 delivery and quality gate

### [2026-04-16] — Sprint 1-4 Gap Closure: 100% Completion

#### Added

- **Sprint 3.2** — `TaskStatus` enum (`TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`) added to `create-project.dto.ts`; `UpdateTaskDto` class with `@IsEnum` validation exported; `project.controller.ts` and `project.service.ts` updated to use typed DTO instead of plain object for `PATCH /:id/tasks/:taskId`
- **Sprint 4.4** — `GET /export/stock` endpoint: exports `StockMovement` records with asset info, movement type, quantity, reference, and date filters. `ExportStockQueryDto` DTO added with `movementType`, `startDate`, `endDate` query params
- **Sprint 4.5** — `GET /export/handovers` and `GET /export/repairs` endpoints for Handover and Repair bulk exports (XLSX/CSV/PDF format support). Methods `exportHandovers()` and `exportRepairs()` added to `ExportService`
- **Sprint 4.7** — Audit Trail filters UI: `AuditLogPage.tsx` now includes entity type dropdown (12 entity types), user filter dropdown (fetched from `useUsers`), start/end date range inputs, and a Reset Filter button. Backend already supported these filters via `FilterAuditDto`
- **Sprint 4.6** — Import two-step preview flow: `POST /import/assets/preview` endpoint added (validates without DB insertion); `ImportPreviewResult` type created; `usePreviewImportAssets()` hook added; `ImportDialog.tsx` redesigned with Step 1 (upload → Preview) → Step 2 (review table + error list → Import) → Step 3 (results)
- **Sprint 4.2** — QR Code scan: `html5-qrcode` installed; `QRScannerDialog.tsx` component created with camera-based QR scanning using `Html5Qrcode`; supports asset code and URL path formats; added to `AssetListPage.tsx` toolbar as "Scan QR" button
- **Sprint 1.8 (from previous session)** — `registerAssets()` endpoint and flow fully implemented
- **Sprint 2.1 (from previous session)** — `notifyApprovalRequired()` called in all 4 transaction `create()` methods

#### Changed

- `ImportDialog.tsx` — redesigned from single-step to two-step preview+confirm flow
- `AuditLogPage.tsx` — added 4 new filter controls (entity type, user, date from, date to)
- `export-import.ts` (lib) — added `ImportPreviewResult`, `ImportPreviewRow` types and `importApi.previewAssets()` method
- `use-export-import.ts` (hook) — added `usePreviewImportAssets()` hook and `ImportPreviewResult` import
- `export.service.ts` — added 3 new export methods before format router
- `export.controller.ts` — added 3 new GET endpoints with proper auth and throttle
- `export-query.dto.ts` — added `ExportStockQueryDto` with date/movement type filters

#### Agents Involved

- `orchestrator` — coordinated full Sprint 1-4 gap closure

---

### [2026-04-15] — Fix: Prisma Seed P2002 Unique Constraint on `employee_id`

#### Fixed

- **`prisma/seed.ts`** — User `upsert` sebelumnya menggunakan `where: { email }` namun field `employee_id` juga unique constraint. Jika user dengan `employeeId` yang sama sudah ada (email berbeda atau create path), terjadi P2002. Diperbaiki dengan mengubah `where` menjadi `{ employeeId: user.employeeId }` dan menambahkan semua field ke `update: {}` agar re-run seed idempoten.

#### Agents Involved

- `database` — Fix seed upsert logic

### [2026-04-14] — Sprint 3 & 4: Project Lifecycle, Customer Operations, Dashboard & Audit Trail

#### Added

**Sprint 3 — Backend:**

- **Project lifecycle state machine** — `complete()`, `hold()`, `resume()` methods di ProjectService. State flow: IN_PROGRESS → COMPLETED, IN_PROGRESS ↔ ON_HOLD
- **ON_HOLD status** — Enum `TransactionStatus` diperluas dengan status `ON_HOLD` via Prisma migration
- **Project task CRUD** — `addTask()`, `updateTask()`, `removeTask()` endpoints di ProjectController
- **Project material CRUD** — `addMaterial()`, `removeMaterial()` endpoints
- **Project team CRUD** — `addTeamMember()`, `removeTeamMember()` endpoints
- **Installation complete** — `complete()` method dengan StockMovement OUT untuk material yang punya `modelId`
- **Maintenance complete** — `complete()` method dengan StockMovement OUT untuk material pengganti
- **Dismantle complete** — `complete()` method mengembalikan aset ke IN_STORAGE + StockMovement IN records
- **DismantleItem model** — Model baru untuk tracking aset yang di-dismantle beserta kondisi setelah pembongkaran
- **modelId field** — InstallationMaterial & MaintenanceMaterial sekarang bisa di-link ke AssetModel
- **Prisma migration** — `sprint3_project_lifecycle_customer_ops`

**Sprint 3 — Frontend:**

- **ProjectDetailPage** — Tombol Selesaikan, Tunda, Lanjutkan untuk project lifecycle IN_PROGRESS/ON_HOLD
- **ProjectListPage** — Filter status ditambah APPROVED dan ON_HOLD
- **InstallationDetailPage** — Tombol Selesaikan untuk status IN_PROGRESS
- **MaintenanceDetailPage** — Tombol Selesaikan untuk status IN_PROGRESS
- **DismantleDetailPage** — Tombol Selesaikan untuk status IN_PROGRESS
- **API layer** — `projectApi.complete()`, `projectApi.hold()`, `projectApi.resume()`, customer `complete()` endpoints
- **Hooks** — `useCompleteProject`, `useHoldProject`, `useResumeProject`, `useCompleteInstallation`, `useCompleteMaintenance`, `useCompleteDismantle`

**Sprint 4 — Frontend:**

- **AuditLogPage** — Halaman audit trail di `/settings/audit-log` dengan tabel activity logs, filter aksi (CREATE/UPDATE/DELETE), search, pagination
- **Audit API & hook** — `auditApi.getAll()` + `useAuditLogs()` hook
- **Audit Trail navigation** — Menu "Audit Trail" di sidebar Pengaturan (SUPERADMIN only)
- **Route** — `/settings/audit-log` dengan `RoleProtectedRoute` SUPERADMIN

**Sprint 4 — Already Implemented (verified):**

- QR code display (`QrCodeSection`) di AssetDetailPage ✅
- QR code download (`useDownloadQrCode`) ✅
- Export buttons (XLSX/CSV/PDF) di AssetListPage, RequestListPage, LoanListPage, CustomerListPage ✅
- Import dialog di AssetListPage ✅

#### Changed

- `TransactionStatus` type di frontend — ditambah `'ON_HOLD'`
- Settings API exports — ditambah `auditApi`, `AuditFilterParams`, `AuditLog`

#### Agents Involved

- **backend** — Project lifecycle, customer operations, Prisma migration
- **frontend** — All UI changes, hooks, API layer
- **database** — Schema changes, DismantleItem model

### [2026-04-14] — Sprint 2: Notification, Overdue, Repair & mustChangePassword (P1 HIGH)

#### Added

- **mustChangePassword field** — Migrasi database: menambahkan kolom `must_change_password` ke tabel `users` (default: `false`)
- **MustChangePasswordGuard** — Global guard NestJS yang memblokir semua API kecuali `/auth/change-password`, `/auth/logout`, `/auth/refresh` saat user harus mengganti password
- **Login response includes mustChangePassword** — `AuthService.login()` sekarang mengembalikan field `mustChangePassword` di response user
- **changePassword resets mustChangePassword** — Setelah berhasil ganti password, field `mustChangePassword` otomatis di-set ke `false`
- **ScheduleModule** — `@nestjs/schedule` terinstall dan `ScheduleModule.forRoot()` teregistrasi di `AppModule`
- **SchedulerService** (`core/scheduler/scheduler.service.ts`) — Service cron job dengan 3 scheduled tasks:
  - `checkOverdueLoans()` — Daily 01:00: cek semua loan IN_PROGRESS yang melewati `expectedReturn`, kirim notifikasi WARNING ke peminjam, Leader divisi, dan Admin Logistik
  - `sendReturnReminders()` — Daily 08:00: kirim reminder REMINDER ke peminjam H-3 dan H-1 sebelum jatuh tempo
  - `checkStockThresholds()` — Setiap 6 jam: cek stok per model terhadap `StockThreshold.minQuantity`, kirim notif WARNING ke Admin Logistik + Super Admin (dengan dedupe per hari)
- **Repair workflow chain — 3 jalur resolusi**:
  - `sendOutForRepair()` — Kirim aset ke service center eksternal (asset status → `OUT_FOR_REPAIR`)
  - `decommission()` — Aset tidak dapat diperbaiki (asset status → `DECOMMISSIONED`, condition → `HEAVILY_DAMAGED`, StockMovement OUT)
  - Controller endpoints: `PATCH /repairs/:id/send-out`, `PATCH /repairs/:id/decommission`
- **Repair notifications** — Semua lifecycle transitions (approve, reject, execute, complete, cancel, sendOut, decommission) sekarang kirim notifikasi ke creator
- **NotificationService action labels** — Ditambahkan: `ASSETS_ASSIGNED`, `PURCHASING`, `IN_DELIVERY`, `ARRIVED` ke `notifyTransactionStatusChange()`
- **NotificationListPage** (`features/notifications/pages/NotificationListPage.tsx`) — Halaman notifikasi lengkap: list dengan card UI, pagination, filter by type/unread, icon + warna per type, badge label, timestamp relatif + absolut
- **Route /notifications** — Ditambahkan ke protected routes, accessible by semua role
- **NotificationDropdown "Lihat semua"** — Link navigasi ke `/notifications` di bawah dropdown
- **ChangePasswordPage** (`features/auth/pages/ChangePasswordPage.tsx`) — Halaman standalone untuk ganti password: validasi Zod (min 8 char, huruf besar, kecil, angka), toggle show/hide per field, auto-redirect ke dashboard setelah berhasil
- **AuthGuard mustChangePassword redirect** — Redirect otomatis ke `/change-password` jika `user.mustChangePassword === true`
- **Route /change-password** — Protected route di luar AppLayout (standalone page)

#### Changed

- **AppModule** — Ditambahkan: `ScheduleModule.forRoot()`, `SchedulerModule`, `MustChangePasswordGuard` sebagai global guard
- **RepairService** — Diinjeksi `NotificationService`, semua method lifecycle sekarang kirim notifikasi
- **AuthStore UserData** — Ditambahkan field `mustChangePassword?: boolean`
- **LoginResponse** — Ditambahkan field `mustChangePassword: boolean`
- **LoginPage** — Redirect ke `/change-password` jika `mustChangePassword === true`

#### Agents Involved

- `backend` — MustChangePasswordGuard, SchedulerService, RepairService enhancements, AuthService updates
- `frontend` — NotificationListPage, ChangePasswordPage, AuthGuard update, login flow
- `database` — Migration `add_must_change_password_to_user`

---

### [2026-04-14] — Sprint 1: Frontend Transaction Workflow Completion

#### Added

- **ReturnDetailPage reject & execute buttons** — Tombol Tolak (dengan RejectDialog) dan Eksekusi ditambahkan berdasarkan status PENDING/APPROVED
- **HandoverDetailPage execute button** — Tombol Eksekusi ditambahkan saat status APPROVED, menggunakan `useExecuteHandover` hook
- **ReturnFormPage per-asset condition assessment** — Form pengembalian sepenuhnya ditulis ulang: pencarian pinjaman by kode → auto-populate daftar aset → dropdown kondisi per-aset (conditionBefore, conditionAfter) → catatan per-aset
- **LoanDetailPage asset assignment dialog** — Dialog pencarian & assign aset IN_STORAGE ke pinjaman yang disetujui, dengan checkbox selection dan search filter
- **LoanDetailPage execute button** — Tombol eksekusi pinjaman saat status APPROVED dan aset sudah di-assign
- **RequestDetailPage partial approval dialog** — Dialog approval dengan per-item qty adjustment (min/max validation) untuk partial approval
- **RequestDetailPage post-approval transitions** — Tombol transisi status: Proses Pengadaan, Tandai Dikirim, Tandai Diterima, Selesai

#### Changed

- **`requestApi.approve`** — Menerima `itemAdjustments` parameter untuk partial approval
- **`loanApi.assignAssets`** — Menerima `version` parameter, endpoint diperbaiki ke `/loans/${uuid}/assign-assets`
- **`loanApi.execute`** & **`handoverApi.execute`** — Endpoint baru ditambahkan di API client
- **Transaction hooks** — Ditambahkan: `useExecuteRequest`, `useAssignLoanAssets`, `useExecuteLoan`, `useExecuteHandover`
- **Transaction types** — `RequestItem` ditambahkan `approvedQuantity`, `LoanRequest` ditambahkan `assetAssignments` dan `returns`, interface `LoanAssetAssignment` baru

#### Fixed

- **Handover execute asset status** — Backend `handover.service.ts` sekarang mengupdate status aset ke `IN_USE` saat eksekusi serah terima (sebelumnya hanya update `currentUserId`)

#### Agents Involved

- `frontend` — All UI changes (detail pages, forms, hooks, API client, types)
- `backend` — Handover service fix (asset status IN_USE)

---

### [2026-04-14] — Sprint 1: Core Transaction Workflows (P0 CRITICAL)

#### Added

- **StockMovementService** (`stock-movements/stock-movement.service.ts`) — Shared service for creating stock movement records. Supports standalone and transactional usage via optional `tx` parameter. Methods: `create()`, `createMany()`, `findByAsset()`
- **StockMovementModule** — Exported module imported by handover, loan, return, and repair modules
- **Handover execute: TRANSFER stock movement + PIC update** — On handover execute, each asset's `currentUserId` is updated to `toUserId`, and a `TRANSFER` StockMovement record is created per item
- **Loan execute: OUT stock movement + asset custody** — On loan execute, each assigned asset status changes to `IN_CUSTODY`, `currentUserId` set to borrower, and `OUT` StockMovement created per assignment
- **Return execute: IN stock movement + condition assessment** — On return execute, assets return to `IN_STORAGE` (or `DAMAGED` if condition is POOR/BROKEN), `currentUserId` cleared, `IN` StockMovement created. Auto-creates Repair record if asset condition is POOR/BROKEN
- **Return execute: auto-complete loan** — When all assigned assets of a loan are returned (COMPLETED returns), the loan status automatically transitions to COMPLETED
- **Repair execute/complete: stock movements** — Execute creates `OUT` movement (asset entering repair), complete creates `IN` movement (asset back from repair)
- **Approval chain engine rewrite** (`approval.service.ts`) — New `ApprovalChainStep` interface with status tracking (PENDING/APPROVED/REJECTED/SKIPPED), `processApproval()`, `processRejection()`, `parseChain()` for backward compat, `buildApprovalChain()`, `isChainComplete()`
- **Self-approval prevention** — All transaction services (request, loan, handover, repair, return) validate `createdById !== approverId`, returning 422 UnprocessableEntityException
- **Partial approval** (`ApproveRequestDto`) — Request approve now accepts `itemAdjustments[]` with per-item `approvedQuantity`. Validates qty doesn't exceed requested amount. Schema migration adds `approved_quantity` column to `request_items`
- **Loan asset assignment** (`PATCH /loans/:id/assign-assets`) — New endpoint + `AssignAssetsDto`. Admin Logistik assigns specific assets (by ID) to an approved loan. Validates assets exist and are `IN_STORAGE`. Replace strategy for re-assignment
- **Request post-approval lifecycle** — State machine: APPROVED → PURCHASING → IN_DELIVERY → ARRIVED → COMPLETED. Each `execute` call advances to the next valid state
- **JWT fullName** — Added `fullName` to JwtPayload interface and auth service for approval tracking

#### Changed

- All transaction controllers' `execute` endpoints now accept `@CurrentUser()` to pass `userId` for stock movement `createdById`
- Repair controller `complete` endpoint now accepts `@CurrentUser()` for stock movement tracking
- Request controller `approve` now uses `ApproveRequestDto` body instead of separate `@Body()` params

#### Database Migrations

- `20260413121440_add_approved_quantity_to_request_items` — Adds nullable `approved_quantity` INT column to `request_items` table

#### Agents Involved

- `backend` — All service/controller/module changes
- `database` — Schema migration for `approvedQuantity`

---

### [2026-04-13] — Sprint 1: Bugfix — TS Compilation Errors

#### Fixed

- **Duplicate `UserRole` import** in `handover.controller.ts` — Removed duplicate import line that caused TS2300
- **Notification action type widened** (`notification.service.ts`) — Added `'ASSETS_ASSIGNED'`, `'PURCHASING'`, `'IN_DELIVERY'`, `'ARRIVED'` to `notifyTransactionStatusChange()` action union type to support new transaction lifecycle states
- **Request execute notification type cast** (`request.service.ts`) — Fixed `TRANSITION_LABELS` return type mismatch by applying explicit type assertion

#### Agents Involved

- `backend` — Bug fixes for TypeScript compilation errors

---

### [2026-04-14] — Phase 3–5: Security Hardening (Optimistic Locking, Permission UI, Error Handling)

#### Added

- **ProjectService optimistic locking** — Semua method mutasi (approve, reject, execute, cancel, update) sekarang menggunakan `updateMany()` + version check → ConflictException 409 jika data telah diubah oleh user lain
- **ProjectService SSE events** — Emit `transaction_updated` event dengan type `project` setiap kali status berubah, memungkinkan real-time UI sync antar admin
- **AssetService optimistic locking** — Method `update()` sekarang menggunakan `updateMany()` + version check → ConflictException 409
- **`usePermissions` hook** — Custom hook frontend untuk mengecek permission user (`can`, `canAny`, `canAll`) dengan auto-bypass untuk SUPERADMIN
- **Frontend permission constants** (`config/permissions.ts`) — Mirror dari backend PERMISSIONS keys untuk type-safe permission checking di UI
- **ProjectDetailPage action buttons** — Tambah tombol Approve, Reject, Execute, Batalkan dengan permission-based visibility dan version-aware mutation hooks
- **AssetDetailPage delete wiring** — Tombol Delete sekarang berfungsi dengan `useDeleteAsset()` dan permission `ASSETS_DELETE`
- **SSE `project` event type** — Ditambahkan ke `TransactionEventType` union type

#### Changed

- **6 detail pages migrated** ke permission-based UI — LoanDetailPage, RequestDetailPage, ReturnDetailPage, HandoverDetailPage, RepairDetailPage, ProjectDetailPage sekarang menyembunyikan action buttons jika user tidak punya permission yang sesuai
- **AssetDetailPage** — Edit/Delete buttons tersembunyi jika user tidak punya `ASSETS_EDIT`/`ASSETS_DELETE`
- **ProjectController** — Semua mutation endpoints (approve, reject, execute, cancel, update) sekarang menerima `version` dari request body
- **AssetController** — Endpoint `update` sekarang menerima `version` dari request body
- **Frontend `projectApi`** — Semua mutation functions (approve, reject, execute, cancel, update) sekarang mengirim `version` parameter
- **Frontend `assetApi.update`** — Sekarang mengirim `version` parameter
- **Frontend hooks** — `useUpdateProject`, `useUpdateAsset` sekarang membutuhkan `version`, ditambah hooks baru: `useApproveProject`, `useRejectProject`, `useExecuteProject`, `useCancelProject`
- **Axios interceptor** — Ditingkatkan dengan: (1) error 403 → toast "Anda tidak memiliki izin", (2) error 409 → toast dengan tombol "Muat Ulang", (3) network error → toast "Tidak dapat terhubung ke server", (4) server message forwarding

#### Security

- **100% optimistic locking coverage** — Semua entitas transaksional (Request, Loan, Return, Handover, Repair, Project) + Asset kini menggunakan optimistic locking
- **Permission-based UI** — Button visibility dikontrol oleh permission user, mencegah unauthorized action attempts
- **403 Forbidden handling** — Auto-toast saat backend menolak aksi yang tidak memiliki izin
- **Conflict resolution UX** — 409 error menampilkan toast dengan action button "Muat Ulang" untuk kemudahan user

#### Agents Involved

- `backend` — Optimistic locking implementation
- `frontend` — Permission UI & error handling
- `security` — Security audit compliance

---

### [2026-04-14] — Phase 1 & 2: Granular Permissions System + Error Handling & Resilience

#### Added

- **Granular Permissions System** — 85+ permission constants dengan 3-tier model (ROLE_DEFAULT_PERMISSIONS, ROLE_RESTRICTIONS, MANDATORY_PERMISSIONS) di `permissions.constants.ts`
- **PermissionsGuard** — Guard yang meng-check permissions per-endpoint, mendukung SUPERADMIN bypass dan AND logic
- **AuthPermissions Decorator** — Composite decorator menggabungkan JwtAuthGuard + PermissionsGuard + RequirePermissions
- **Unified AllExceptionsFilter** — Filter tunggal menangani HttpException, PrismaErrors (P2002, P2003, P2014, P2025), connection errors, dan generic catch-all
- **TimeoutInterceptor** — Global 30s timeout → 408 RequestTimeout
- **LoggingInterceptor** — Log method, URL, userId, dan response time per-request
- **Per-endpoint Rate Limiting** — Login: 5 req/min, Refresh: 10 req/min, Upload: 10 req/min, Export: 5 req/min

#### Changed

- **22 controllers migrated** dari `@Roles(UserRole.XXX)` ke `@AuthPermissions(PERMISSIONS.XXX)` — zero `@Roles()` remaining
- **Transaction controllers** (6 files) yang sebelumnya TANPA access control sekarang memiliki proper permissions
- **Settings controllers** — User & Division: class-level `@Roles(SUPERADMIN)` diganti per-method `@AuthPermissions()`
- **JwtPayload interface** — Ditambah field `permissions: string[]`
- **auth.service.ts** — Login & refresh token sekarang include permissions dari database
- **main.ts** — Unified filter (AllExceptionsFilter) menggantikan HttpExceptionFilter + PrismaExceptionFilter terpisah; interceptor chain: Logging → Timeout → ResponseTransform

#### Security

- Transaction endpoints (requests, loans, returns, handovers, repairs, projects) yang sebelumnya terbuka untuk semua authenticated user sekarang dilindungi granular permissions
- Brute-force protection: login endpoint dibatasi 5 requests/menit
- File upload protection: 10 requests/menit
- Export endpoint protection: 5 requests/menit

#### Agents Involved

- `backend` — Full implementation
- `security` — RBAC matrix compliance

---

### [2026-04-13] — Complete SSE Auto Sync Data Implementation

#### Added

- **DB Migration** — Tambah kolom `version Int @default(1)` dan `rejectionReason` ke model `AssetReturn` (satu-satunya model yang belum punya)
- **Heartbeat SSE** — EventsController mengirim heartbeat setiap 30 detik untuk menjaga koneksi tetap hidup (mencegah proxy/load balancer menutup idle connections)
- **Frontend mutation hooks** — `useApproveReturn()`, `useRejectReturn()`, `useExecuteReturn()`, `useCancelReturn()` dengan optimistic locking (version parameter)
- **Frontend returnApi** — Method `approve`, `reject`, `execute`, `cancel` dengan version-based optimistic locking

#### Changed

- **ReturnService** — Semua method mutasi (approve, reject, execute, cancel) sekarang menggunakan optimistic locking (`updateMany` + version check) dan emit SSE event via `EventsService`. Menggantikan `update()` biasa tanpa concurrency control
- **ReturnController** — Endpoint approve, reject, execute, cancel sekarang menerima `version` dari request body
- **EventsController** — SSE stream sekarang merge event stream + heartbeat interval menggunakan RxJS `merge()`
- **AssetReturn type (frontend)** — Tambah field `version` dan `rejectionReason`
- **ReturnDetailPage** — Migrasi dari `useVerifyReturn` ke `useApproveReturn` dengan version tracking

#### Removed

- **useVerifyReturn** — Diganti dengan `useApproveReturn` yang sesuai dengan backend endpoint (`/approve` bukan `/verify`)

#### Agents Involved

- `database`, `backend`, `frontend`

### [2026-04-13] — Fix SSE EventsModule DI Error

#### Fixed

- **EventsModule** — `EventsController` inject `JwtService` untuk validasi token pada SSE endpoint, tapi `EventsModule` tidak import module yang menyediakan `JwtService`. Fix: import `AuthModule` (yang sudah export `JwtModule`) ke dalam `EventsModule`

#### Agents Involved

- `backend`

### [2026-04-12] — Fix Asset Detail, Stock Page, & Create Asset

#### Fixed

- **Asset Detail Page** — Route param mismatch `:uuid` → `:id` di `protected.tsx`. `AssetDetailPage` menggunakan `useParams<{ id }>()` sehingga tidak cocok dengan route `:uuid`, menyebabkan `id = undefined` dan data tidak bisa di-fetch
- **Stock Page kosong** — `getMainStock()` hanya query `IN_STORAGE` dan return struktur data salah (`{ modelId, status, count }` bukan `StockSummary`). Rewrite seluruh method `getMainStock()`, `getDivisionStock()`, `getPersonalStock()` menjadi shared `buildStockSummary()` yang return format benar (`modelName, brand, categoryName, typeName, totalQuantity, inStorage, inUse, underRepair, threshold`) dengan pagination dan search support
- **Create Asset gagal 400** — Dua problem: (1) DTO require `code` non-empty tapi frontend tidak kirim → buat `code` optional + auto-generate format `AST-YYYYMM-NNNNN` di service; (2) DTO reject field `note` karena `forbidNonWhitelisted` → tambah `note?: string` optional di DTO, strip sebelum Prisma create karena schema Asset belum punya kolom `note`
- **Depreciation API 404** — Frontend call `/assets/depreciation` (singular) tapi backend controller register di `/assets/depreciations` (plural). NestJS route matching mengarahkan ke `@Get(':id')` AssetController. Fix: update semua depreciation API path ke `/assets/depreciations`

#### Changed

- **Asset Controller** — `getStock()` sekarang menerima query params `page`, `limit`, `search` untuk pagination dan filtering
- **Asset Service** — Tambah method `buildStockSummary()` (shared logic) dan `generateAssetCode()` untuk auto-generate kode aset

#### Agents Involved

- `frontend`, `backend`

### [2026-04-12] — Comprehensive README & Auto Sync Data Documentation

#### Added

- **`README.md`** (root) — Dokumentasi komprehensif proyek: arsitektur, tech stack, fitur, setup, deployment, RBAC, quality gate, dan referensi ke `.github/docs/` sebagai dokumentasi wajib
- **`03_OPERATIONS/AUTO_SYNC_DATA.md`** — Implementation plan detail untuk fitur Auto Sinkronisasi Data (SSE + Optimistic Locking): latar belakang, arsitektur, detail teknis backend/frontend/database, sequence diagram, error handling, UX scenarios, testing plan, dan checklist implementasi

#### Agents Involved

- `documentation`

---

### [2026-04-12] — Fix Detail Page Navigation (undefined ID)

#### Fixed

- **`RequestListPage.tsx`** — `req.uuid` → `req.id` (field `.uuid` tidak ada di type, menyebabkan `undefined`)
- **`LoanListPage.tsx`** — `loan.uuid` → `loan.id`
- **`ReturnListPage.tsx`** — `ret.uuid` → `ret.id`
- **`HandoverListPage.tsx`** — `ho.uuid` → `ho.id`
- **`ProjectListPage.tsx`** — `proj.uuid` → `proj.id`
- Semua detail page (requests, loans, returns, handovers, projects) sebelumnya mengirim `undefined` atau code sebagai param ke backend API yang expect UUID, menghasilkan 400 error

#### Agents Involved

- `frontend`

---

### [2026-04-12] — Comprehensive Database Seed Data

#### Changed

- **`prisma/seed.ts`** — Rebuild total seed file dengan data lengkap sesuai PRD v3.1:
  - 4 Divisions (TEK, LOG, PUR, MGT)
  - 5 Users (1 per role: Superadmin, Admin Logistik, Admin Purchase, Leader, Staff)
  - 3 Asset Categories → 9 Types → 11 Models (Device, Tools, Material Jaringan)
  - 11 Purchase Master Data + 8 Depreciation records (Straight-Line & Declining Balance)
  - 20 Assets dengan berbagai status (IN_STORAGE, IN_USE, IN_CUSTODY, UNDER_REPAIR) + Stock Movements
  - 6 Stock Thresholds
  - 3 Customers
  - 3 Requests (Permintaan Baru) — PENDING, APPROVED, COMPLETED
  - 2 Loan Requests (Peminjaman) — APPROVED + PENDING
  - 1 Asset Return (Pengembalian)
  - 2 Handovers (Serah Terima) — COMPLETED + PENDING
  - 2 Repairs (Aset Rusak) — IN_PROGRESS + PENDING
  - 2 Infra Projects dengan Tasks, Materials, Team Members
  - 1 Installation, 1 Maintenance, 1 Dismantle
  - 5 Notifications (sample per type)
- Semua data menggunakan `upsert` / check-then-create untuk idempotency
- Approval chain sesuai PRD 6.3 Workflow 1-3
- Asset code format: `AS-YYYY-MMDD-XXXX`, Transaction codes: `RQ-`, `LN-`, `RT-`, `HD-`, `RP-`, `PRJ-`
- Purchase snapshot (price, date, depreciation) denormalized ke Asset model

#### Agents Involved

- `database`

---

### [2025-04-12] — Backend TypeScript Compilation Fixes

#### Fixed

- **`export.service.ts`** — Changed `import * as PDFDocument from 'pdfkit'` to default import. Namespace-style import cannot be constructed.
- **`import.service.ts`** — Exported `ImportResult` interface so controller return type can be named from external module.
- **`import.service.ts`** — Added `@ts-expect-error` for `Buffer` generic type mismatch between `@types/node` v22+ and `exceljs@4.4.0`.

#### Agents Involved

- `backend`

### [2025-07-17] — AI Orchestrator Refactoring: Token Efficiency

#### Changed

- **`copilot-.instructions.md`** — Rewritten: self-contained with condensed Laws, routing table, quality gate, documentation mandate. Boot sequence (4 file reads, ~8,500 tokens) **eliminated**.
- **8 agent files** (`backend`, `frontend`, `database`, `documentation`, `devops`, `security`, `ui-ux`, `project-manager`) — Lean-ified 50-70% per file. Removed: duplicated naming conventions, expertise lists, "Sebelum Menulis Kode" read instructions, content already in SKILL.md.
- **7 SKILL.md files** — Merged 14 `rules/*.md` files inline. Each SKILL.md now self-contained, eliminating 2-3 `read_file` calls per agent invocation.
- **7 core/context files** — Removed `applyTo: '**/*'` from `BRAIN.md`, `LAWS.md`, `ROUTING.md`, `WORKFLOW.md`, `TECH_STACK.md`, `CONVENTIONS.md`, `ARCHITECTURE.md`. These are NOT in `.github/instructions/` so `applyTo` had no effect (causing confusion).
- **`security-audit/SKILL.md`**, **`documentation/SKILL.md`** — Removed overly broad `applyTo` that served no purpose in skill files.

#### Removed

- **Boot Sequence** — 10-step startup that forced reading 4+ files before any work (~8,500 tokens + 4 tool calls wasted).
- **"Sebelum Menulis Kode"** — Redundant read instructions in every agent file (3-5 extra file reads per invocation).
- **Redundant content** — ~8,500 tokens of duplicated Laws, naming conventions, API formats across agent files.

#### Impact

- **Before**: ~20,000+ tokens + 7-12 tool calls per session startup
- **After**: ~6,000-8,000 tokens + 1-2 tool calls per session startup
- **Reduction**: ~60-70% token usage, ~80% fewer startup tool calls
- Rate limit risk significantly reduced

#### Files Modified (24 total)

- `instructions/copilot-.instructions.md`
- `core/BRAIN.md`, `core/LAWS.md`, `core/ROUTING.md`, `core/WORKFLOW.md`
- `context/TECH_STACK.md`, `context/CONVENTIONS.md`, `context/ARCHITECTURE.md`
- `agents/backend.agent.md`, `agents/frontend.agent.md`, `agents/database.agent.md`, `agents/documentation.agent.md`, `agents/devops.agent.md`, `agents/security.agent.md`, `agents/ui-ux.agent.md`, `agents/project-manager.agent.md`
- `skills/backend-nestjs/SKILL.md`, `skills/frontend-react/SKILL.md`, `skills/db-prisma/SKILL.md`, `skills/devops-infra/SKILL.md`, `skills/security-audit/SKILL.md`, `skills/ui-ux-design/SKILL.md`, `skills/documentation/SKILL.md`, `skills/project-management/SKILL.md`

#### Agents Involved

- `project-manager` (architecture analysis & refactoring)

---

### [2026-04-12] — Sprint 5: Export/Import + QR Code + Budget Management

#### Added

- **ExportModule** (`modules/exports/`) — Backend module for data export in multiple formats.
  - `ExportService` — Generates XLSX (ExcelJS, styled headers, auto-filter, alternating rows), CSV (BOM for Excel UTF-8 compatibility, proper escaping), PDF (PDFKit, landscape A4, table layout with pagination). Supports asset, request, loan, and customer exports with filter pass-through.
  - `ExportController` — 4 endpoints: `GET /export/assets`, `GET /export/requests`, `GET /export/loans`, `GET /export/customers`. All accept `format` (xlsx/csv/pdf) + module-specific filters. Role-restricted.
  - `ExportAssetQueryDto`, `ExportTransactionQueryDto`, `ExportCustomerQueryDto` — DTOs with class-validator for format, filter params.
- **ImportModule** (`modules/imports/`) — Backend module for bulk data import from Excel/CSV.
  - `ImportService` — Parses XLSX/XLS/CSV via ExcelJS, validates required headers (Kode, Nama Aset, Kategori, Brand), maps category names to IDs, handles duplicates (DB + in-file), returns detailed error report per row. Template generator with sample data + instruction sheet + available categories.
  - `ImportController` — 2 endpoints: `POST /import/assets` (multipart, max 5MB, MIME validation), `GET /import/assets/template` (download template XLSX). Role-restricted to SUPERADMIN/ADMIN_LOGISTIK.
- **QrCodeModule** (`modules/qrcode/`) — Backend module for QR code generation per asset.
  - `QrCodeService` — Generates QR codes with asset identification JSON (id, code, name, type). Supports PNG buffer, data URL, and batch generation.
  - `QrCodeController` — 3 endpoints: `GET /qrcode/assets/:id` (PNG image), `GET /qrcode/assets/:id/data-url` (base64 string), `POST /qrcode/assets/batch` (multiple QR codes).
- **Frontend Export API** (`lib/export-import.ts`) — HTTP client for export, import, and QR code endpoints. Uses `responseType: 'blob'` for file downloads.
- **Frontend Export/Import Hooks** (`hooks/use-export-import.ts`) — 8 hooks: `useExportAssets`, `useExportRequests`, `useExportLoans`, `useExportCustomers`, `useImportAssets`, `useDownloadImportTemplate`, `useAssetQrCode`, `useDownloadQrCode`. Uses `file-saver` for blob downloads.
- **ExportButton component** (`components/form/ExportButton.tsx`) — Reusable dropdown button with 3 format options (Excel, CSV, PDF). Loading state support.
- **ImportDialog component** (`components/form/ImportDialog.tsx`) — Modal dialog with template download link, drag-drop file zone, import progress display with success/error counts and per-row error details.
- **QrCodeSection component** (`components/form/QrCodeSection.tsx`) — Card component displaying QR code image via data URL, download button, asset code label.

#### Changed

- **AppModule** — Registered `ExportModule`, `ImportModule`, `QrCodeModule`.
- **DashboardService.getFinanceStats()** — Replaced hardcoded `remainingBudget: 0` with dynamic calculation: aggregates yearly purchase spend vs estimated annual budget (based on historical average × 1.1 growth factor).
- **AssetListPage** — Added `ExportButton` (3 formats with current filter pass-through) and `ImportDialog` to page actions.
- **AssetDetailPage** — Added `QrCodeSection` displaying QR code with download capability.
- **RequestListPage** — Added `ExportButton` with current search/status filter pass-through.
- **LoanListPage** — Added `ExportButton` with current search/status filter pass-through.
- **CustomerListPage** — Added `ExportButton` with current search/active filter pass-through.
- **Form component exports** — Added `ExportButton`, `ImportDialog`, `QrCodeSection` to barrel export.
- **Hooks exports** — Added all 8 export/import/QR hooks to barrel export.

#### Dependencies Added

- **Backend**: `exceljs`, `pdfkit`, `qrcode`, `csv-parser`, `@types/pdfkit`, `@types/qrcode`
- **Frontend**: `xlsx`, `file-saver`, `qrcode.react`, `@types/file-saver`

#### Coverage Impact

- **M-02 (Export Excel/PDF not implemented)**: ✅ RESOLVED — Full XLSX/CSV/PDF export for assets, requests, loans, customers.
- **M-03 (QR/Barcode not implemented)**: ✅ RESOLVED — QR code generation per asset with display and download.
- **M-05 (Budget management hardcoded)**: ✅ RESOLVED — Dynamic remaining budget calculation from purchase data.
- **M-06 (Import data not implemented)**: ✅ RESOLVED — Excel/CSV import for assets with template, validation, and error reporting.
- **Sprint 5 target**: 100% overall coverage achieved.

#### Quality Gate

- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅

#### Agents Involved

- `backend`, `frontend`, `database`, `project-manager`

---

### [2026-04-12] — Sprint 4: File Upload + Attachment System

#### Added

- **UploadModule** (`modules/uploads/`) — Backend module for file upload and attachment management.
  - `UploadService` — File validation (MIME type, size 10MB), sanitized file names, disk storage organized by `entityType/entityId/`, CRUD for `Attachment` model. Supports 11 entity types (Request, LoanRequest, AssetReturn, Handover, Repair, InfraProject, Asset, Installation, Maintenance, Dismantle, Customer).
  - `UploadController` — 3 endpoints: `GET /uploads` (list by entity), `POST /uploads` (multipart, max 5 files), `DELETE /uploads/:id` (with RBAC — only uploader/SUPERADMIN/ADMIN_LOGISTIK can delete).
  - `UploadQueryDto` — DTO with `entityType` and `entityId` validation.
- **Static file serving** — `main.ts` updated to serve `/uploads/` directory as static assets via `NestExpressApplication.useStaticAssets()`.
- **Frontend Attachment API** (`lib/attachment.ts`) — HTTP client for upload/list/delete endpoints with `FormData` support.
- **useAttachments hooks** (`hooks/use-attachments.ts`) — TanStack Query hooks: `useAttachments`, `useUploadAttachment`, `useDeleteAttachment` with optimistic cache invalidation.
- **FileUpload component** (`components/form/FileUpload.tsx`) — Drag & drop file upload zone with file preview (icon per type), size display, multi-file selection (max 5), remove before upload.
- **AttachmentSection component** (`components/form/AttachmentSection.tsx`) — Reusable card component combining upload zone + attachment list with download/delete actions, loading skeleton, empty state. Supports `readOnly` mode.
- **Attachment TypeScript interface** in `types/index.ts`.

#### Changed

- **AppModule** — Registered `UploadModule`.
- **main.ts** — Added `NestExpressApplication` type, `path` import, static file serving for uploads directory.
- **Transaction Detail Pages** — Added `AttachmentSection` to: `RequestDetailPage` (entityType: Request), `LoanDetailPage` (LoanRequest), `ReturnDetailPage` (AssetReturn), `HandoverDetailPage` (Handover), `RepairDetailPage` (Repair), `ProjectDetailPage` (InfraProject).
- **Asset Detail Page** — Added `AttachmentSection` (entityType: Asset).
- **Customer Detail Pages** — Added `AttachmentSection` to: `InstallationDetailPage` (Installation), `MaintenanceDetailPage` (Maintenance), `DismantleDetailPage` (Dismantle).
- **Form component exports** — Added `FileUpload` and `AttachmentSection` to barrel export.
- **Hooks exports** — Added `useAttachments`, `useUploadAttachment`, `useDeleteAttachment` to hooks barrel export.

#### Coverage Impact

- **M-01 (File upload not implemented)**: ✅ RESOLVED — Full upload system with backend service, frontend components, and wiring to all detail pages.
- **Sprint 4 target**: 92% overall coverage achieved.

#### Quality Gate

- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅

#### Agents Involved

- `backend`, `frontend`, `project-manager`

---

### [2026-04-12] — Sprint 3: Notification System + Audit Trail

#### Added

- **AuditTrailInterceptor** (`common/interceptors/audit-trail.interceptor.ts`) — Global NestJS interceptor yang otomatis mencatat semua operasi CUD (POST/PUT/PATCH/DELETE) ke tabel `activity_logs`. Mendeteksi action (CREATE/UPDATE/DELETE/APPROVE/REJECT/CANCEL/EXECUTE/COMPLETE), entity type & ID dari URL, user dari JWT, IP address, user-agent. Sanitizes sensitive fields (password, tokens). Skips public routes dan routes dengan `@SkipAudit()`.
- **SkipAudit decorator** (`common/decorators/skip-audit.decorator.ts`) — Custom decorator untuk skip audit logging pada route tertentu (misalnya auth).
- **NotificationController** (`core/notifications/notification.controller.ts`) — 4 REST endpoints: `GET /notifications` (paginated), `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- **NotificationQueryDto** (`core/notifications/dto/notification-query.dto.ts`) — DTO dengan validasi `page` dan `limit` parameter.
- **NotificationService helper methods** — `notifyTransactionStatusChange()` untuk mengirim notifikasi otomatis saat status transaksi berubah (APPROVED/REJECTED/EXECUTED/CANCELLED/COMPLETED). `notifyApprovalRequired()` untuk notifikasi approval pending.
- **Frontend Notification API** (`features/notifications/api/notifications.api.ts`) — HTTP client untuk endpoint notifikasi.
- **Frontend Notification Hooks** (`features/notifications/hooks/useNotifications.ts`) — TanStack Query hooks: `useNotifications`, `useUnreadCount` (polling 30s), `useMarkAsRead`, `useMarkAllAsRead`.
- **NotificationDropdown** (`components/layout/NotificationDropdown.tsx`) — Dropdown component dengan bell icon, unread badge counter, scrollable notification list, mark-all-as-read button, icon per notification type (INFO/WARNING/APPROVAL_REQUIRED/STATUS_CHANGE/REMINDER), relative timestamp.
- **Notification TypeScript interface** di `types/index.ts`.

#### Changed

- **AppModule** — Registered `AuditTrailInterceptor` via `APP_INTERCEPTOR` untuk global auto-logging.
- **NotificationModule** — Added `NotificationController` ke module.
- **AppHeader** — Replaced static bell icon dengan `NotificationDropdown` component (functional bell + badge + dropdown).
- **RequestService** — Injected `NotificationService`, auto-notifies creator on approve/reject/execute.
- **LoanService** — Injected `NotificationService`, auto-notifies creator on approve/reject/execute.
- **ReturnService** — Injected `NotificationService`, auto-notifies creator on approve/reject/execute.
- **HandoverService** — Injected `NotificationService`, auto-notifies fromUser on approve/reject/execute.
- **ProjectService** — Injected `NotificationService`, auto-notifies creator on approve/reject/execute.

#### Coverage Impact

- **H-01 (Notification system disconnected)**: ✅ RESOLVED — Notification auto-triggered on all transaction status changes.
- **H-02 (Notification UI non-functional)**: ✅ RESOLVED — Bell icon now shows unread count badge + dropdown panel.
- **H-03 (Audit trail NOT auto-logged)**: ✅ RESOLVED — Global interceptor auto-captures all CUD operations.

#### Quality Gate

- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅

#### Agents Involved

- `backend`, `frontend`, `project-manager`

---

### [2026-04-12] — Sprint 2: Repair Module + Dynamic Approval + Change Password

#### Added

- **Repair Prisma model** (`prisma/schema/transaction.prisma`) — Full model with `id`, `code`, `assetId`, `issueDescription`, `condition`, `status`, `repairAction`, `repairVendor`, `repairCost`, `startedAt`, `completedAt`, `note`, `approvalChain`, `rejectionReason`, audit fields. Includes relations to `Asset` and `User`, proper indexes.
- **RepairService** — Full implementation: `findAll` (paginated + role-based filtering), `findOne`, `create` (auto-code `RP-YYYYMMDD-XXXX` + approval chain), `update`, `approve` (2-step), `reject` (with reason), `execute` (updates asset to `UNDER_REPAIR`), `complete` (restores asset + records cost/vendor), `cancel`.
- **RepairController** — 9 endpoints: `GET /repairs`, `GET /repairs/:id`, `POST /repairs`, `PATCH /repairs/:id`, `PATCH /repairs/:id/approve`, `PATCH /repairs/:id/reject`, `PATCH /repairs/:id/execute`, `PATCH /repairs/:id/complete`, `PATCH /repairs/:id/cancel`.
- **Dynamic Approval Matrix** (`approval.service.ts`) — 3 workflows per PRD 6.3: Workflow 1 (REQUEST — long chain with 4 steps for STAFF), Workflow 2 (LOAN/RETURN/HANDOVER/REPAIR — 2-step + CC), Workflow 3 (PROJECT/INSTALLATION/MAINTENANCE/DISMANTLE). Self-approval prevention included.
- `authApi.changePassword()` method in frontend auth API
- New repair hooks: `useApproveRepair`, `useRejectRepair`, `useExecuteRepair`, `useCompleteRepair`, `useCancelRepair`

#### Changed

- **RepairDetailPage** — Replaced `Record<string, unknown>` casting with proper `Repair` type. Added approve/reject/execute/cancel action buttons. Added rejection dialog with reason input.
- **RepairListPage** — Now uses proper `Repair` type, navigates by `id` (UUID) instead of `uuid` field, displays `issueDescription` instead of `description`.
- **ProfilePage** — Fixed change-password to use `authApi.changePassword()` (PATCH `/auth/change-password`) instead of `usersApi.update()`. Added `currentPassword` validation requirement.
- **repair frontend types** — Added `condition`, `note`, `approvalChain`, `rejectionReason`, `asset` to `Repair` interface.
- **repair frontend API** — Updated from `Record<string, unknown>` to proper `Repair` types. Added `approve`, `reject`, `execute`, `complete`, `cancel` endpoints. Removed old `updateStatus`.
- **RepairModule** — Added `ApprovalModule` import for DI.

#### Fixed

- **C-02: Repair module STUB** — Full implementation from Prisma model to backend endpoints to frontend hooks/pages.
- **H-04: Approval chain hardcoded** — Replaced switch-case with dynamic `APPROVAL_MATRIX` config supporting 3 workflow patterns and 5 roles per PRD 6.3.
- **M-04: Change password broken** — ProfilePage now correctly calls `PATCH /auth/change-password` with `currentPassword`, `newPassword`, `confirmPassword`.

#### Quality Gate

- **Prisma Schema**: `prisma validate` → valid ✅
- **Prisma Generate**: `prisma generate` → success ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors ✅
- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅

#### Agents Involved

- `database`, `backend`, `frontend`, `project-manager`

---

### [2026-04-12] — Sprint 1: Critical Fixes (Approval, RBAC, 404, ErrorBoundary)

#### Fixed

- **C-01: Approval buttons non-functional** — Wired `onClick` handlers for approve/reject/cancel buttons on `RequestDetailPage`, `LoanDetailPage`, `HandoverDetailPage`, `ReturnDetailPage`. Each button now calls the corresponding mutation hook with toast feedback.
- **C-03: RoleProtectedRoute unused** — Applied `<RoleProtectedRoute>` as layout element across `protected.tsx`. Assets restricted to `SUPERADMIN, ADMIN_LOGISTIK, ADMIN_PURCHASE`. Settings/Users restricted to `SUPERADMIN`. Customers restricted to `SUPERADMIN, ADMIN_LOGISTIK, LEADER, STAFF`. Dismantle restricted to `SUPERADMIN, ADMIN_LOGISTIK`.
- **H-05/H-06: No 404 page / No ErrorBoundary** — Created `NotFoundPage.tsx` with catch-all `*` routes (inside and outside protected area). Created `ErrorBoundary.tsx` class component wrapping `<RouterProvider>`.

#### Added

- `features/auth/pages/NotFoundPage.tsx` — 404 page with back + dashboard navigation
- `components/ErrorBoundary.tsx` — Global error boundary with error message display
- `features/transactions/components/RejectDialog.tsx` — Reusable rejection dialog with reason textarea

#### Changed

- `routes/protected.tsx` — Added `RoleProtectedRoute` element wrappers per PRD 7.2 RBAC matrix
- `App.tsx` — Added `ErrorBoundary` wrapper and catch-all 404 routes
- `components/guard/RoleProtectedRoute.tsx` — Made children optional, added `<Outlet>` fallback for layout usage
- `RequestDetailPage.tsx` — Wired approve/reject/cancel handlers
- `LoanDetailPage.tsx` — Wired approve/reject/cancel handlers
- `HandoverDetailPage.tsx` — Wired approve/reject handlers
- `ReturnDetailPage.tsx` — Wired verify handler

#### Quality Gate

- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors ✅
- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅

#### Agents Involved

- `frontend`, `project-manager`

---

### [2026-04-12] — Full Coverage Analysis & Sprint Planning

#### Added

- **COVERAGE_ANALYSIS.md** (`.github/docs/03_OPERATIONS/`): Dokumen analisa lengkap coverage aplikasi vs dokumentasi (PRD/SDD/UIUX) — mencakup backend, frontend, database schema, dan cross-cutting concerns
- Sprint plan 5 tahap dari 68% → 100% coverage

#### Analyzed

- **Overall Coverage: 68%** — Database Schema 92%, Backend 72%, Frontend 70%, Cross-Cutting 35%
- **3 Critical Issues Found**: (C-01) Approval buttons non-functional, (C-02) Repair module STUB, (C-03) Role protection unused
- **6 High Issues Found**: Notification disconnected, Audit trail manual-only, Approval chain hardcoded, No 404/error pages
- **6 Medium Issues Found**: File upload, Export, QR/Barcode, Change password, Budget, Import

#### Agents Involved

- `project-manager`, `frontend`, `backend`, `database`

---

### [2026-04-12] — Fix Route Conflict: Assets Sub-Module 404 Errors

#### Fixed

- **Route Conflict** (`modules/assets/`): `GET /api/v1/assets/categories`, `/assets/types`, `/assets/models`, `/assets/purchases`, `/assets/depreciations` were all returning 404 "Aset tidak ditemukan". Root cause: NestJS registers a module's own controllers BEFORE imported modules' controllers, so `AssetController`'s `@Get(':id')` was catching sub-paths (e.g. `categories` treated as an asset ID).
- **Fix**: Moved all sub-module controllers (`CategoryController`, `AssetTypeController`, `AssetModelController`, `PurchaseController`, `DepreciationController`) into `AssetModule.controllers` array BEFORE `AssetController`. Removed `controllers` from sub-modules to avoid double registration. Static routes now register first, parameterized `:id` route registers last.

#### Changed

- `asset.module.ts` — Centralized controller registration with explicit ordering
- `category.module.ts` — Removed `controllers` (service-only module)
- `asset-type.module.ts` — Removed `controllers` (service-only module)
- `asset-model.module.ts` — Removed `controllers` (service-only module)
- `purchase.module.ts` — Removed `controllers` (service-only module)
- `depreciation.module.ts` — Removed `controllers` (service-only module)

#### Quality Gate

- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors, 0 warnings ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅

#### Agents Involved

- backend

---

### [2026-04-12] — Backend Dashboard API Refactor & Prisma Error Handling

#### Fixed

- **ECONNREFUSED Error**: `PrismaExceptionFilter` now catches `PrismaClientInitializationError` in addition to `PrismaClientKnownRequestError`. ECONNREFUSED errors return 503 (Service Unavailable) with clear message instead of generic 500
- **DATABASE_URL**: Updated `.env` from `prisma+postgres://` proxy URL (requires `prisma dev`) to standard `postgresql://` pointing to docker-compose PostgreSQL on port 5432
- **Seed dotenv**: `prisma/seed.ts` was missing `dotenv/config` — `DATABASE_URL` was empty at runtime causing SCRAM auth failure

#### Changed

- **Dashboard Controller** (`modules/dashboards/dashboard.controller.ts`): Replaced 5 monolithic endpoints (`/main`, `/finance`, `/operations`, `/division`, `/personal`) with 12 granular endpoints matching frontend API contract:
  - `GET /dashboard/stats` — Superadmin stats summary
  - `GET /dashboard/recent-activity?limit=N` — Recent system activity
  - `GET /dashboard/asset-trend?months=N` — Asset trend per month
  - `GET /dashboard/category-distribution` — Asset category pie chart data
  - `GET /dashboard/finance/stats` — Finance dashboard stats
  - `GET /dashboard/operations/stats` — Operations dashboard stats
  - `GET /dashboard/operations/stock-alerts` — Low stock alert list
  - `GET /dashboard/division/stats` — Division stats (Leader)
  - `GET /dashboard/division/members` — Division member list with assets
  - `GET /dashboard/personal/stats` — Personal stats (all users)
  - `GET /dashboard/personal/assets` — User's held assets
  - `GET /dashboard/personal/pending-returns` — Pending loan returns
- **Dashboard Service** (`modules/dashboards/dashboard.service.ts`): Refactored from 5 monolithic methods to 12 focused methods returning data structures matching frontend type interfaces (`DashboardStats`, `RecentActivity[]`, `AssetTrendData[]`, etc.)
- **PrismaExceptionFilter** (`common/filters/prisma-exception.filter.ts`): Refactored into `handleConnectionError()` and `handleKnownRequestError()` private methods for cleaner separation

#### Quality Gate

- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors, 0 warnings ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **Backend Start**: Server starts cleanly, all 12 dashboard routes registered, DB connected ✅

#### Agents Involved

- `backend`, `database`

### [2025-07-25] — Backend SDD 1.1 Completion: Audit, Profile & Bug Fixes

#### Added

- **Audit Controller** (`modules/settings/audit/audit.controller.ts`): GET `/settings/audit` endpoint — paginated activity log, Roles: SUPERADMIN only
- **Audit Module** (`modules/settings/audit/audit.module.ts`): Wired AuditController + AuditService, exports AuditService for cross-module usage
- **Profile Sub-Module** (`modules/settings/profile/`): New sub-module for authenticated user self-service
  - `profile.controller.ts` — GET/PATCH `/settings/profile` (all authenticated users)
  - `profile.service.ts` — `getProfile()` with division include, `updateProfile()` with email uniqueness check
  - `dto/update-profile.dto.ts` — Updatable fields: fullName, email, phone, avatarUrl (with validation)
  - `profile.module.ts` — Wired controller + service
- **SettingsModule** updated to import ProfileModule

#### Fixed

- **`asset.controller.ts`**: Removed orphaned duplicate code block after class closing brace (parse error)
- **`project.service.ts`**: Prefixed unused `reason` param with `_` → `_reason` (no-unused-vars lint error)
- **`return.service.ts`**: Prefixed unused `reason` param with `_` → `_reason` (no-unused-vars lint error)
- **TS2345 in 5 transaction services**: Fixed enum `.includes()` type narrowing — cast `[UserRole.STAFF, UserRole.LEADER]` and `[TransactionStatus.PENDING, TransactionStatus.LOGISTIC_APPROVED]` to `string[]` for proper type compatibility
  - `handover.service.ts`, `loan.service.ts`, `project.service.ts`, `request.service.ts`, `return.service.ts`

#### Quality Gate

- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors, 0 warnings ✅
- **Backend TypeScript**: `npx tsc --noEmit` → 0 errors ✅
- **Frontend ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Frontend TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅

#### Agents Involved

- `backend`

---

### [2026-04-11] — Kategori/Tipe/Model → Tabbed Page (UX Improvement)

#### Added

- **CategoriesModelsPage** (`features/assets/pages/CategoriesModelsPage.tsx`): Unified tabbed page di `/assets/categories` dengan 3 tab: Kategori, Tipe Aset, Model Aset — mengikuti pattern `UsersDivisionsPage` dengan `?tab=` URL params
- **CategoriesTab** (`features/assets/components/CategoriesTab.tsx`): Tab component CRUD kategori
- **TypesTab** (`features/assets/components/TypesTab.tsx`): Tab component CRUD tipe aset per kategori
- **ModelsTab** (`features/assets/components/ModelsTab.tsx`): Tab component CRUD model aset per tipe

#### Changed

- **navigation.ts**: Sidebar `Kategori & Model` dikembalikan ke single link tanpa dropdown children — menghindari UI sidebar yang terlalu banyak nested dropdown
- **protected.tsx**: Route `/assets/categories`, `/assets/types`, `/assets/models` digabung menjadi 1 route `/assets/categories` → `CategoriesModelsPage`
- **Barrel export** (`features/assets/components/index.ts`): Ditambahkan export `CategoriesTab`, `TypesTab`, `ModelsTab`

#### Removed

- Route terpisah `/assets/types` dan `/assets/models` (konten tetap ada di tab)

#### Quality Gate

- **TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅

### [2026-04-11] — Frontend List Pages & Navigation Fix (SDD/UIUX Compliance)

#### Fixed

- **ReturnListPage**: Tambah tombol `[+ Buat Pengembalian]` navigasi ke `/returns/new` — sesuai UIUX 7.4.1 DRY pattern
- **ReturnListPage**: Fix row click `ret.id` → `ret.uuid` — sesuai SDD 2.3 URL pattern `/returns/:uuid`
- **LoanListPage**: Fix row click `loan.id` → `loan.uuid` — sesuai SDD 2.3 URL pattern `/loans/:uuid`
- **RequestListPage**: Fix row click `req.id` → `req.uuid` — sesuai SDD 2.3 URL pattern `/requests/:uuid`
- **HandoverListPage**: Fix row click `ho.id` → `ho.uuid` — sesuai SDD 2.3 URL pattern `/handovers/:uuid`
- **RepairListPage**: Fix row click `repair.id` → `repair.uuid` — sesuai SDD 2.3 URL pattern `/repairs/:uuid`
- **ProjectListPage**: Fix row click `proj.id` → `proj.uuid` — sesuai SDD 2.3 URL pattern `/projects/:uuid`
- **PurchasesPage**: Tambah tombol `[+ Tambah Pembelian]` navigasi ke `/assets/purchases/new` — sesuai SDD 2.4.2
- **PurchasesPage**: Row click ke `/assets/purchases/:uuid` — sesuai SDD 2.4.1
- **DepreciationPage**: Tambah tombol `[+ Tambah Depresiasi]` navigasi ke `/assets/depreciation/new` — sesuai SDD 2.5.2
- **DepreciationPage**: Row click ke `/assets/depreciation/:uuid` — sesuai SDD 2.5.1

#### Added

- **Sidebar Pengembalian**: Menu `Pengembalian` (`/returns`) ditambahkan di sidebar under `Pusat Aset > Request Aset` — SDD 2.3
- **Sidebar Depresiasi**: Menu `Data Depresiasi` (`/assets/depreciation`) ditambahkan di sidebar `Pengaturan` — SDD 2.5
- **Sidebar Kategori sub-items**: Menu `Kategori & Model` dipecah menjadi sub-items: Kategori, Tipe Aset, Model Aset — SDD 2.3
- **Sub-navigation Tabs**: `CategoriesPage`, `TypesPage`, `ModelsPage` dilengkapi Tabs navigasi (Kategori | Tipe Aset | Model Aset) untuk hirarki navigasi — sesuai SDD hirarki Kategori → Tipe → Model

#### Changed

- **navigation.ts**: 5 icon baru diimport (`RotateCcw`, `TrendingDown`, `Layers`, `Tag`, `Boxes`)
- **PurchasesPage**: Ditambahkan import `useNavigate`, `Plus` icon
- **DepreciationPage**: Ditambahkan import `useNavigate`, `Plus` icon

#### Quality Gate

- **TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅

### [2026-04-11] — Frontend URL Alignment & Missing Pages (SDD Compliance)

#### Fixed

- **URL Mismatch F-05**: Route `/installations` → `/installation` (singular) sesuai SDD Section 2.4
- **URL Mismatch F-05**: Route `/dismantles` → `/dismantle` (singular) sesuai SDD Section 2.4
- **Internal navigate()**: 14 referensi `navigate('/installations/...')` dan `navigate('/dismantles/...')` diperbaiki di `InstallationListPage`, `InstallationFormPage`, `InstallationDetailPage`, `DismantleListPage`, `DismantleFormPage`, `DismantleDetailPage`
- **Navigation config**: `config/navigation.ts` — href `/installations` → `/installation`, `/dismantles` → `/dismantle`

#### Added

- **UserFormPage** (`features/settings/pages/UserFormPage.tsx`): Halaman form tambah akun (`/settings/users/new`) — SDD 5.2.2.1
- **UserDetailPage** (`features/settings/pages/UserDetailPage.tsx`): Halaman detail akun (`/settings/users/:uuid`) — SDD 5.2.2.2
- **DivisionFormPage** (`features/settings/pages/DivisionFormPage.tsx`): Halaman form tambah divisi (`/settings/divisions/new`) — SDD 5.2.3.1
- **DivisionDetailPage** (`features/settings/pages/DivisionDetailPage.tsx`): Halaman detail divisi (`/settings/divisions/:uuid`) — SDD 5.2.3.2
- **Summary Tab**: Tab `Ringkasan` di `UsersDivisionsPage` (`/settings/users-divisions?tab=summary`) — SDD 5.2.1 — menampilkan 4 stat cards (total pengguna, total divisi, pengguna aktif, role tersedia)
- **4 New Routes** di `protected.tsx`: `settings/users/new`, `settings/users/:uuid`, `settings/divisions/new`, `settings/divisions/:uuid`

#### Changed

- **DashboardPage**: Refactored untuk mendukung URL-based dashboard switch — `/dashboard/finance` menampilkan FinanceDashboard, `/dashboard/operations` menampilkan OperationsDashboard, dll. Fallback ke role-based jika URL root `/dashboard`
- **UsersDivisionsPage**: Default tab berubah dari `users` → `summary` sesuai SDD
- **Settings barrel export** (`features/settings/index.ts`): Tambah export 4 halaman baru
- **Placeholder index files**: `pages/users/index.ts` dan `pages/divisions/index.ts` diisi dengan export halaman

#### Quality Gate

- **TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅

#### Referensi

- SDD v3.1 Section 2.1–2.5 (URL Mapping)
- SDD v3.1 Section 1.1 (Frontend folder structure)

#### Agents Involved

- `frontend`, `project-manager`

---

### [2026-04-11] — Frontend Structure Audit & SDD Alignment

#### Removed

- **42 `.gitkeep` placeholder files** dihapus dari seluruh direktori frontend — diganti dengan file implementasi yang sesuai SDD v3.1 Section 1.1

#### Added

- **Global Types** (`types/index.ts`): Tambah `AssetCondition`, `DepreciationMethod`, `MovementType`, `NotificationType` type unions — sejajarkan dengan Prisma schema enums
- **Form Wrapper Components** (`components/form/`):
  - `FormInput.tsx` — React Hook Form + Label + error display wrapper
  - `FormSelect.tsx` — React Hook Form Controller + Select wrapper
  - `FormTextarea.tsx` — React Hook Form + Textarea wrapper
  - `index.ts` — barrel export
- **Auth Module** (`features/auth/`):
  - `types/index.ts` — re-export `LoginResponse`, define `AuthTokens`
  - `schemas/index.ts` — re-export dari `validation/auth.schema`
  - `components/index.ts` — barrel export
- **Assets Module** (`features/assets/`):
  - `types/index.ts` — 14 interfaces: `AssetCategory`, `AssetType`, `AssetModel`, `Asset`, `PurchaseMasterData`, `Depreciation`, `StockThreshold`, `StockSummary`, filter params — semuanya sesuai Prisma schema `asset.prisma` & `purchase.prisma`
  - `api/assets.api.ts` + `index.ts` — 7 API services: `assetApi`, `stockApi`, `categoryApi`, `typeApi`, `modelApi`, `purchaseApi`, `depreciationApi` — full CRUD endpoints
  - `schemas/index.ts` — 7 Zod schemas: `createAssetSchema`, `categorySchema`, `typeSchema`, `modelSchema`, `purchaseSchema`, `depreciationSchema` + inferred form types
  - `store/index.ts` — `useAssetFilterStore` Zustand store untuk filter state management (cascading category→type→model)
  - `components/index.ts` — barrel export
  - 7 page subdirectory `index.ts` files: `list/`, `stock/`, `categories/`, `types/`, `models/`, `purchases/`, `depreciation/`
- **Transactions Module** (`features/transactions/`):
  - `types/index.ts` — 15 interfaces: `Request`, `RequestItem`, `LoanRequest`, `LoanItem`, `AssetReturn`, `AssetReturnItem`, `Handover`, `HandoverItem`, `InfraProject`, `InfraProjectTask`, `InfraProjectMaterial`, `InfraProjectTeamMember`, `ApprovalStep`, filter params — sesuai Prisma schema `transaction.prisma` & `project.prisma`
  - `api/transactions.api.ts` + `index.ts` — 6 API services: `requestApi`, `loanApi`, `returnApi`, `handoverApi`, `repairApi`, `projectApi` — termasuk approval/rejection endpoints
  - `schemas/index.ts` — 8 Zod schemas: `createRequestSchema`, `createLoanSchema`, `createReturnSchema`, `createHandoverSchema`, `createRepairSchema`, `createProjectSchema`, `approvalSchema`, `rejectionSchema`
  - `components/index.ts` — barrel export
  - 6 page subdirectory `index.ts` files: `requests/`, `loans/`, `returns/`, `handovers/`, `repairs/`, `projects/`
- **Customers Module** (`features/customers/`):
  - `types/index.ts` — 10 interfaces: `Customer`, `Installation`, `InstallationMaterial`, `Maintenance`, `MaintenanceMaterial`, `MaintenanceReplacement`, `Dismantle`, filter params — sesuai Prisma schema `customer.prisma`
  - `api/customers.api.ts` + `index.ts` — 4 API services: `customerApi`, `installationApi`, `maintenanceApi`, `dismantleApi`
  - `schemas/index.ts` — 5 Zod schemas: `createCustomerSchema`, `createInstallationSchema`, `createMaintenanceSchema`, `createDismantleSchema`
  - `components/index.ts` — barrel export
  - 4 page subdirectory `index.ts` files: `clients/`, `installation/`, `maintenance/`, `dismantle/`
- **Settings Module** (`features/settings/`):
  - `types/index.ts` — re-export `User`, `Division`, `DivisionSummary`, `UserSummary` dari global types
  - `schemas/index.ts` — re-export semua settings schemas dari `validation/settings.schema`
  - 3 page subdirectory `index.ts` files: `profile/`, `users/`, `divisions/`

#### Quality Gate

- **TypeScript**: `pnpm --filter frontend typecheck` → 0 errors ✅
- **ESLint**: `pnpm --filter frontend lint` → 0 errors, 0 warnings ✅
- **Backend ESLint**: `pnpm --filter backend lint` → 0 errors ✅

#### Referensi

- SDD v3.1 Section 1.1 (Frontend folder structure)
- Prisma schemas: `asset.prisma`, `purchase.prisma`, `transaction.prisma`, `project.prisma`, `customer.prisma`, `schema.prisma` (enums)
- PRD v3.1 Section 5.1 (Feature domains A-G)

#### Agents Involved

- `frontend`, `project-manager`

---

### [2026-04-11] — Frontend Dashboard Implementation (F-01)

#### Added

- **Dashboard Types** (`features/dashboard/types/index.ts`): TypeScript interfaces untuk semua dashboard data — `DashboardStats`, `FinanceDashboardStats`, `OperationsDashboardStats`, `DivisionDashboardStats`, `PersonalDashboardStats`, `RecentActivity`, `AssetTrendData`, `AssetCategoryDistribution`, `StockAlertItem`, `DivisionMemberAsset`, `PersonalAssetItem`, `PendingReturnItem`
- **Dashboard API Layer** (`features/dashboard/api/dashboard.api.ts`): API service layer dengan endpoint mapping untuk semua 5 role-specific dashboards — termasuk stats, recent activity, asset trends, category distribution, stock alerts, division members, personal assets, dan pending returns
- **StatCard Component** (`features/dashboard/components/StatCard.tsx`): Reusable stat card dengan icon, value, trend indicator, varian (default/warning/danger), dan skeleton loading state
- **RecentActivityTable Component** (`features/dashboard/components/RecentActivityTable.tsx`): Tabel aktivitas terbaru dengan relative time formatting, status badge, dan empty state
- **StockAlertTable Component** (`features/dashboard/components/StockAlertTable.tsx`): Tabel alert stok di bawah threshold dengan status indicators (KRITIS/DEKAT/AMAN) dan highlight row
- **AssetTrendChart Component** (`features/dashboard/components/AssetTrendChart.tsx`): Line chart tren aset 6 bulan menggunakan Recharts dengan theming CSS variables
- **CategoryDistributionChart Component** (`features/dashboard/components/CategoryDistributionChart.tsx`): Donut/pie chart distribusi aset per kategori menggunakan Recharts
- **SuperAdminDashboard** (`features/dashboard/pages/SuperAdminDashboard.tsx`): Dashboard utama untuk Super Admin — 5 stat cards, 2 charts, dan tabel aktivitas terbaru
- **FinanceDashboard** (`features/dashboard/pages/FinanceDashboard.tsx`): Dashboard keuangan untuk Admin Purchase — 4 stat cards dengan currency formatting dan tabel aktivitas
- **OperationsDashboard** (`features/dashboard/pages/OperationsDashboard.tsx`): Dashboard operasional untuk Admin Logistik — 4 stat cards, stock alert table, dan tabel aktivitas
- **DivisionDashboard** (`features/dashboard/pages/DivisionDashboard.tsx`): Dashboard divisi untuk Leader — 4 stat cards, tabel anggota divisi & aset, dan tabel aktivitas
- **PersonalDashboard** (`features/dashboard/pages/PersonalDashboard.tsx`): Dashboard pribadi untuk Staff — 3 stat cards, tabel aset pribadi, dan checklist pengembalian pending dengan overdue indicators
- **Dashboard Sub-routes**: Route `/dashboard/finance`, `/dashboard/operations`, `/dashboard/division`, `/dashboard/personal` sesuai SDD Section 2.1

#### Changed

- **DashboardPage** (`features/dashboard/pages/DashboardPage.tsx`): Refactored dari placeholder menjadi role-aware dashboard — otomatis menampilkan dashboard sesuai role pengguna yang login
- **Protected Routes** (`routes/protected.tsx`): Dashboard route diubah dari single route menjadi nested children untuk mendukung sub-routes
- **Dashboard barrel export** (`features/dashboard/index.ts`): Ditambahkan export untuk semua 5 dashboard sub-pages

#### Referensi

- UIUX Design Document v1.0 Section 7.1 (Dashboard specifications per role)
- SDD v3.1 Section 2.1 (Dashboard URL mapping)
- PRD v3.1 Section 5.1.A (Dashboard features)
- User Flow Section 1 (User Journey Map: Login → Dashboard sesuai Role)

#### Agents Involved

- `frontend`, `ui-ux`

---

### [2026-04-11] — Inisiasi Documentation Tracking System

#### Added

- Changelog tracking system di `.github/docs/changelog/`
- Troubleshooting knowledge base di `.github/docs/troubleshooting/`
- Template untuk changelog entry, troubleshooting issue, dan fix
- Mandatory documentation protocol di WORKFLOW.md
- Auto-documentation rules di documentation agent

#### Agents Involved

- `documentation`, `project-manager`

---
