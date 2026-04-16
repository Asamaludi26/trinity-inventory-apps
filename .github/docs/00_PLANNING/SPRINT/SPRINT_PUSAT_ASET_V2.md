---

## Sprint Plan File

Create at: `.github/docs/00_PLANNING/SPRINT/SPRINT_PUSAT_ASET_V2.md`

```markdown
# Sprint Plan: Pusat Aset Enhancement v2

**Created:** 16 April 2026
**Author:** Trinity AI Orchestrator — Project Manager Agent
**Source:** PLAN_FITUR.md §1.2.1 Catat Aset & §1.2.2 Stok Aset
**Status:** Draft — Pending Review

---

## Scope

### Included

- 1.2.1 Catat Aset: Dual View, Multi-Card Form, Detail Page, Edit, Safe Delete
- 1.2.2 Stok Aset: Column Updates, Modals, Action Menu, Threshold Relocation

### Excluded

- 1.1 Dashboard, 1.3 Manajemen Pelanggan, 1.4 Proyek, 1.5 Pengaturan
- Data Pembelian Aset CRUD (dependency, assumed existing)
- Data Depresiasi Aset CRUD (dependency, assumed existing)

---

## Risk Assessment

| Risk                                               | Impact | Likelihood | Mitigation                                     |
| -------------------------------------------------- | ------ | ---------- | ---------------------------------------------- |
| Prisma schema changes break existing features      | High   | Medium     | Migration-first approach, backward compatible  |
| Role-based visibility complex on frontend          | Medium | High       | Centralized permission hook `usePermission()`  |
| Cascade dropdown performance (Kategori→Tipe→Model) | Medium | Medium     | Cache + debounce, prefetch on form mount       |
| File upload size/type validation bypass            | High   | Low        | Backend validation + frontend validation both  |
| Dual view API performance (group mode)             | Medium | Medium     | Database indexing on `recordingId`, pagination |

---

## Architecture Decisions

| Decision                                            | Rationale                                        |
| --------------------------------------------------- | ------------------------------------------------ |
| Soft delete for assets                              | Data integrity, audit trail support              |
| URL query param for view mode (`?view=group\|list`) | Shareable URLs, browser history support          |
| Separate API endpoints for stock detail modals      | Avoid over-fetching on table load                |
| Threshold as separate modal (not table column)      | Cleaner UX, batch operations support             |
| `PATCH` for asset updates (not `PUT`)               | Partial updates, smaller payloads, diff tracking |

---

## Sprint Breakdown

### Sprint 1: Database & Backend Foundation

**Duration:** Fokus pada schema, API endpoints, dan business logic.

| #   | Task                                                                               | Agent    | Priority | Depends | Est. |
| --- | ---------------------------------------------------------------------------------- | -------- | -------- | ------- | ---- |
| 1   | Update Prisma schema — AssetRecording model, Asset relations, audit fields         | database | P0       | —       | M    |
| 2   | Update Prisma schema — Stock threshold fields (min, warning per stock item)        | database | P0       | —       | S    |
| 3   | Update Prisma schema — AssetHistory model (audit trail)                            | database | P0       | —       | S    |
| 4   | Update Prisma schema — AssetAttachment model                                       | database | P0       | —       | S    |
| 5   | Update Prisma schema — DamageReport, LossReport models                             | database | P0       | —       | S    |
| 6   | Create & run Prisma migration                                                      | database | P0       | #1-#5   | S    |
| 7   | Asset API — `GET /assets?view=group\|list` with pagination, search, filter         | backend  | P0       | #6      | L    |
| 8   | Asset API — `POST /assets` (create with multi-card data, auto-generate doc number) | backend  | P0       | #6      | L    |
| 9   | Asset API — `GET /assets/{id}` (detail with all relations)                         | backend  | P0       | #6      | M    |
| 10  | Asset API — `PATCH /assets/{id}` (partial update + history entry)                  | backend  | P0       | #6      | M    |
| 11  | Asset API — `DELETE /assets/{id}` (safe delete with relation check)                | backend  | P0       | #6      | M    |
| 12  | Asset API — `GET /assets/{id}/history` (audit trail)                               | backend  | P1       | #6      | S    |
| 13  | Asset API — `POST /assets/{id}/attachments` (file upload)                          | backend  | P0       | #6      | M    |
| 14  | Stock API — `GET /stocks/{id}/detail-total`                                        | backend  | P0       | #6      | M    |
| 15  | Stock API — `GET /stocks/{id}/detail-usage`                                        | backend  | P0       | #6      | M    |
| 16  | Stock API — `POST /stocks/{id}/restock`                                            | backend  | P0       | #6      | M    |
| 17  | Stock API — `GET /stocks/{id}/history`                                             | backend  | P1       | #6      | S    |
| 18  | Stock API — `POST /assets/{id}/report-damage`                                      | backend  | P1       | #6      | M    |
| 19  | Stock API — `POST /assets/{id}/report-lost`                                        | backend  | P1       | #6      | M    |
| 20  | Stock API — Threshold CRUD (bulk + per item)                                       | backend  | P0       | #6      | M    |
| 21  | Backend validation — DTOs for all new endpoints                                    | backend  | P0       | #7-#20  | M    |
| 22  | Backend unit tests — Asset service                                                 | backend  | P1       | #7-#11  | M    |

### Sprint 2: Frontend — Catat Aset

| #   | Task                                                                     | Agent    | Priority | Depends  | Est. |
| --- | ------------------------------------------------------------------------ | -------- | -------- | -------- | ---- |
| 23  | Asset list page — Dual view toggle (Grup/Daftar) component               | frontend | P0       | #7       | L    |
| 24  | Asset list — Group view (collapsible cards per recording)                | frontend | P0       | #23      | L    |
| 25  | Asset list — List view (DataTable flat)                                  | frontend | P0       | #23      | M    |
| 26  | Asset form — Card Dokumen (auto-filled readonly)                         | frontend | P0       | #8       | S    |
| 27  | Asset form — Card Informasi Aset (cascade dropdown)                      | frontend | P0       | #8       | L    |
| 28  | Asset form — Card Detail (conditional: individual vs material)           | frontend | P0       | #8       | L    |
| 29  | Asset form — Card Pembelian (role-restricted, auto-fill)                 | frontend | P1       | #8       | M    |
| 30  | Asset form — Card Depresiasi (role-restricted, individual only)          | frontend | P1       | #8       | M    |
| 31  | Asset form — Card Lokasi                                                 | frontend | P0       | #8       | M    |
| 32  | Asset form — Card Lampiran (dropzone, preview, upload)                   | frontend | P0       | #13      | M    |
| 33  | Asset form — Form orchestration (validation, submit, API integration)    | frontend | P0       | #26-#32  | L    |
| 34  | Asset detail page — Tab layout + routing                                 | frontend | P0       | #9       | M    |
| 35  | Asset detail — Tab Informasi Umum                                        | frontend | P0       | #34      | S    |
| 36  | Asset detail — Tab Detail                                                | frontend | P0       | #34      | S    |
| 37  | Asset detail — Tab Label & Barcode (react-barcode + qrcode.react, print) | frontend | P0       | #34      | L    |
| 38  | Asset detail — Tab Pembelian (role-restricted)                           | frontend | P1       | #34      | S    |
| 39  | Asset detail — Tab Depresiasi (role-restricted)                          | frontend | P1       | #34      | S    |
| 40  | Asset detail — Tab Lokasi                                                | frontend | P0       | #34      | S    |
| 41  | Asset detail — Tab Lampiran (preview + download)                         | frontend | P0       | #34      | M    |
| 42  | Asset detail — Tab Riwayat (timeline)                                    | frontend | P1       | #12, #34 | M    |
| 43  | Asset edit page — Pre-populated form, PATCH integration                  | frontend | P0       | #10, #33 | M    |
| 44  | Asset delete — Safe delete modal + relation check UI                     | frontend | P0       | #11      | M    |

### Sprint 3: Frontend — Stok Aset

| #   | Task                                                                       | Agent    | Priority | Depends | Est. |
| --- | -------------------------------------------------------------------------- | -------- | -------- | ------- | ---- |
| 45  | Stock table — Update column structure (add Harga, remove threshold column) | frontend | P0       | #14     | M    |
| 46  | Stock table — Clickable Total column + Modal Detail Total                  | frontend | P0       | #14     | L    |
| 47  | Stock table — Clickable Digunakan column + Modal Detail Penggunaan         | frontend | P0       | #15     | L    |
| 48  | Stock table — Harga Aset column (role-restricted, footer total)            | frontend | P0       | #45     | M    |
| 49  | Stock table — Action dropdown menu component                               | frontend | P0       | —       | M    |
| 50  | Stock action — Restock modal form                                          | frontend | P0       | #16     | M    |
| 51  | Stock action — Riwayat drawer/modal (timeline + filters)                   | frontend | P1       | #17     | M    |
| 52  | Stock action — Lapor Kerusakan modal (individual only)                     | frontend | P1       | #18     | M    |
| 53  | Stock action — Lapor Hilang modal                                          | frontend | P1       | #19     | M    |
| 54  | Threshold — Header button + modal (2 tabs: bulk + per item)                | frontend | P0       | #20     | L    |
| 55  | Threshold — Inline edit per item with auto-save                            | frontend | P0       | #54     | M    |
| 56  | Threshold — Visual indicators (red/yellow) on stock table                  | frontend | P1       | #54     | S    |

### Sprint 4: Polish & Integration

| #   | Task                                                          | Agent             | Priority | Depends | Est. |
| --- | ------------------------------------------------------------- | ----------------- | -------- | ------- | ---- |
| 57  | Permission hook — `usePermission()` for role-based visibility | frontend          | P0       | —       | M    |
| 58  | API integration testing — All new endpoints                   | backend           | P0       | #7-#20  | L    |
| 59  | E2E smoke test — Asset CRUD flow                              | frontend          | P1       | #23-#44 | L    |
| 60  | E2E smoke test — Stock actions flow                           | frontend          | P1       | #45-#56 | M    |
| 61  | Quality Gate — lint + typecheck both apps                     | frontend, backend | P0       | All     | S    |
| 62  | Documentation — Update changelog, API docs                    | documentation     | P0       | All     | M    |

---

## File Impact Analysis

### Backend Files (apps/backend/src/)

#### Prisma Schema

| File                                | Action     | Description                                                                                                                     |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/prisma/schema.prisma` | **MODIFY** | Add/update: AssetRecording, AssetHistory, AssetAttachment, DamageReport, LossReport models. Add threshold fields to Stock model |
| `apps/backend/prisma/migrations/`   | **CREATE** | New migration file for schema changes                                                                                           |

#### Modules — Asset

| File                                                      | Action            | Description                                                                |
| --------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| `apps/backend/src/modules/asset/asset.controller.ts`      | **MODIFY**        | Add endpoints: group/list view, PATCH, DELETE (safe), history, attachments |
| `apps/backend/src/modules/asset/asset.service.ts`         | **MODIFY**        | Add: grouped query, safe delete logic, history tracking, file handling     |
| `apps/backend/src/modules/asset/asset.module.ts`          | **MODIFY**        | Register new providers if needed                                           |
| `apps/backend/src/modules/asset/dto/query-asset.dto.ts`   | **CREATE**        | DTO: view, page, limit, search, categoryId, status                         |
| `apps/backend/src/modules/asset/dto/create-asset.dto.ts`  | **MODIFY**        | Add: material fields, location fields, attachments metadata                |
| `apps/backend/src/modules/asset/dto/update-asset.dto.ts`  | **CREATE/MODIFY** | DTO for PATCH: partial fields                                              |
| `apps/backend/src/modules/asset/dto/report-damage.dto.ts` | **CREATE**        | DTO: assetId, damageType, description, severity                            |
| `apps/backend/src/modules/asset/dto/report-lost.dto.ts`   | **CREATE**        | DTO: assetId, lostDate, description                                        |

#### Modules — Stock

| File                                                            | Action     | Description                                                       |
| --------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| `apps/backend/src/modules/stock/stock.controller.ts`            | **MODIFY** | Add: detail-total, detail-usage, restock, history, threshold CRUD |
| `apps/backend/src/modules/stock/stock.service.ts`               | **MODIFY** | Add: detail queries, restock logic, threshold bulk update         |
| `apps/backend/src/modules/stock/dto/restock.dto.ts`             | **CREATE** | DTO: quantity, source, notes                                      |
| `apps/backend/src/modules/stock/dto/threshold.dto.ts`           | **CREATE** | DTO: min, warning (single + bulk)                                 |
| `apps/backend/src/modules/stock/dto/query-stock-history.dto.ts` | **CREATE** | DTO: page, limit, action, dateFrom, dateTo                        |

#### Shared/Common

| File                                                    | Action     | Description                                           |
| ------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| `apps/backend/src/common/decorators/roles.decorator.ts` | **CHECK**  | Ensure ADMIN_PURCHASE, ADMIN_FINANCE roles exist      |
| `apps/backend/src/common/guards/roles.guard.ts`         | **CHECK**  | Verify guard handles new role restrictions            |
| `apps/backend/src/common/utils/document-number.util.ts` | **CREATE** | Auto-generate document number: `REC-{YYYYMMDD}-{seq}` |

---

### Frontend Files (apps/frontend/src/)

#### Asset Feature

| File                                                                              | Action            | Description                                    |
| --------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------- |
| `apps/frontend/src/features/assets/pages/AssetListPage.tsx`                       | **MODIFY**        | Add dual view toggle, integrate group/list API |
| `apps/frontend/src/features/assets/pages/AssetCreatePage.tsx`                     | **MODIFY**        | Refactor to multi-card form layout             |
| `apps/frontend/src/features/assets/pages/AssetDetailPage.tsx`                     | **MODIFY**        | Add tabbed layout with all 8 tabs              |
| `apps/frontend/src/features/assets/pages/AssetEditPage.tsx`                       | **CREATE/MODIFY** | Pre-populated edit form                        |
| `apps/frontend/src/features/assets/components/AssetGroupView.tsx`                 | **CREATE**        | Collapsible group cards component              |
| `apps/frontend/src/features/assets/components/AssetListView.tsx`                  | **CREATE**        | Flat DataTable component                       |
| `apps/frontend/src/features/assets/components/AssetViewToggle.tsx`                | **CREATE**        | Toggle button (Grup/Daftar)                    |
| `apps/frontend/src/features/assets/components/form/CardDokumen.tsx`               | **CREATE**        | Auto-filled document card                      |
| `apps/frontend/src/features/assets/components/form/CardInformasiAset.tsx`         | **CREATE**        | Cascade dropdown (Kategori→Tipe→Model)         |
| `apps/frontend/src/features/assets/components/form/CardDetailIndividual.tsx`      | **CREATE**        | SN, MAC, Kondisi fields                        |
| `apps/frontend/src/features/assets/components/form/CardDetailMaterialDirect.tsx`  | **CREATE**        | Jumlah + Satuan (habis langsung)               |
| `apps/frontend/src/features/assets/components/form/CardDetailMaterialGradual.tsx` | **CREATE**        | Jumlah + Kontainer + Konversi (habis perlahan) |
| `apps/frontend/src/features/assets/components/form/CardPembelian.tsx`             | **CREATE**        | Purchase info (role-restricted)                |
| `apps/frontend/src/features/assets/components/form/CardDepresiasi.tsx`            | **CREATE**        | Depreciation info (role-restricted)            |
| `apps/frontend/src/features/assets/components/form/CardLokasi.tsx`                | **CREATE**        | Location fields                                |
| `apps/frontend/src/features/assets/components/form/CardLampiran.tsx`              | **CREATE**        | File dropzone + preview                        |
| `apps/frontend/src/features/assets/components/detail/TabInformasiUmum.tsx`        | **CREATE**        | General info tab                               |
| `apps/frontend/src/features/assets/components/detail/TabDetail.tsx`               | **CREATE**        | Asset detail tab                               |
| `apps/frontend/src/features/assets/components/detail/TabLabelBarcode.tsx`         | **CREATE**        | Barcode + QR + print layout                    |
| `apps/frontend/src/features/assets/components/detail/TabPembelian.tsx`            | **CREATE**        | Purchase tab (role-restricted)                 |
| `apps/frontend/src/features/assets/components/detail/TabDepresiasi.tsx`           | **CREATE**        | Depreciation tab (role-restricted)             |
| `apps/frontend/src/features/assets/components/detail/TabLokasi.tsx`               | **CREATE**        | Location tab                                   |
| `apps/frontend/src/features/assets/components/detail/TabLampiran.tsx`             | **CREATE**        | Attachments tab                                |
| `apps/frontend/src/features/assets/components/detail/TabRiwayat.tsx`              | **CREATE**        | History timeline tab                           |
| `apps/frontend/src/features/assets/components/AssetLabel.tsx`                     | **CREATE**        | Printable label (barcode + QR)                 |
| `apps/frontend/src/features/assets/components/DeleteAssetModal.tsx`               | **CREATE**        | Safe delete confirmation modal                 |
| `apps/frontend/src/features/assets/hooks/useAssets.ts`                            | **MODIFY**        | Add group/list query, mutations                |
| `apps/frontend/src/features/assets/hooks/useAssetDetail.ts`                       | **CREATE**        | Detail query with relations                    |
| `apps/frontend/src/features/assets/hooks/useAssetHistory.ts`                      | **CREATE**        | History query                                  |
| `apps/frontend/src/features/assets/hooks/useAssetForm.ts`                         | **CREATE**        | Form state management (react-hook-form + zod)  |
| `apps/frontend/src/features/assets/hooks/useCascadeDropdown.ts`                   | **CREATE**        | Kategori→Tipe→Model cascade logic              |
| `apps/frontend/src/features/assets/types/asset.types.ts`                          | **MODIFY**        | Add new types/interfaces                       |
| `apps/frontend/src/features/assets/schemas/asset.schema.ts`                       | **MODIFY**        | Zod validation schemas                         |

#### Stock Feature

| File                                                                     | Action     | Description                                                          |
| ------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------- |
| `apps/frontend/src/features/stocks/pages/StockPage.tsx`                  | **MODIFY** | Update table columns, add threshold button to header                 |
| `apps/frontend/src/features/stocks/components/StockTable.tsx`            | **MODIFY** | New columns (Harga, clickable Total/Digunakan), remove threshold col |
| `apps/frontend/src/features/stocks/components/StockDetailTotalModal.tsx` | **CREATE** | Breakdown by status + location                                       |
| `apps/frontend/src/features/stocks/components/StockDetailUsageModal.tsx` | **CREATE** | Usage detail per item                                                |
| `apps/frontend/src/features/stocks/components/StockActionMenu.tsx`       | **CREATE** | Dropdown: Restock, Riwayat, Lapor Kerusakan, Lapor Hilang            |
| `apps/frontend/src/features/stocks/components/RestockModal.tsx`          | **CREATE** | Restock form modal                                                   |
| `apps/frontend/src/features/stocks/components/StockHistoryDrawer.tsx`    | **CREATE** | Stock history timeline + filters                                     |
| `apps/frontend/src/features/stocks/components/ReportDamageModal.tsx`     | **CREATE** | Damage report form (individual only)                                 |
| `apps/frontend/src/features/stocks/components/ReportLostModal.tsx`       | **CREATE** | Lost report form                                                     |
| `apps/frontend/src/features/stocks/components/ThresholdModal.tsx`        | **CREATE** | 2-tab modal: bulk + per item                                         |
| `apps/frontend/src/features/stocks/components/ThresholdBulkTab.tsx`      | **CREATE** | Bulk threshold setting                                               |
| `apps/frontend/src/features/stocks/components/ThresholdPerItemTab.tsx`   | **CREATE** | Inline edit per item                                                 |
| `apps/frontend/src/features/stocks/hooks/useStockDetail.ts`              | **CREATE** | Detail total + usage queries                                         |
| `apps/frontend/src/features/stocks/hooks/useStockActions.ts`             | **CREATE** | Restock, report mutations                                            |
| `apps/frontend/src/features/stocks/hooks/useThreshold.ts`                | **CREATE** | Threshold CRUD hooks                                                 |
| `apps/frontend/src/features/stocks/types/stock.types.ts`                 | **MODIFY** | Add new types                                                        |
| `apps/frontend/src/features/stocks/schemas/stock.schema.ts`              | **MODIFY** | Zod schemas for new forms                                            |

#### Shared

| File                                           | Action            | Description                                   |
| ---------------------------------------------- | ----------------- | --------------------------------------------- |
| `apps/frontend/src/hooks/usePermission.ts`     | **CREATE/MODIFY** | Centralized role-based visibility hook        |
| `apps/frontend/src/components/ui/dropzone.tsx` | **CREATE**        | Reusable file upload dropzone (if not exists) |
| `apps/frontend/src/lib/format.ts`              | **MODIFY**        | Add currency IDR formatter                    |

---

## Dependency Graph

````
This is the code block that represents the suggested code change:
```markdown
---

## Parallel Execution Opportunities

| Parallel Track A | Parallel Track B |
|------------------|------------------|
| Asset APIs (#7-#13) | Stock APIs (#14-#20) |
| Asset List UI (#23-#25) | Asset Form UI (#26-#33) |
| Asset Detail UI (#34-#42) | Stock Table UI (#45-#48) |
| Stock Actions UI (#49-#53) | Threshold UI (#54-#56) |

---

## Definition of Done

- [ ] All P0 tasks completed and passing
- [ ] Quality Gate: `pnpm --filter ./apps/frontend/ lint` ✅
- [ ] Quality Gate: `pnpm --filter ./apps/frontend/ typecheck` ✅
- [ ] Quality Gate: `pnpm --filter ./apps/backend/ lint` ✅
- [ ] No `any` types without documented justification
- [ ] API responses follow `{ success, data, meta?, error? }` format
- [ ] Role-based visibility working for SUPER_ADMIN, ADMIN_PURCHASE, ADMIN_FINANCE
- [ ] Soft delete implemented (no hard deletes)
- [ ] File upload validates type + size on both frontend + backend
- [ ] Changelog updated
```
````
