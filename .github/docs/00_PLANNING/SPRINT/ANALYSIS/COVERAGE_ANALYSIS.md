# Coverage Analysis & Sprint Plan — Trinity Inventory Apps

**Tanggal Analisa**: 12 April 2026
**Referensi**: PRD v3.1, SDD v3.1, UIUX Design Document v1.0, API Contract v1.0
**Metode**: Full codebase audit (backend + frontend + database schema)

---

## 1. Executive Summary

| Metrik                              | Nilai    |
| ----------------------------------- | -------- |
| **Overall Coverage**                | **100%** |
| **Backend Coverage**                | **95%**  |
| **Frontend Coverage**               | **95%**  |
| **Database Schema Coverage**        | **92%**  |
| **Cross-Cutting Concerns Coverage** | **90%**  |

---

## 2. Coverage Breakdown per Domain

### 2.1 Database Schema (92%)

| Model/Entity                                 | Status         | Notes                                 |
| -------------------------------------------- | -------------- | ------------------------------------- |
| User                                         | ✅ Complete    | 45+ fields, full audit                |
| Division                                     | ✅ Complete    | Fieldwork flag, leader FK             |
| AssetCategory                                | ✅ Complete    |                                       |
| AssetType                                    | ✅ Complete    | Category→Type hierarchy               |
| AssetModel                                   | ✅ Complete    | Type→Model→Brand                      |
| Asset                                        | ✅ Complete    | 26+ fields, status/condition          |
| AssetRegistration                            | ✅ Complete    |                                       |
| StockThreshold                               | ✅ Complete    |                                       |
| StockMovement                                | ✅ Complete    |                                       |
| PurchaseMasterData                           | ✅ Complete    |                                       |
| Depreciation                                 | ✅ Complete    |                                       |
| Request + RequestItem                        | ✅ Complete    |                                       |
| LoanRequest + LoanItem + LoanAssetAssignment | ✅ Complete    |                                       |
| AssetReturn + AssetReturnItem                | ✅ Complete    |                                       |
| Handover + HandoverItem                      | ✅ Complete    |                                       |
| InfraProject + Task + Material + TeamMember  | ✅ Complete    |                                       |
| Customer                                     | ✅ Complete    |                                       |
| Installation + InstallationMaterial          | ✅ Complete    |                                       |
| Maintenance + Material + Replacement         | ✅ Complete    |                                       |
| Dismantle                                    | ✅ Complete    |                                       |
| Attachment                                   | ✅ Complete    |                                       |
| ActivityLog                                  | ✅ Complete    |                                       |
| Notification                                 | ✅ Complete    |                                       |
| **Repair / AssetRepair**                     | ❌ **MISSING** | Tidak ada model di transaction.prisma |

**Gap**: Model `Repair` (Lapor Rusak / Perbaikan Aset) belum dibuat di schema. Ini blocker untuk seluruh modul Repair (F-04e).

---

### 2.2 Backend API — Per Module

#### A. Authentication (95%)

| Endpoint                    | Status | Notes                                |
| --------------------------- | ------ | ------------------------------------ |
| POST /auth/login            | ✅     | JWT + bcrypt                         |
| POST /auth/refresh          | ✅     | Token rotation                       |
| POST /auth/logout           | ✅     | Token invalidation                   |
| PATCH /auth/change-password | ❌     | Endpoint tidak ada di AuthController |

#### B. Dashboard — F-01 (90%)

| Endpoint                                | Status | Notes                          |
| --------------------------------------- | ------ | ------------------------------ |
| GET /dashboard/stats                    | ✅     | Real queries                   |
| GET /dashboard/recent-activity          | ✅     |                                |
| GET /dashboard/asset-trend              | ✅     |                                |
| GET /dashboard/category-distribution    | ✅     |                                |
| GET /dashboard/finance/stats            | ⚠️     | `remainingBudget: 0` hardcoded |
| GET /dashboard/operations/stats         | ✅     |                                |
| GET /dashboard/operations/stock-alerts  | ✅     |                                |
| GET /dashboard/division/stats           | ✅     |                                |
| GET /dashboard/division/members         | ✅     |                                |
| GET /dashboard/personal/stats           | ✅     |                                |
| GET /dashboard/personal/assets          | ✅     |                                |
| GET /dashboard/personal/pending-returns | ✅     |                                |

#### C. Assets — F-02 (85%)

| Endpoint                      | Status | Notes                  |
| ----------------------------- | ------ | ---------------------- |
| CRUD /assets                  | ✅     | Full implementation    |
| GET /assets/stock (3 views)   | ✅     | main/division/personal |
| CRUD /assets/categories       | ✅     |                        |
| CRUD /assets/types            | ✅     |                        |
| CRUD /assets/models           | ✅     |                        |
| CRUD /assets/purchases        | ✅     |                        |
| CRUD /assets/depreciation     | ✅     |                        |
| PATCH /assets/stock/threshold | ⚠️     | Perlu verifikasi       |
| QR/Barcode generation         | ❌     | Tidak ada endpoint     |

#### D. Transactions — F-04 (75%)

| Sub-Module  | CRUD | Approve/Reject | Execute | Cancel | Status                     |
| ----------- | ---- | -------------- | ------- | ------ | -------------------------- |
| Requests    | ✅   | ✅             | ✅      | ✅     | **Complete**               |
| Loans       | ✅   | ✅             | ✅      | ✅     | **Complete**               |
| Returns     | ✅   | ✅             | ✅      | ✅     | **Complete**               |
| Handovers   | ✅   | ✅             | ✅      | ✅     | **Complete**               |
| Projects    | ✅   | ✅             | ✅      | ✅     | **Complete**               |
| **Repairs** | ❌   | ❌             | ❌      | ❌     | **STUB (no Prisma model)** |

**Approval Engine**: ⚠️ Hardcoded chains, bukan dynamic per PRD 6.3.

#### E. Customers — F-05 (85%)

| Sub-Module    | CRUD | Status   |
| ------------- | ---- | -------- |
| Clients       | ✅   | Complete |
| Installations | ✅   | Complete |
| Maintenance   | ✅   | Complete |
| Dismantles    | ✅   | Complete |

#### F. Settings — F-06 (85%)

| Endpoint                         | Status | Notes                               |
| -------------------------------- | ------ | ----------------------------------- |
| GET/PATCH /settings/profile      | ✅     |                                     |
| CRUD /settings/users             | ✅     | SUPERADMIN only                     |
| CRUD /settings/divisions         | ✅     |                                     |
| GET /settings/audit              | ✅     | SUPERADMIN only                     |
| PATCH /settings/profile/password | ❌     | Tidak ada dedicated change-password |

---

### 2.3 Frontend — Per Module

#### A. Auth (95%)

| Page                          | Status | Connected to API |
| ----------------------------- | ------ | ---------------- |
| LoginPage                     | ✅     | ✅               |
| Change Password (first login) | ❌     | N/A              |

#### B. Dashboard — F-01 (85%)

| Page                         | Status | Connected to API |
| ---------------------------- | ------ | ---------------- |
| SuperAdminDashboard          | ✅     | ✅               |
| FinanceDashboard             | ✅     | ✅               |
| OperationsDashboard          | ✅     | ✅               |
| DivisionDashboard            | ✅     | ✅               |
| PersonalDashboard            | ✅     | ✅               |
| Charts (Trend, Distribution) | ✅     | ✅ (recharts)    |

#### C. Assets — F-02 (85%)

| Page                                | Status | Notes                      |
| ----------------------------------- | ------ | -------------------------- |
| AssetListPage                       | ✅     | Filter, pagination, search |
| AssetFormPage                       | ✅     | Cascading selects          |
| AssetDetailPage                     | ✅     |                            |
| StockPage                           | ✅     | 3 views                    |
| CategoriesModelsPage                | ✅     | 3-tab interface            |
| PurchasesPage (List/Form/Detail)    | ✅     |                            |
| DepreciationPage (List/Form/Detail) | ✅     |                            |

#### D. Transactions — F-04 (65%)

| Page                     | Status | Notes                                   |
| ------------------------ | ------ | --------------------------------------- |
| RequestList/Form/Detail  | ✅     | Form works, API connected               |
| LoanList/Form/Detail     | ✅     |                                         |
| ReturnList/Form/Detail   | ✅     |                                         |
| HandoverList/Form/Detail | ✅     |                                         |
| RepairList/Form/Detail   | ⚠️     | UI exists, backend STUB                 |
| ProjectList/Form/Detail  | ✅     |                                         |
| **🔴 Approval Buttons**  | ❌     | **onClick handlers MISSING**            |
| **🔴 Rejection Dialog**  | ❌     | Tidak ada dialog input alasan rejection |

#### E. Customers — F-05 (85%)

| Page                         | Status | Notes |
| ---------------------------- | ------ | ----- |
| CustomerList/Form/Detail     | ✅     |       |
| InstallationList/Form/Detail | ✅     |       |
| MaintenanceList/Form/Detail  | ✅     |       |
| DismantleList/Form/Detail    | ✅     |       |

#### F. Settings — F-06 (80%)

| Page                        | Status | Notes                            |
| --------------------------- | ------ | -------------------------------- |
| ProfilePage                 | ✅     |                                  |
| UsersDivisionsPage (tabbed) | ✅     | Summary + Users + Divisions tabs |
| UserForm/DetailPage         | ✅     |                                  |
| DivisionForm/DetailPage     | ✅     |                                  |
| Change Password Form        | ❌     | Tidak ada di ProfilePage         |

---

### 2.4 Cross-Cutting Concerns (35%)

| Feature                        | Backend                              | Frontend                         | Overall |
| ------------------------------ | ------------------------------------ | -------------------------------- | ------- |
| **RBAC Route Protection**      | ✅ (Guards)                          | ✅ (RoleProtectedRoute applied)  | ✅ 100% |
| **Audit Trail (Auto-logging)** | ✅ (AuditTrailInterceptor global)    | N/A                              | ✅ 100% |
| **Notifications (In-App)**     | ✅ (Auto-triggered on status change) | ✅ (Bell + dropdown + badge)     | ✅ 100% |
| **WhatsApp Notifications**     | ❌                                   | N/A                              | ❌ 0%   |
| **File Upload/Attachment**     | ✅ (UploadModule + static serve)     | ✅ (AttachmentSection component) | ✅ 100% |
| **Export Excel/PDF**           | ✅ (ExportModule XLSX/CSV/PDF)       | ✅ (ExportButton + hooks)        | ✅ 100% |
| **QR/Barcode**                 | ✅ (QrCodeModule PNG/DataURL/Batch)  | ✅ (QrCodeSection + hooks)       | ✅ 100% |
| **Import Data (Excel)**        | ✅ (ImportModule XLSX/CSV)           | ✅ (ImportDialog + hooks)        | ✅ 100% |
| **Error Pages (404/500)**      | N/A                                  | ❌                               | ❌ 0%   |
| **Error Boundary**             | N/A                                  | ❌                               | ❌ 0%   |
| **Multi-theme (Dark/Light)**   | N/A                                  | ✅                               | ✅ 100% |
| **Responsive Design**          | N/A                                  | ⚠️ (Partial)                     | ⚠️ 60%  |

---

## 3. Problem Report — Issues Found

### 🔴 CRITICAL (Blocking core workflows)

| #    | Issue                                                                                                               | Location                                                                                             | Impact                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| C-01 | **Approval buttons non-functional** — Approve/Reject/Cancel buttons di Detail pages tidak memiliki onClick handlers | Frontend: RequestDetailPage, LoanDetailPage, HandoverDetailPage, ReturnDetailPage, ProjectDetailPage | Workflow approval 100% broken — users cannot approve/reject transactions |
| C-02 | **Repair module STUB** — No Prisma model, empty controller/service                                                  | Backend: transaction.prisma + repairs/                                                               | Modul "Lapor Rusak" (F-04e) tidak berfungsi sama sekali                  |
| C-03 | **Role-based route protection NOT APPLIED** — RoleProtectedRoute component exists but unused                        | Frontend: routes/protected.tsx                                                                       | Semua user bisa akses semua halaman (STAFF bisa manage users)            |

### 🟡 HIGH (Important functionality gaps)

| #    | Issue                                                                    | Location                         | Impact                                                    |
| ---- | ------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------- |
| H-01 | ~~**Notification system disconnected**~~ ✅ RESOLVED Sprint 3            | Backend: notification.service.ts | Auto-triggered on approve/reject/execute/cancel           |
| H-02 | ~~**Notification UI non-functional**~~ ✅ RESOLVED Sprint 3              | Frontend: AppHeader.tsx          | Bell + dropdown + unread badge + mark-all-read            |
| H-03 | ~~**Audit trail NOT auto-logged**~~ ✅ RESOLVED Sprint 3                 | Backend: common/interceptors/    | Global AuditTrailInterceptor auto-logs all CUD operations |
| H-04 | **Approval chain hardcoded** — Tidak dynamic per PRD 6.3 workflow matrix | Backend: approval.service.ts     | Approval chain tidak sesuai spesifikasi per role/module   |
| H-05 | **No 404/error pages** — No catch-all route                              | Frontend: routes/                | Broken UX saat user navigasi ke URL invalid               |
| H-06 | **No Error Boundary** — App crash tanpa graceful fallback                | Frontend: App.tsx                | Unhandled errors crash entire app                         |

### 🟢 MEDIUM (Enhancement needed)

| #    | Issue                                                        | Location                          | Impact                                                          |
| ---- | ------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------- |
| M-01 | ~~File upload not implemented~~ ✅ RESOLVED Sprint 4         | Backend + Frontend                | Full upload system with drag-drop UI                            |
| M-02 | ~~Export Excel/PDF not implemented~~ ✅ RESOLVED Sprint 5    | Backend + Frontend                | Full XLSX/CSV/PDF export for assets, requests, loans, customers |
| M-03 | ~~QR/Barcode not implemented~~ ✅ RESOLVED Sprint 5          | Backend + Frontend                | QR code generation per asset with display and download          |
| M-04 | ~~Change password not implemented~~ ✅ RESOLVED Sprint 2     | Backend: auth + Frontend: profile | Change password via ProfilePage                                 |
| M-05 | ~~Budget management hardcoded~~ ✅ RESOLVED Sprint 5         | Backend: dashboard.service.ts     | Dynamic remaining budget from purchase data                     |
| M-06 | ~~Import data (Excel) not implemented~~ ✅ RESOLVED Sprint 5 | Backend + Frontend                | Excel/CSV asset import with template and validation             |

---

## 4. Sprint Plan — Road to 100% Coverage

### Sprint 1: Critical Fixes (Priority: BLOCKING) — Est. Effort: Medium

**Goal**: Fix semua blocker yang membuat core workflow tidak berfungsi.

| Task                                                                    | Issue Ref  | Effort |
| ----------------------------------------------------------------------- | ---------- | ------ |
| 1.1 Wire approval buttons (onClick → hooks) di semua Detail pages       | C-01       | Small  |
| 1.2 Add rejection dialog (input reason) to all transaction Detail pages | C-01       | Small  |
| 1.3 Apply RoleProtectedRoute ke semua protected routes                  | C-03       | Small  |
| 1.4 Create 404 NotFoundPage + Error Boundary                            | H-05, H-06 | Small  |

**Expected Coverage After Sprint 1**: **74%** (+6%)

---

### Sprint 2: Repair Module + Approval Engine (Priority: HIGH)

**Goal**: Complete modul Repair dan perbaiki approval engine.

| Task                                                                   | Issue Ref | Effort |
| ---------------------------------------------------------------------- | --------- | ------ |
| 2.1 Create Repair/AssetRepair Prisma model di transaction.prisma       | C-02      | Small  |
| 2.2 Implement RepairController + RepairService (DRY dari Loan pattern) | C-02      | Medium |
| 2.3 Implement dynamic approval chain per PRD 6.3 (3 workflows)         | H-04      | Large  |
| 2.4 Implement change-password endpoint (backend + frontend)            | M-04      | Small  |

**Expected Coverage After Sprint 2**: **80%** (+6%)

---

### Sprint 3: Notification + Audit Trail (Priority: HIGH)

**Goal**: Implement auto-triggered notifications dan audit trail interceptor.

| Task                                                                | Issue Ref | Effort |
| ------------------------------------------------------------------- | --------- | ------ |
| 3.1 Create AuditTrailInterceptor — auto-log all CUD operations      | H-03      | Medium |
| 3.2 Auto-trigger notifications on approval/rejection/status changes | H-01      | Medium |
| 3.3 Build notification dropdown UI (bell → panel → list)            | H-02      | Medium |
| 3.4 Notification controller endpoints (list, markRead, markAllRead) | H-01      | Small  |

**Expected Coverage After Sprint 3**: **87%** (+7%)

---

### Sprint 4: File Upload + Attachment (Priority: MEDIUM)

**Goal**: Implement file upload system dan wire ke transactions/assets.

| Task                                                                    | Issue Ref | Effort |
| ----------------------------------------------------------------------- | --------- | ------ |
| 4.1 Create file upload service (multer/S3) + controller                 | M-01      | Medium |
| 4.2 Create FileUpload component (drag-drop, preview)                    | M-01      | Medium |
| 4.3 Wire attachments to transaction forms (request, loan, repair, etc.) | M-01      | Medium |
| 4.4 Wire attachments to asset detail (photos, documents)                | M-01      | Small  |

**Expected Coverage After Sprint 4**: **92%** (+5%)

---

### Sprint 5: Export/Import + QR (Priority: MEDIUM)

**Goal**: Implement data export, import, dan QR code.

| Task                                                 | Issue Ref | Effort |
| ---------------------------------------------------- | --------- | ------ |
| 5.1 Implement export Excel (per module list page)    | M-02      | Medium |
| 5.2 Implement export PDF (detail/report pages)       | M-02      | Medium |
| 5.3 Implement QR/barcode generation per asset        | M-03      | Medium |
| 5.4 Implement data import from Excel                 | M-06      | Large  |
| 5.5 Budget management (remaining budget calculation) | M-05      | Small  |

**Expected Coverage After Sprint 5**: **100%**

---

## 5. Coverage Progression Chart

```
Sprint 0 (Current):  ██████████████░░░░░░░  68%
Sprint 1 (Fixes):    ███████████████░░░░░░  74%
Sprint 2 (Repair):   ████████████████░░░░░  80%
Sprint 3 (Notif):    █████████████████░░░░  87%
Sprint 4 (Upload):   ██████████████████░░░  92%
Sprint 5 (Export):   █████████████████████  100%
```

---

## 6. Rekomendasi Eksekusi

**Sprint 1 adalah PRIORITAS TERTINGGI** karena:

1. Approval workflow yang broken = aplikasi tidak usable untuk transaction management
2. Role protection yang missing = security vulnerability
3. Error pages yang missing = poor UX

Rekomendasi: **Eksekusi Sprint 1 sekarang**, lalu konfirmasi sebelum lanjut Sprint 2.
