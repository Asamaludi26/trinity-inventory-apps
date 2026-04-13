# Sprint 2 — Transaksi (Approval Engine, Request, Loan, Return, Handover, Repair)

| Metadata      | Detail                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| **Status**    | 📋 PLANNED                                                              |
| **Fokus**     | Approval engine, semua modul transaksi end-to-end dengan business rules |
| **Referensi** | PRD §5.1 D, §6.3, TRANSACTION_WORKFLOWS.md, SDD §2.3                    |
| **Dependen**  | Sprint 1 (Asset, Stock, StockMovement harus tuntas)                     |

---

## Scope

Semua modul transaksi harus **tuntas dan tervalidasi** di sprint ini:

1. Approval Engine (shared, dynamic chain)
2. Request Pengadaan (multi-stage, per-item approval)
3. Peminjaman (Loan) + penugasan aset
4. Pengembalian Aset (Return) dari loan
5. Serah Terima (Handover) antar user
6. Lapor Rusak (Repair) + Lapor Hilang

---

## Module 1: Approval Engine (T2-01 s/d T2-03)

### T2-01: Dynamic Approval Chain Engine [P0, L]

**Agent**: Backend  
**File**: `modules/transactions/approval/`

**Acceptance Criteria**:

- [ ] Engine menentukan approval chain berdasarkan `creatorRole` + `module`
- [ ] Chain tersimpan di `approvalChain` (JSON) per transaksi
- [ ] Setiap step: approverId, role, status (PENDING/APPROVED/REJECTED), timestamp
- [ ] Creator TIDAK PERNAH menjadi approver untuk transaksinya sendiri
- [ ] Reject di stage manapun → transaction REJECTED + alasan wajib
- [ ] Sequential: stage N+1 baru aktif setelah stage N approved

**Matriks Approval (PRD §6.3.2):**

#### Workflow 1: Request Pengadaan

```
| Creator        | Step 1         | Step 2         | Step 3         | Step 4     | Executor       |
|----------------|----------------|----------------|----------------|------------|----------------|
| Staff          | Leader Divisi  | Admin Logistik | Admin Purchase | Superadmin | Admin Logistik |
| Leader         | Admin Logistik | Admin Purchase | Superadmin     | —          | Admin Logistik |
| Admin Logistik | Admin Purchase | Superadmin     | —              | —          | SA / AL        |
| Admin Purchase | Admin Logistik | Superadmin     | —              | —          | SA / AL        |
| Superadmin     | Admin Logistik | Admin Purchase | —              | —          | Admin Logistik |
```

#### Workflow 2: Loan, Return, Handover, Repair

```
| Creator        | Step 1         | Step 2         | CC (info)  | Executor       |
|----------------|----------------|----------------|------------|----------------|
| Staff          | Leader Divisi  | Admin Logistik | Superadmin | Admin Logistik |
| Leader         | Admin Logistik | —              | Superadmin | Admin Logistik |
| Admin Logistik | Superadmin     | —              | —          | SA / AL        |
| Admin Purchase | Admin Logistik | —              | Superadmin | SA / AL        |
| Superadmin     | Admin Logistik | —              | —          | Admin Logistik |
```

#### Workflow 3: Project, Installation, Maintenance, Dismantle

```
| Creator        | Step 1         | Step 2         | CC (info)  | Executor       |
|----------------|----------------|----------------|------------|----------------|
| Staff          | Leader Divisi  | Admin Logistik | Superadmin | Admin Logistik |
| Leader         | Admin Logistik | —              | Superadmin | Admin Logistik |
```

**Logika Engine:**

```typescript
interface ApprovalStep {
  step: number;
  role: UserRole;
  approverId?: string;
  approverName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  timestamp?: Date;
}

function determineApprovalChain(
  creatorRole: UserRole,
  module: 'REQUEST' | 'LOAN' | 'HANDOVER' | 'REPAIR' | 'PROJECT',
): ApprovalStep[] {
  // Lookup matrix berdasarkan creatorRole + module
  // Return array of steps dengan status PENDING
}

async function processApproval(
  transactionId: string,
  approverId: string,
  approverRole: UserRole,
  action: 'APPROVE' | 'REJECT',
  reason?: string,
): Promise<void> {
  // 1. Validate approver is next in chain
  // 2. Validate approver != creator
  // 3. Update step status
  // 4. If REJECT → set transaction REJECTED + reason
  // 5. If APPROVE → check if last step → transition to next status
  // 6. Create ActivityLog
  // 7. Send notification to next approver / creator
}
```

### T2-02: Approval Timeline UI Component [P0, M]

**Agent**: Frontend  
**File**: `features/transactions/components/ApprovalTimeline.tsx`

**Acceptance Criteria**:

- [ ] Timeline visual menampilkan semua approval steps
- [ ] Status per step: pending (grey), approved (green), rejected (red)
- [ ] Approver name + timestamp untuk step yang sudah diproses
- [ ] Current step highlighted
- [ ] CC (mengetahui) ditampilkan terpisah (dashed border)
- [ ] Approve/Reject button hanya muncul jika user adalah next approver

### T2-03: Notification pada Status Change [P0, M]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Setiap approval/rejection → notification ke stakeholder relevan
- [ ] Approve step → notify next approver + cc
- [ ] Reject → notify creator + semua previous approvers
- [ ] Complete → notify all parties
- [ ] Notification type: in-app (bell icon) + WhatsApp (jika enabled)

---

## Module 2: Request Pengadaan (T2-04 s/d T2-08)

### T2-04: Create Request [P0, M]

**Agent**: Backend + Frontend  
**File BE**: `modules/transactions/requests/`  
**File FE**: `features/transactions/pages/requests/`

**Acceptance Criteria**:

- [ ] Form: title, description, orderType (REGULAR/URGENT/PROJECT_BASED), allocationTarget (USAGE/INVENTORY)
- [ ] Add items: itemName, itemTypeBrand, quantity, unit, keterangan
- [ ] Optional: justification, projectName, infraProjectId link
- [ ] Auto-generate docNumber: `RO-YYYY-MMDD-XXXX`
- [ ] Min 1 item, max 50 items (PRD BR-05)
- [ ] Status awal: PENDING
- [ ] Approval chain auto-determined berdasarkan creator role
- [ ] Available stock per item ditampilkan di form (informational)
- [ ] Notification ke first approver

### T2-05: Request Per-item Approval [P0, L]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] Logistic Approval: review per item
- [ ] Per item dapat:
  - `APPROVED` — qty penuh disetujui
  - `PARTIAL` — qty dikurangi + alasan **wajib**
  - `STOCK_ALLOCATED` — stok tersedia, langsung allocate
  - `PROCUREMENT_NEEDED` — perlu beli dari vendor
  - `REJECTED` — tolak item + alasan **wajib**
- [ ] Jika ada item PROCUREMENT_NEEDED → status PURCHASING setelah final approve
- [ ] Jika semua STOCK_ALLOCATED → bisa skip purchasing step
- [ ] Approved quantity tersimpan di `RequestItem.approvedQuantity`
- [ ] UI: tabel items dengan dropdown status + input qty + reason field

### T2-06: Request Purchase Processing [P1, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] Admin Purchase mengisi detail per approved item:
  - purchasePrice, vendor, poNumber, invoiceNumber
  - purchaseDate, warrantyEndDate
- [ ] Status transition: APPROVED → PURCHASING → IN_DELIVERY → ARRIVED
- [ ] Shipping date & arrival date tracking
- [ ] PurchaseFilledById & purchaseFillDate recorded

### T2-07: Request Asset Registration [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] Saat status ARRIVED → Admin Logistik register aset
- [ ] Link ke RequestItem: track registeredQuantity per item
- [ ] Partial registration support (belum semua item tiba)
- [ ] Track via `partiallyRegisteredItems` array
- [ ] Saat semua ter-register → status AWAITING_HANDOVER
- [ ] Serah terima → COMPLETED

### T2-08: Request Cancel [P1, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Hanya requester yang bisa cancel
- [ ] Hanya jika status masih PENDING
- [ ] Cancel → status CANCELLED + ActivityLog
- [ ] Notification ke approvers yang sudah assigned

---

## Module 3: Peminjaman / Loan (T2-09 s/d T2-12)

### T2-09: Create Loan Request [P0, M]

**Agent**: Backend + Frontend  
**File**: `modules/transactions/loans/`, `features/transactions/pages/loans/`

**Acceptance Criteria**:

- [ ] Form: purpose, expectedReturnDate, notes
- [ ] Add items: model selection, quantity description
- [ ] Auto-generate docNumber: `RL-YY-MM-XXXX`
- [ ] Status awal: PENDING
- [ ] Approval chain auto-determined

### T2-10: Loan Asset Assignment [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] Setelah approved, Admin Logistik assign specific assets ke loan
- [ ] Hanya aset status `IN_STORAGE` yang bisa di-assign
- [ ] Create LoanAssetAssignment records
- [ ] Asset status → `IN_CUSTODY`
- [ ] StockMovement type: `LOAN_OUT`
- [ ] Execute → loan active

### T2-11: Overdue Detection [P1, M]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Scheduler cron job: check expectedReturnDate vs now
- [ ] Jika overdue → create notification ke borrower + Admin Logistik
- [ ] Mark loan sebagai OVERDUE (if applicable status)
- [ ] Daily check (00:01 AM)

### T2-12: Link Loan → Return [P0, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] AssetReturn harus link ke LoanRequest
- [ ] Hanya active loans yang bisa di-return
- [ ] Return form auto-populate borrowed assets

---

## Module 4: Pengembalian / Return (T2-13 s/d T2-15)

### T2-13: Create Return [P0, M]

**Agent**: Backend + Frontend  
**File**: `modules/transactions/returns/`, `features/transactions/pages/returns/`

**Acceptance Criteria**:

- [ ] Select active loan request
- [ ] Return items: pilih aset dari loan assignment
- [ ] Per item: conditionBefore (auto), conditionAfter (input), note
- [ ] Auto-generate docNumber: `RT-YYYY-MMDD-XXXX`
- [ ] Status awal: PENDING

### T2-14: Return Condition Assessment [P0, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Condition mapping saat return (ASSET_LIFECYCLE.md §3):
  ```
  BRAND_NEW / GOOD / USED_OKAY  → Asset status: IN_STORAGE
  MINOR_DAMAGE                   → Asset status: UNDER_REPAIR
  MAJOR_DAMAGE                   → Asset status: DAMAGED
  FOR_PARTS                      → Asset status: DECOMMISSIONED
  ```
- [ ] Status transition di-enforce via state machine
- [ ] StockMovement type: `LOAN_RETURN`
- [ ] Asset currentUserId → null (released)

### T2-15: Return Version/Rejection [P1, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Admin Logistik bisa reject return jika kondisi tidak sesuai
- [ ] Rejection reason wajib
- [ ] Borrower bisa submit ulang (version increment)
- [ ] Max 3 rejection cycles (configurable)

---

## Module 5: Serah Terima / Handover (T2-16 s/d T2-18)

### T2-16: Create Handover [P0, M]

**Agent**: Backend + Frontend  
**File**: `modules/transactions/handovers/`, `features/transactions/pages/handovers/`

**Acceptance Criteria**:

- [ ] Form: fromUserId, toUserId, witnessUserId
- [ ] Add items: select aset yang dipegang fromUser (status IN_USE/IN_CUSTODY)
- [ ] Auto-generate docNumber: `HD-YYYY-MMDD-XXXX`
- [ ] Validasi: fromUser harus PIC aset yang dipilih
- [ ] Per item note support

### T2-17: Handover Execution [P0, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Setelah approved → execute handover:
  - Asset currentUserId → toUserId
  - StockMovement type: `HANDOVER`
  - ActivityLog: from, to, witness, timestamp
- [ ] Dual ownership update: fromUser lost custody, toUser gained custody
- [ ] Bulk handover (multiple assets) dalam 1 transaksi DB

### T2-18: FIFO Recommendation untuk Handover [P2, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Saat memilih aset untuk handover, recommend oldest stock first (FIFO)
- [ ] Sorting by registration date ascending
- [ ] Optional — user bisa override recommendation

---

## Module 6: Lapor Rusak / Repair (T2-19 s/d T2-21)

### T2-19: Create Repair Report [P0, M]

**Agent**: Backend + Frontend  
**File**: `modules/transactions/repairs/`, `features/transactions/pages/repairs/`

**Acceptance Criteria**:

- [ ] Form: assetId, issueDescription, condition assessment
- [ ] Validasi: pelapor = PIC aset ATAU Admin Logistik / Superadmin
- [ ] Auto-generate docNumber: `RP-YYYY-MMDD-XXXX`
- [ ] Asset status → `UNDER_REPAIR`
- [ ] StockMovement type: `REPAIR`
- [ ] Approval chain auto-determined

### T2-20: Repair Tracking [P1, M]

**Agent**: Backend + Frontend

**Acceptance Criteria**:

- [ ] Track: repairAction, repairVendor, repairCost, startedAt, completedAt
- [ ] Status flow: PENDING → APPROVED → IN_PROGRESS → COMPLETED
- [ ] Saat completed: asset condition update + status review
  - If repaired: status → IN_STORAGE, condition → GOOD/USED_OKAY
  - If cannot repair: status → DECOMMISSIONED

### T2-21: Lapor Aset Hilang (LOST) [P0, M]

**Agent**: Backend + Frontend

**Acceptance Criteria** (PRD §6.1 "Lapor Aset Hilang"):

- [ ] Fitur lapor hilang via form repair dengan kategori `LOST`
- [ ] Validasi: pelapor = PIC terakhir aset
- [ ] Asset status langsung → `LOST` (bypass approval)
- [ ] Notification eskalasi instan ke SA & AL
- [ ] Investigasi flow:
  - Ditemukan → status dikembalikan ke status semula
  - Tidak ditemukan → status `DECOMMISSIONED` + dicatat sebagai kerugian
- [ ] Audit trail lengkap: pelapor, investigator, timestamp, catatan

---

## Definition of Done (Sprint 2)

- [ ] Approval engine dynamic chain berfungsi untuk semua workflow (WF1, WF2, WF3)
- [ ] Creator ≠ Approver enforced
- [ ] Request Pengadaan: full flow PENDING → COMPLETED termasuk per-item approval
- [ ] Loan: create → approve → assign assets → active
- [ ] Return: create → approve → condition assessment → asset released
- [ ] Handover: create → approve → ownership transfer
- [ ] Repair: create → approve → track → complete
- [ ] Lapor Hilang: report → status LOST → investigasi → resolusi
- [ ] StockMovement tercatat di setiap transaksi
- [ ] Notification dikirim di setiap status change
- [ ] Approval Timeline UI menampilkan progress di semua detail pages
- [ ] Optimistic Concurrency (version field) mencegah race condition
- [ ] Quality Gate: 0 lint error, 0 typecheck error
