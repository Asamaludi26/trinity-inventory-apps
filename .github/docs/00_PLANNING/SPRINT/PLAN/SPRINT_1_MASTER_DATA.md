# Sprint 1 — Master Data (Aset, Stok, Pembelian, Depresiasi)

| Metadata      | Detail                                                                    |
| ------------- | ------------------------------------------------------------------------- |
| **Status**    | 📋 PLANNED                                                                |
| **Fokus**     | Kategori hirarki, pencatatan aset, stok management, pembelian, depresiasi |
| **Referensi** | PRD §5.1 B-C, ASSET_LIFECYCLE.md, CATEGORY_HIERARCHY.md, SDD §2.2         |
| **Dependen**  | Sprint 0 (Auth, Schema, Layout)                                           |

---

## Scope

Semua fitur Master Data harus **tuntas dan tervalidasi** di sprint ini:

1. Kategori → Tipe → Model (hirarki 3 level)
2. Pencatatan Aset (CRUD + batch registration)
3. Asset Status State Machine (enforce valid transitions)
4. Stok Management (gudang utama, divisi, pribadi, threshold)
5. Stock Movement Tracking
6. Material Classification (INDIVIDUAL vs COUNT vs MEASUREMENT)
7. FIFO Material Consumption
8. Data Pembelian
9. Depresiasi Aset

---

## Module 1: Kategori Hirarki (T1-01 s/d T1-03)

### T1-01: Validasi CRUD Kategori/Tipe/Model [P0, M]

**Agent**: Backend + Frontend  
**File Backend**: `modules/assets/categories/`, `modules/assets/types/`, `modules/assets/models/`  
**File Frontend**: `features/assets/pages/categories/`, `types/`, `models/`

**Acceptance Criteria**:

- [ ] CRUD AssetCategory berfungsi (create, read, update, soft-delete)
- [ ] CRUD AssetType berfungsi (linked to category)
- [ ] CRUD AssetModel berfungsi (linked to type, includes brand)
- [ ] Frontend: form validation Zod schema
- [ ] Backend: DTO validation class-validator
- [ ] RBAC: hanya SUPERADMIN & ADMIN_LOGISTIK

**Logika Referensi (CATEGORY_HIERARCHY.md):**

```
AssetCategory (level 1)
  └── AssetType (level 2)
       └── AssetModel (level 3) — includes brand, classification
            └── PurchaseMasterData (optional, 1:1 per model)
                 └── Depreciation (optional, 1:1 per purchase)
```

### T1-02: Cascade Protection [P0, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Tidak bisa delete AssetCategory jika masih ada AssetType children
- [ ] Tidak bisa delete AssetType jika masih ada AssetModel children
- [ ] Tidak bisa delete AssetModel jika masih ada Asset instances
- [ ] Error message jelas: "Tidak dapat menghapus — masih memiliki X child records"
- [ ] HTTP 422 (Unprocessable Entity) untuk cascade violation

**Logika:**

```typescript
// Sebelum delete category
const typeCount = await prisma.assetType.count({ where: { categoryId } });
if (typeCount > 0)
  throw new UnprocessableEntityException(
    `Kategori masih memiliki ${typeCount} tipe aset. Hapus tipe terlebih dahulu.`,
  );
```

### T1-03: Kategori UI Polish [P1, S]

**Agent**: Frontend  
**Acceptance Criteria**:

- [ ] Tab view: Kategori | Tipe | Model di satu halaman
- [ ] Filter & search berfungsi
- [ ] Breadcrumb navigasi: Kategori > Tipe > Model
- [ ] Empty state saat tidak ada data
- [ ] Responsive layout (desktop table + mobile card)

---

## Module 2: Pencatatan Aset (T1-04 s/d T1-08)

### T1-04: Asset CRUD & Batch Registration [P0, L]

**Agent**: Backend + Frontend  
**File**: `modules/assets/asset.controller.ts`, `asset.service.ts`  
**File FE**: `features/assets/pages/list/`, `features/assets/components/`

**Acceptance Criteria**:

- [ ] Create single asset berfungsi
- [ ] Batch registration (1 dokumen = banyak aset) berfungsi
- [ ] Auto-generate Asset ID: `AS-YYYY-MMDD-XXXX` dengan collision detection
- [ ] Auto-generate Registration doc number: `REG-YYYY-MM-XXXX`
- [ ] Serial number unique validation (jika diisi)
- [ ] Link ke AssetModel (category/type/model auto-populate)
- [ ] Default status: `IN_STORAGE`, condition sesuai input
- [ ] StockMovement record created (type: `NEW_STOCK`)
- [ ] ActivityLog created
- [ ] SSE event emitted

**Logika ID Generation (ASSET_LIFECYCLE.md §12):**

```typescript
// Format: AS-YYYY-MMDD-XXXX (contoh: AS-2026-0414-0001)
// Collision-safe: retry loop jika ID sudah ada
async function generateAssetId(): Promise<string> {
  const today = format(new Date(), 'yyyy-MMdd');
  const prefix = `AS-${today}-`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const lastAsset = await prisma.asset.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = lastAsset ? parseInt(lastAsset.code.slice(-4)) + 1 : 1;
    const code = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const exists = await prisma.asset.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new ConflictException('Gagal generate ID unik setelah 5 percobaan');
}
```

### T1-05: Asset Status State Machine [P0, M]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Valid transitions di-enforce di service layer
- [ ] Invalid transition → HTTP 422 dengan pesan jelas
- [ ] Terminal states (`CONSUMED`, `DECOMMISSIONED`) tidak bisa transisi keluar

**Valid Transitions (ASSET_LIFECYCLE.md §2.2):**

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

function validateStatusTransition(from: AssetStatus, to: AssetStatus): void {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new UnprocessableEntityException(`Transisi status tidak valid: ${from} → ${to}`);
  }
}
```

### T1-06: Asset Classification (INDIVIDUAL vs BULK) [P0, M]

**Agent**: Backend + Frontend  
**Acceptance Criteria**:

- [ ] AssetModel memiliki field `classification` (ASSET / MATERIAL)
- [ ] AssetModel MATERIAL memiliki `trackingMethod` (COUNT / MEASUREMENT)
- [ ] Asset INDIVIDUAL: tracking per unit (serial number required)
- [ ] Asset COUNT: tracking per quantity (integer)
- [ ] Asset MEASUREMENT: tracking per balance (decimal, e.g., meter kabel)
- [ ] Frontend form menyesuaikan field berdasarkan classification

**Logika (ASSET_LIFECYCLE.md §1):**

```
ASSET (classification: ASSET)
  → trackingMethod: INDIVIDUAL
  → Setiap unit punya serial number / MAC address
  → Stok = COUNT unit dengan status IN_STORAGE

MATERIAL (classification: MATERIAL)
  → trackingMethod: COUNT
    → Stok = SUM quantity dari unit status IN_STORAGE
  → trackingMethod: MEASUREMENT
    → Stok = SUM currentBalance dari unit status IN_STORAGE
    → Support split (potong kabel → child asset)
```

### T1-07: Stok View per Perspektif [P0, M]

**Agent**: Backend + Frontend  
**File**: `features/assets/pages/stock/StockPage.tsx`

**Acceptance Criteria**:

- [ ] Stok Gudang Utama: agregasi semua aset IN_STORAGE grouped by model
- [ ] Stok Divisi: aset IN_USE atau IN_CUSTODY yang di-assign ke user divisi tertentu
- [ ] Stok Pribadi: aset yang currentUserId = logged-in user
- [ ] RBAC:
  - SA & AL: lihat semua perspektif
  - AP: hanya gudang utama
  - Leader: gudang utama + divisinya
  - Staff: hanya stok pribadi
- [ ] Display: quantity available, threshold indicator (merah jika < min)

**Query Logic:**

```sql
-- Stok Gudang Utama (per model)
SELECT m.name, m.brand,
  COUNT(CASE WHEN a.status = 'IN_STORAGE' AND a.classification = 'ASSET' THEN 1 END) as qty_individual,
  SUM(CASE WHEN a.status = 'IN_STORAGE' AND a.trackingMethod = 'COUNT' THEN a.quantity END) as qty_count,
  SUM(CASE WHEN a.status = 'IN_STORAGE' AND a.trackingMethod = 'MEASUREMENT' THEN a.currentBalance END) as qty_measurement
FROM asset_model m LEFT JOIN asset a ON a.modelId = m.id
GROUP BY m.id

-- Stok Divisi (aset di-assign ke user divisi X)
SELECT ... FROM asset a
JOIN "user" u ON u.id = a.currentUserId
WHERE u.divisionId = :divisionId AND a.status IN ('IN_USE', 'IN_CUSTODY')
```

### T1-08: Stock Threshold & Alert [P0, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] CRUD StockThreshold per AssetModel
- [ ] Set minQuantity per model
- [ ] Check threshold saat stock berubah (create, consumption, transfer)
- [ ] Jika stock < threshold → create Notification untuk SA & AL
- [ ] Threshold check via StockMovement event (bukan polling)
- [ ] Dashboard stock alert widget menampilkan model yang low stock

**Logika:**

```typescript
async function checkThreshold(modelId: number): Promise<void> {
  const threshold = await prisma.stockThreshold.findUnique({ where: { modelId } });
  if (!threshold) return;

  const currentStock = await calculateStock(modelId); // aggregate query
  if (currentStock < threshold.minQuantity) {
    await notificationService.createAlert({
      type: 'LOW_STOCK',
      title: `Stok ${model.name} di bawah batas minimum`,
      message: `Stok saat ini: ${currentStock}, minimum: ${threshold.minQuantity}`,
      targetRoles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
    });
  }
}
```

---

## Module 3: Stock Movement & FIFO (T1-09 s/d T1-11)

### T1-09: Stock Movement Tracking [P0, M]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Setiap perubahan stok WAJIB create StockMovement record
- [ ] Movement types:
  - `NEW_STOCK` — registrasi aset baru
  - `HANDOVER` — serah terima
  - `LOAN_OUT` / `LOAN_RETURN` — pinjam/kembali
  - `INSTALLATION` — instalasi ke pelanggan
  - `MAINTENANCE` — material dipakai maintenance
  - `DISMANTLE_RETURN` — aset kembali dari dismantle
  - `REPAIR` — masuk/keluar perbaikan
  - `ADJUSTMENT` — koreksi manual
  - `CONSUMED` — material habis
- [ ] StockMovement mencatat: assetId, type, quantity, reference (docNumber), note, userId, timestamp
- [ ] Stock Movement view di UI (timeline per aset)

### T1-10: FIFO Material Consumption [P0, L]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Saat material dikonsumsi (instalasi/maintenance), gunakan FIFO
- [ ] FIFO = consume dari batch registrasi paling lama (oldest first by createdAt)
- [ ] COUNT material: kurangi quantity, jika qty = 0 → status `CONSUMED`
- [ ] MEASUREMENT material: kurangi currentBalance, jika balance = 0 → status `CONSUMED`
- [ ] Partial consumption: jika 1 batch tidak cukup, lanjut ke batch berikutnya
- [ ] Create StockMovement per consumption
- [ ] Atomic transaction (semua atau tidak sama sekali)

**Logika (ASSET_LIFECYCLE.md §6):**

```typescript
async function consumeMaterial(
  modelId: number,
  quantityNeeded: number,
  reference: string, // docNumber dari instalasi/maintenance
  tx: PrismaClient,
): Promise<void> {
  let remaining = quantityNeeded;

  // FIFO: oldest first
  const availableStock = await tx.asset.findMany({
    where: { modelId, status: 'IN_STORAGE' },
    orderBy: { createdAt: 'asc' },
  });

  for (const asset of availableStock) {
    if (remaining <= 0) break;

    const available =
      asset.trackingMethod === 'MEASUREMENT' ? asset.currentBalance : asset.quantity;

    const consumed = Math.min(available, remaining);
    remaining -= consumed;

    const newBalance = available - consumed;

    await tx.asset.update({
      where: { id: asset.id },
      data: {
        ...(asset.trackingMethod === 'MEASUREMENT'
          ? { currentBalance: newBalance }
          : { quantity: newBalance }),
        status: newBalance === 0 ? 'CONSUMED' : 'IN_STORAGE',
      },
    });

    await tx.stockMovement.create({
      data: {
        assetId: asset.id,
        type: 'INSTALLATION', // or MAINTENANCE
        quantity: -consumed,
        reference,
        note: `FIFO consumption: ${consumed} dari batch ${asset.code}`,
      },
    });
  }

  if (remaining > 0) {
    throw new BadRequestException(`Stok tidak mencukupi. Masih kurang ${remaining} unit.`);
  }
}
```

### T1-11: Unit Conversion [P1, M]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] AssetModel support `capacityPerContainer` field (e.g., 1 roll = 305 meter)
- [ ] Saat consumption, input bisa dalam container unit (roll) → convert ke base unit (meter)
- [ ] Formula: `consumedBaseUnit = inputQty × capacityPerContainer`
- [ ] Jika capacityPerContainer = null, input = base unit langsung

---

## Module 4: Pembelian & Depresiasi (T1-12 s/d T1-14)

### T1-12: CRUD Data Pembelian [P1, M]

**Agent**: Backend + Frontend  
**File**: `modules/assets/purchases/`, `features/assets/pages/purchases/`

**Acceptance Criteria**:

- [ ] CRUD PurchaseMasterData berfungsi (linked to AssetModel)
- [ ] Fields: supplier, unitPrice, quantity, totalPrice, purchaseDate, warrantyMonths, invoiceNumber
- [ ] RBAC: hanya SUPERADMIN & ADMIN_PURCHASE
- [ ] Validasi: 1 PurchaseMasterData per AssetModel
- [ ] Auto-calculate totalPrice = unitPrice × quantity
- [ ] Form UI dengan validation

### T1-13: Depresiasi — Straight Line [P1, M]

**Agent**: Backend + Frontend  
**File**: `modules/assets/depreciation/`

**Acceptance Criteria**:

- [ ] CRUD Depreciation berfungsi (linked to PurchaseMasterData)
- [ ] Straight-Line formula:
  ```
  annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears
  monthlyDepreciation = annualDepreciation / 12
  currentBookValue = purchasePrice - (monthlyDepreciation × elapsedMonths)
  ```
- [ ] Diminishing Value formula:
  ```
  rate = 1 - (salvageValue / purchasePrice) ^ (1 / usefulLifeYears)
  yearlyDepreciation = currentBookValue × rate
  ```
- [ ] Detail page menampilkan schedule depresiasi (tabel per bulan/tahun)
- [ ] Book value tidak boleh < salvage value

### T1-14: Integrasi Pembelian → Asset Registration [P1, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Saat registrasi aset pilih model yang punya PurchaseMasterData → auto-fill price/vendor
- [ ] Link Depreciation ke asset context

---

## Definition of Done (Sprint 1)

- [ ] Hirarki Kategori/Tipe/Model CRUD + cascade protection tuntas
- [ ] Pencatatan Aset (single + batch) berfungsi end-to-end
- [ ] Asset Status State Machine di-enforce di backend
- [ ] Classification INDIVIDUAL/COUNT/MEASUREMENT berfungsi
- [ ] Stok view per perspektif (gudang utama/divisi/pribadi) akurat
- [ ] Stock Threshold alert trigger notification
- [ ] Stock Movement tercatat di setiap perubahan stok
- [ ] FIFO Material Consumption tervalidasi
- [ ] Pembelian & Depresiasi CRUD + formula berfungsi
- [ ] Quality Gate: 0 lint error, 0 typecheck error
- [ ] Semua endpoint tested minimal smoke test
