# Sprint 0 — Foundation (Auth, Schema, Layout, Guards)

| Metadata      | Detail                                                         |
| ------------- | -------------------------------------------------------------- |
| **Status**    | ✅ SEBAGIAN BESAR SELESAI (W1–W5)                              |
| **Fokus**     | Validasi fondasi yang sudah dibangun, patch gap yang ditemukan |
| **Referensi** | PRD v3.1 §4-7, SDD v3.1 §1-3, CONVENTIONS.md                   |

---

## Scope

Sprint ini mencakup validasi dan penyelesaian fondasi teknis:

1. ✅ Project structure (monorepo, Docker, configs)
2. ✅ Prisma schema & migrations (35+ models)
3. ✅ Auth module (login, JWT, refresh token, RBAC guards)
4. ✅ Base components (layout, sidebar, form wrappers, table)
5. ⚠️ **Perlu Validasi**: Guards, interceptors, error handling
6. ⚠️ **Perlu Validasi**: Response format consistency

---

## Task Checklist

### T0-01: Validasi Auth Flow [P0, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Login → JWT access token + refresh token berfungsi
- [ ] Refresh token rotation berfungsi (old token invalidated)
- [ ] Logout invalidates token (tokenVersion increment)
- [ ] Must-change-password flow redirect ke `/auth/change-password`
- [ ] Rate limiting pada `/auth/login` (5 req/min) & `/auth/refresh` (10 req/min)
- [ ] Password hashing bcrypt cost ≥ 12

**Logika Referensi (PRD §6.1 Auth):**

```
1. User POST /auth/login → { email, password }
2. Backend validate credentials → bcrypt.compare
3. Generate accessToken (15min) + refreshToken (7day)
4. Set refreshToken di httpOnly cookie ATAU return di body
5. Frontend simpan accessToken di memory (Zustand), refreshToken di cookie
6. Axios interceptor: 401 → auto refresh → retry original request
7. Jika refresh gagal → redirect ke /login
```

---

### T0-02: Validasi RBAC Guards [P0, S]

**Agent**: Backend + Security  
**Acceptance Criteria**:

- [ ] `@Roles()` decorator + `RolesGuard` berfungsi di semua controller
- [ ] Setiap endpoint memiliki role restriction sesuai PRD §7.2
- [ ] Public routes (`@Public()`) hanya `/auth/login` dan `/auth/refresh`
- [ ] Division scoping: query data hanya dari divisi user (untuk Leader/Staff)

**Matriks Akses Referensi (PRD §7.2):**

```
| Modul                   | SA | AL | AP | Leader | Staff |
|-------------------------|----|----|----|---------| ------|
| Pencatatan Aset (CRUD)  | ✅ | ✅ | ❌ | ❌     | ❌    |
| Stok Aset (View All)    | ✅ | ✅ | ✅ | divisi  | pribadi|
| Data Pembelian          | ✅ | ❌ | ✅ | ❌     | ❌    |
| Semua Transaksi         | ✅ | ✅ | ✅ | ✅     | ✅    |
| Manajemen Pelanggan     | ✅ | ✅ | ❌ | divisi  | divisi |
| User & Divisi           | ✅ | ❌ | ❌ | ❌     | ❌    |
```

---

### T0-03: Validasi Response Format [P1, S]

**Agent**: Backend  
**Acceptance Criteria**:

- [ ] Semua response menggunakan `ResponseTransformInterceptor`
- [ ] Format: `{ success: boolean, data: T, message: string, meta?: { page, limit, total } }`
- [ ] Error format: `{ success: false, error: { code, message, details? } }`
- [ ] PrismaExceptionFilter menangkap semua Prisma error
- [ ] HttpExceptionFilter menangkap semua HTTP exception
- [ ] Tidak ada response yang membocorkan stack trace ke client

---

### T0-04: Validasi Base Layout & Components [P1, S]

**Agent**: Frontend  
**Acceptance Criteria**:

- [ ] Sidebar navigasi sesuai role (hide menu yang tidak diizinkan)
- [ ] Header menampilkan user info + notification bell
- [ ] PageContainer dengan breadcrumb konsisten
- [ ] Theme toggle (dark/light) berfungsi
- [ ] RoleProtectedRoute redirect ke 403/dashboard jika unauthorized
- [ ] AuthGuard redirect ke /login jika not authenticated

---

### T0-05: Validasi Prisma Schema Integrity [P0, M]

**Agent**: Database  
**Acceptance Criteria**:

- [ ] Semua relasi antar model konsisten (FK valid)
- [ ] Soft delete extension berfungsi (`isDeleted`, `deletedAt`)
- [ ] Indexes yang diperlukan sudah ada (search, filter fields)
- [ ] Enum values sesuai PRD (UserRole, AssetStatus, TransactionStatus, dll)
- [ ] Seed data: Superadmin user, default divisions
- [ ] Migration bisa di-run clean dari empty database

**Validasi Schema per Domain:**

```
auth.prisma    → User, Division, UserRole enum
asset.prisma   → AssetCategory, AssetType, AssetModel, Asset, AssetRegistration
purchase.prisma → PurchaseMasterData, Depreciation
transaction.prisma → Request, LoanRequest, AssetReturn, Handover, Repair + items
project.prisma  → InfraProject, Task, Material, TeamMember
customer.prisma → Customer, Installation, Maintenance, Dismantle + items
schema.prisma  → StockThreshold, StockMovement, Attachment, ActivityLog
```

---

## Definition of Done (Sprint 0)

- [ ] Auth login/logout/refresh flow berjalan end-to-end
- [ ] RBAC guards memblokir akses yang tidak diizinkan
- [ ] Response format konsisten di semua endpoint
- [ ] Prisma schema valid dan migration clean
- [ ] Base layout responsive dan navigasi sesuai role
- [ ] Quality Gate: 0 lint error, 0 typecheck error
