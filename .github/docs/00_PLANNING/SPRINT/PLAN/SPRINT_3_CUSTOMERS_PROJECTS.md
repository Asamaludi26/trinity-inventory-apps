# Sprint 3 — Pelanggan & Proyek Infrastruktur

| Metadata      | Detail                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| **Status**    | 📋 PLANNED                                                               |
| **Fokus**     | Customer management, Installation, Maintenance, Dismantle, InfraProject  |
| **Referensi** | PRD §5.1 E, CUSTOMER_OPERATIONS.md, ASSET_LIFECYCLE.md §6-7, SDD §2.4    |
| **Dependen**  | Sprint 1 (Asset, Stock, FIFO), Sprint 2 (Approval Engine, StockMovement) |

---

## Scope

Semua fitur Customer Operations & InfraProject harus **tuntas dan tervalidasi**:

1. Customer CRUD + auto-status transition
2. Instalasi (material consumption FIFO + asset assignment)
3. Maintenance (replacement + material usage + inspection)
4. Dismantle (asset return + condition mapping)
5. InfraProject (task + material + team)

---

## Module 1: Manajemen Pelanggan (T3-01 s/d T3-04)

### T3-01: CRUD Customer [P0, M]

**Agent**: Backend + Frontend  
**File BE**: `modules/customers/clients/`  
**File FE**: `features/customers/pages/`

**Acceptance Criteria**:

- [ ] Create customer: name, address, phone, email, picName, picPhone
- [ ] Auto-generate code: `TMI-YYYY-MM-XXXX`
- [ ] Default status: `INACTIVE`
- [ ] Read: list with pagination, search, filter by status
- [ ] Update: semua field editable
- [ ] Soft delete: hanya jika TIDAK ada riwayat transaksi
- [ ] RBAC: SA, AL full access; Leader/Staff hanya divisi relevan (canDoFieldwork)

### T3-02: Customer Auto-Status Transition [P0, M]

**Agent**: Backend

**Acceptance Criteria** (CUSTOMER_OPERATIONS.md §1.2):

- [ ] INACTIVE → ACTIVE: otomatis saat instalasi pertama berhasil
- [ ] ACTIVE → INACTIVE: otomatis saat semua aset di-dismantle (no remaining IN_USE assets)
- [ ] ACTIVE → SUSPENDED: manual oleh admin
- [ ] SUSPENDED → ACTIVE: manual oleh admin
- [ ] Transition tercatat di ActivityLog

**Logika:**

```typescript
// Saat instalasi complete
async function onInstallationComplete(customerId: number, tx: PrismaClient) {
  const customer = await tx.customer.findUnique({ where: { id: customerId } });
  if (customer.status === 'INACTIVE') {
    await tx.customer.update({
      where: { id: customerId },
      data: { status: 'ACTIVE' },
    });
    await tx.activityLog.create({
      /* transition log */
    });
  }
}

// Saat dismantle complete
async function onDismantleComplete(customerId: number, tx: PrismaClient) {
  // Check remaining active assets for this customer
  const remainingAssets = await tx.asset.count({
    where: {
      // assets linked to customer installations still IN_USE
      installations: { some: { customerId } },
      status: 'IN_USE',
    },
  });

  if (remainingAssets === 0) {
    await tx.customer.update({
      where: { id: customerId },
      data: { status: 'INACTIVE' },
    });
  }
}
```

### T3-03: Customer Detail Tabs [P1, M]

**Agent**: Frontend  
**File**: `features/customers/pages/CustomerDetailPage.tsx`

**Acceptance Criteria**:

- [ ] Tab Info: data customer + edit button
- [ ] Tab Aset Terpasang: aset IN_USE yang ter-install di customer
- [ ] Tab Riwayat Aktivitas: timeline kronologis (instalasi, maintenance, dismantle)
- [ ] Tab Statistik: jumlah instalasi, maintenance, dismantle, aset aktif
- [ ] Each tab lazy-loaded

### T3-04: Customer Deletion Protection [P0, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Tidak bisa delete customer jika ada riwayat (instalasi/maintenance/dismantle)
- [ ] HTTP 422: "Pelanggan memiliki riwayat transaksi. Ubah status ke INACTIVE."
- [ ] Soft delete hanya jika benar-benar tidak ada riwayat

---

## Module 2: Instalasi (T3-05 s/d T3-09)

### T3-05: Create Installation [P0, L]

**Agent**: Backend + Frontend  
**File BE**: `modules/customers/installations/`  
**File FE**: `features/customers/pages/installation/`

**Acceptance Criteria**:

- [ ] Form: customerId, technicianId, scheduledAt, location, note
- [ ] Pilih aset individual: dropdown aset status IN_STORAGE/IN_CUSTODY
- [ ] Pilih material: model + quantity (consumes from stock)
- [ ] Auto-generate code: `INST-YYYY-MM-XXXX`
- [ ] Technician harus dari divisi yang `canDoFieldwork = true`
- [ ] Optional: link ke Request docNumber

### T3-06: Installation Completion Flow [P0, L]

**Agent**: Backend

**Acceptance Criteria** (1 DB Transaction):

- [ ] Validate semua aset exist & valid status
- [ ] Validate customer exist
- [ ] **Aset Individual**:
  - Status → `IN_USE`
  - currentUserId → null (bukan user, customer context)
  - Create StockMovement type: `INSTALLATION`
- [ ] **Material Consumption (FIFO)**:
  - Consume material via FIFO algorithm (Sprint 1 T1-10)
  - Support mixed items (individual + bulk) dalam 1 instalasi
  - Create StockMovement per consumption
- [ ] **Unit Conversion**:
  - Jika model punya capacityPerContainer → convert
  - Input: 2 roll kabel → consume: 2 × 305 = 610 meter
- [ ] **Auto-activate customer**: INACTIVE → ACTIVE
- [ ] ActivityLog created
- [ ] Notification: WhatsApp + bell (async, non-blocking)
- [ ] SSE event emitted

### T3-07: Installation Material Tracking [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] InstallationMaterial: installationId, description, quantity, note, modelId
- [ ] Track actual materials consumed vs planned
- [ ] UI: table of materials with quantities
- [ ] Stock validation sebelum create: cek ketersediaan semua material

### T3-08: Installation Detail Page [P1, M]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Detail: customer info, technician, date, status
- [ ] List aset yang di-install (individual + material)
- [ ] Activity timeline
- [ ] Attachment viewer (foto instalasi)
- [ ] Complete button (for authorized users)

### T3-09: Installation Approval Flow [P2, M]

**Agent**: Backend  
**Note**: Per CUSTOMER_OPERATIONS.md, instalasi langsung COMPLETED saat create (tidak ada approval flow). Namun jika diperlukan, gunakan Workflow 3 approval.

**Acceptance Criteria**:

- [ ] Confirm: instalasi langsung COMPLETED (no approval needed)
- [ ] ATAU implement Workflow 3 approval jika business decision berubah
- [ ] Document decision di DECISIONS.md

---

## Module 3: Maintenance (T3-10 s/d T3-14)

### T3-10: Create Maintenance [P0, M]

**Agent**: Backend + Frontend  
**File BE**: `modules/customers/maintenance/`  
**File FE**: `features/customers/pages/maintenance/`

**Acceptance Criteria**:

- [ ] Form: customerId, technicianId, problemDescription, actionsTaken
- [ ] workTypes: array multi-select (REPAIR, REPLACEMENT, INSPECTION, CABLE_REROUTE, dsb)
- [ ] priority: HIGH / MEDIUM / LOW
- [ ] Auto-generate code: `MT-YYYY-MM-XXXX`

### T3-11: Maintenance Replacement Logic [P0, L]

**Agent**: Backend

**Acceptance Criteria** (CUSTOMER_OPERATIONS.md §3):

- [ ] **Replacement Operation**:
  1. Pilih old asset (yang terpasang di customer, status IN_USE)
  2. Pilih new asset (dari gudang, status IN_STORAGE)
  3. Old asset: status → berdasarkan condition assessment (IN_STORAGE/UNDER_REPAIR/DAMAGED/DECOMMISSIONED)
  4. New asset: status → IN_USE, assigned ke customer context
  5. Create MaintenanceReplacement record (oldAssetDesc, newAssetDesc)
  6. Create StockMovement untuk kedua aset

**Logika Replacement:**

```typescript
async function processReplacement(
  maintenanceId: number,
  oldAssetId: number,
  newAssetId: number,
  conditionAfter: AssetCondition,
  tx: PrismaClient,
) {
  // 1. Validate old asset is IN_USE at customer
  // 2. Validate new asset is IN_STORAGE

  // 3. Condition → Status mapping for old asset
  const oldAssetNewStatus = mapConditionToStatus(conditionAfter);
  // BRAND_NEW/GOOD/USED_OKAY → IN_STORAGE
  // MINOR_DAMAGE → UNDER_REPAIR
  // MAJOR_DAMAGE → DAMAGED
  // FOR_PARTS → DECOMMISSIONED

  // 4. Update old asset
  await tx.asset.update({
    where: { id: oldAssetId },
    data: { status: oldAssetNewStatus, condition: conditionAfter, currentUserId: null },
  });

  // 5. Update new asset
  await tx.asset.update({
    where: { id: newAssetId },
    data: { status: 'IN_USE', currentUserId: null /* customer context */ },
  });

  // 6. StockMovements
  await tx.stockMovement.createMany({ data: [
    { assetId: oldAssetId, type: 'MAINTENANCE', quantity: 1, reference: docNumber },
    { assetId: newAssetId, type: 'INSTALLATION', quantity: -1, reference: docNumber },
  ]});

  // 7. MaintenanceReplacement record
  await tx.maintenanceReplacement.create({ ... });
}
```

### T3-12: Maintenance Material Usage [P0, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Material dipakai saat maintenance → consume via FIFO
- [ ] MaintenanceMaterial: maintenanceId, description, quantity, note, modelId
- [ ] Same FIFO logic as installation (reuse dari Sprint 1)
- [ ] StockMovement type: `MAINTENANCE`

### T3-13: Maintenance Completion [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] Complete maintenance → all operations processed in 1 atomic transaction
- [ ] Resolution field wajib diisi saat complete
- [ ] ActivityLog created
- [ ] Notification to stakeholders
- [ ] Customer status: no change (maintenance doesn't affect customer status)

### T3-14: Maintenance Detail Page [P1, M]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Detail: customer, technician, problem, actions, work types, priority
- [ ] Replaced assets section (old → new)
- [ ] Materials used section
- [ ] Activity timeline
- [ ] Complete flow UI (form for resolution + confirm)

---

## Module 4: Dismantle (T3-15 s/d T3-18)

### T3-15: Create Dismantle [P0, M]

**Agent**: Backend + Frontend  
**File BE**: `modules/customers/dismantles/`  
**File FE**: `features/customers/pages/dismantle/`

**Acceptance Criteria**:

- [ ] Form: customerId, reason, note
- [ ] Select aset yang akan di-dismantle (aset IN_USE di customer)
- [ ] Per item: asetId, conditionAfter, note
- [ ] Auto-generate code: `DSM-YYYY-MM-XXXX`

### T3-16: Dismantle Execution [P0, L]

**Agent**: Backend

**Acceptance Criteria** (CUSTOMER_OPERATIONS.md §4):

- [ ] Per item: condition → status mapping:
  ```
  BRAND_NEW / GOOD / USED_OKAY  → IN_STORAGE (kembali ke gudang)
  MINOR_DAMAGE                    → UNDER_REPAIR
  MAJOR_DAMAGE                    → DAMAGED
  FOR_PARTS                       → DECOMMISSIONED
  ```
- [ ] Asset currentUserId → null (released dari customer)
- [ ] StockMovement type: `DISMANTLE_RETURN`
- [ ] Check remaining assets di customer → auto-INACTIVE jika 0
- [ ] Atomic transaction

### T3-17: Dismantle Material Recovery [P1, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Material yang bisa di-recover: create new stock (reverse-FIFO)
- [ ] DismantleItem track aset individual yang di-dismantle
- [ ] Recovered material: new stock entry with appropriate condition

### T3-18: Dismantle Detail Page [P1, M]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Detail: customer, reason, note
- [ ] Dismantled items: asset name, condition before/after, new status
- [ ] Activity timeline
- [ ] Customer status indicator (ACTIVE → INACTIVE transition visible)

---

## Module 5: Proyek Infrastruktur (T3-19 s/d T3-23)

### T3-19: CRUD InfraProject [P0, M]

**Agent**: Backend + Frontend  
**File BE**: `modules/transactions/projects/`  
**File FE**: `features/transactions/pages/projects/`

**Acceptance Criteria**:

- [ ] Form: name, description, startDate, endDate, location, customerId (optional)
- [ ] Auto-generate code: `PRJ-YYYY-MMDD-XXXX`
- [ ] Status: PLANNING → IN_PROGRESS → ON_HOLD → COMPLETED → CANCELLED
- [ ] Approval: Workflow 3 (Leader → Admin Logistik)
- [ ] RBAC: SA, AL, Leader

### T3-20: Project Task Management [P1, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] CRUD InfraProjectTask: title, description, status, assigneeId, dueDate
- [ ] Task status: TODO → IN_PROGRESS → DONE → BLOCKED
- [ ] Assign task ke team member
- [ ] Track progress (% complete based on task completion)

### T3-21: Project Material Allocation [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] InfraProjectMaterial: projectId, modelId, description, quantity, note
- [ ] Material bisa dari stok existing atau via Request Pengadaan
- [ ] Link Request ke InfraProject (infraProjectId field)
- [ ] Material consumption tracking (planned vs actual)

### T3-22: Project Team Management [P1, S]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] InfraProjectTeamMember: projectId, userId, role, joinedAt
- [ ] Add/remove team members
- [ ] Role per project (coordinator, technician, support)

### T3-23: Project Detail Page [P1, M]

**Agent**: Frontend

**Acceptance Criteria**:

- [ ] Detail: header info (name, dates, location, customer)
- [ ] Tab Tasks: task list with status kanban or table
- [ ] Tab Materials: allocated materials with quantities
- [ ] Tab Team: team members with roles
- [ ] Tab Activity: timeline log
- [ ] Progress indicator (tasks done / total)

---

## Definition of Done (Sprint 3)

- [ ] Customer CRUD + auto-status transition (INACTIVE ↔ ACTIVE) berfungsi
- [ ] Customer deletion protection enforced
- [ ] Instalasi: material FIFO consumption + asset assignment + unit conversion tuntas
- [ ] Maintenance: replacement logic + material usage + multi-worktype tuntas
- [ ] Dismantle: condition → status mapping + auto-INACTIVE customer tuntas
- [ ] InfraProject: lifecycle + tasks + materials + team management tuntas
- [ ] Semua operasi menghasilkan StockMovement records
- [ ] Semua operasi menghasilkan ActivityLog records
- [ ] Customer Detail menampilkan aset terpasang + riwayat + statistik
- [ ] Quality Gate: 0 lint error, 0 typecheck error
