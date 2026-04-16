# EXECUTION STEPS — Road to 100% Completion

> **Created**: 16 April 2026
> **Updated**: 17 April 2026 — **ALL GAPS RESOLVED. 100% COMPLETE.**
> **Based on**: Verified codebase analysis against all PLAN sprint documents
> **Current Overall**: **100% complete across all sprints** ✅

---

## Summary of Remaining Gaps — ALL RESOLVED ✅

After thorough verification of the codebase against all 9 PLAN files and 5 ANALYSIS files, all 9 gaps have been implemented and verified.

| #   | Gap                                                      | Source Plan              | Priority | Status                                                       |
| --- | -------------------------------------------------------- | ------------------------ | -------- | ------------------------------------------------------------ |
| G-1 | Asset classification enforcement (INDIVIDUAL/BULK logic) | SPRINT_REBUILD_MASTER S1 | HIGH     | ✅ **DONE**                                                  |
| G-2 | Frontend component tests (Vitest + RTL)                  | SPRINT_REBUILD_MASTER S5 | HIGH     | ✅ **DONE**                                                  |
| G-3 | Frontend React.lazy() route-based code splitting         | SPRINT_REBUILD_MASTER S0 | MEDIUM   | ✅ **DONE** (already implemented via React Router v7 `lazy`) |
| G-4 | Dismantle material recovery (reverse-FIFO)               | SPRINT_3 S3-T15          | MEDIUM   | ✅ **DONE**                                                  |
| G-5 | Purchase admin UI (vendor/PO fill by Admin)              | SPRINT_2 S2-T06          | MEDIUM   | ✅ **DONE**                                                  |
| G-6 | Audit log before/after diff view                         | SPRINT_4 S4-T07          | LOW      | ✅ **DONE**                                                  |
| G-7 | Barcode generation (Code 128)                            | SPRINT_4 S4-T09          | LOW      | ✅ **DONE**                                                  |
| G-8 | Project task progress % calculation                      | SPRINT_3 S3-T13          | LOW      | ✅ **DONE**                                                  |
| G-9 | Users/Divisions summary charts (dashboard)               | SPRINT_4 S4-T04          | LOW      | ✅ **DONE**                                                  |

**Total Remaining Effort**: 0 hours — ALL COMPLETE

---

## Execution Plan

### Phase 1: HIGH Priority (12h — Day 1-2)

#### Step 1.1: Asset Classification Enforcement (G-1)

**Goal**: Enforce INDIVIDUAL vs BULK (COUNT/MEASUREMENT) logic in asset operations

**Files to modify**:

- `apps/backend/src/modules/assets/asset.service.ts`

**Tasks**:

- [x] In `create()` and `createBatch()`: If classification = `ASSET` + trackingMethod = `INDIVIDUAL`, enforce `quantity = 1` and require unique serialNumber
- [x] If classification = `MATERIAL` + trackingMethod = `COUNT/MEASUREMENT`, allow quantity > 1, serialNumber optional
- [x] In handover/loan/return operations: INDIVIDUAL assets move as whole unit, MATERIAL deducts from balance
- [x] Add validation in DTOs: conditional Zod rules based on classification
- [x] Write unit test covering both paths

**Verification**:

```bash
pnpm --filter ./apps/backend/ lint
pnpm --filter ./apps/backend/ test -- --testPathPattern=asset
```

#### Step 1.2: Frontend Component Tests Setup (G-2)

**Goal**: Set up Vitest + React Testing Library and write initial component tests

**Files to create/modify**:

- `apps/frontend/vitest.config.ts` (create)
- `apps/frontend/src/test/setup.ts` (create)
- `apps/frontend/package.json` (add test deps)

**Tasks**:

- [x] Install: `vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [x] Configure vitest.config.ts with jsdom environment
- [x] Create test setup file with jest-dom matchers
- [x] Write 5 smoke tests for critical components:
  - [x] LoginPage renders and handles submit
  - [x] AssetListPage renders table
  - [x] DashboardPage renders stats cards
  - [x] Navigation renders menu items based on role
  - [x] Form validation shows error messages
- [x] Add `"test": "vitest run"` script to package.json

**Verification**:

```bash
pnpm --filter ./apps/frontend/ test
```

---

### Phase 2: MEDIUM Priority (10h — Day 2-3)

#### Step 2.1: React.lazy() Route Splitting (G-3)

**Goal**: Lazy load route components for better initial load performance

**Files to modify**:

- `apps/frontend/src/routes/` (route definitions)

**Tasks**:

- [x] Wrap all page imports with `React.lazy()`
- [x] Add `<Suspense fallback={<LoadingSpinner />}>` wrapper at route level
- [x] Verify all routes still work after lazy loading

**Verification**:

```bash
pnpm --filter ./apps/frontend/ build
pnpm --filter ./apps/frontend/ typecheck
```

#### Step 2.2: Dismantle Material Recovery (G-4)

**Goal**: When project equipment is dismantled, recovered materials return to stock via reverse-FIFO

**Files to modify**:

- `apps/backend/src/modules/assets/fifo-consumption.service.ts`
- `apps/backend/src/modules/projects/project.service.ts`

**Tasks**:

- [x] Add `recoverMaterial()` method in fifo-consumption.service.ts
- [x] Create StockMovement with type `DISMANTLE_RECOVERY`
- [x] Update asset currentBalance atomically
- [x] Wire to project dismantle action
- [x] Add E2E test in fifo-consumption.e2e-spec.ts

#### Step 2.3: Purchase Admin UI (G-5)

**Goal**: Admin can fill vendor info and PO number when processing purchase requests

**Files to create/modify**:

- `apps/frontend/src/features/assets/pages/PurchaseProcessPage.tsx` (create if not exists)
- `apps/frontend/src/features/assets/components/PurchaseProcessForm.tsx` (create)

**Tasks**:

- [x] Create form with fields: vendorName, vendorContact, poNumber, estimatedDelivery
- [x] Wire to backend PATCH /purchases/:id/process endpoint
- [x] Add route and navigation link
- [x] Validate form with Zod schema

---

### Phase 3: LOW Priority (10h — Day 3-4)

#### Step 3.1: Audit Log Diff View (G-6)

**Goal**: Show before/after comparison in audit log detail

**Files to create/modify**:

- `apps/frontend/src/features/settings/components/AuditDiffView.tsx` (create)
- `apps/frontend/src/features/settings/pages/AuditLogDetailPage.tsx` (modify)

**Tasks**:

- [x] Create side-by-side diff component showing old vs new values
- [x] Highlight changed fields with color coding
- [x] Handle nested object diffs (JSON comparison)
- [x] Wire to audit log detail page

#### Step 3.2: Barcode Generation (G-7)

**Goal**: Generate Code 128 barcodes for asset labels

**Files to create/modify**:

- `apps/frontend/src/features/assets/components/BarcodeLabel.tsx` (create)
- `apps/frontend/src/features/assets/pages/AssetDetailPage.tsx` (modify)

**Tasks**:

- [x] Install `react-barcode` or similar library
- [x] Create BarcodeLabel component with Code 128 encoding
- [x] Add barcode display + print button on asset detail page
- [x] Include asset code, name, and serial number in label

#### Step 3.3: Project Task Progress (G-8)

**Goal**: Calculate and display task completion percentage per project

**Files to modify**:

- `apps/backend/src/modules/projects/project.service.ts`
- `apps/frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Tasks**:

- [x] Add `calculateProgress()` method: completedTasks / totalTasks \* 100
- [x] Include progress in project detail response
- [x] Display progress bar in frontend detail page

#### Step 3.4: Users/Divisions Summary Charts (G-9)

**Goal**: Add summary statistics cards on users/divisions dashboard

**Files to modify**:

- `apps/frontend/src/features/settings/pages/UsersPage.tsx`
- `apps/frontend/src/features/settings/pages/DivisionsPage.tsx`

**Tasks**:

- [x] Add summary stats: total users, active/inactive count, per-role breakdown
- [x] Add summary stats: total divisions, user count per division
- [x] Use existing StatsCard component pattern from dashboard

---

## Quality Gate (After Each Phase)

```bash
# Run after EVERY phase completion
pnpm --filter ./apps/frontend/ lint
pnpm --filter ./apps/frontend/ typecheck
pnpm --filter ./apps/backend/ lint
pnpm --filter ./apps/backend/ typecheck
```

**All warnings treated as errors. Must pass before moving to next phase.**

---

## Expected Progress After Each Phase

| Phase       | Tasks    | Cumulative % | Est. Completion |
| ----------- | -------- | ------------ | --------------- |
| ~~Current~~ | —        | ~~95%~~      | —               |
| ~~Phase 1~~ | G-1, G-2 | ~~97%~~      | ✅ Day 1        |
| ~~Phase 2~~ | G-3–G-5  | ~~99%~~      | ✅ Day 1        |
| ~~Phase 3~~ | G-6–G-9  | **100%**     | ✅ Day 1        |

---

## Definition of Done (100%)

All analysis files must show 100% when these are met:

- [x] All sprint plan tasks executed (SPRINT_PLAN.md)
- [x] All rebuild tasks completed (SPRINT_REBUILD_MASTER.md)
- [x] All PRD v3.1 domains covered (00_ANALISA_CURRENT_STATE.md)
- [x] All coverage gaps resolved (COVERAGE_ANALYSIS.md)
- [x] G-1 through G-9 above completed
- [x] Quality gate passes (0 errors, 0 warnings)
- [x] All analysis files updated to 100%
