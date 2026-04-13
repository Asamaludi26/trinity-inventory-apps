# Sprint 5 — Stabilization, Security Audit, Performance, UAT

| Metadata      | Detail                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| **Status**    | 📋 PLANNED                                                             |
| **Fokus**     | Bug fixing, security audit, performance, integration testing, UAT prep |
| **Referensi** | PRD §8, §9, §10, OWASP Top 10, SDD §8                                  |
| **Dependen**  | Sprint 0-4 (semua fitur harus selesai)                                 |

---

## Scope

Sprint ini adalah **stabilisasi akhir** sebelum UAT dan Go-Live:

1. End-to-end integration testing
2. Bug fixing & edge case handling
3. Security audit (OWASP Top 10)
4. Performance optimization
5. Data consistency verification
6. Cross-browser & responsive testing
7. UAT environment preparation

---

## Phase 1: Integration Testing (T5-01 s/d T5-04)

### T5-01: End-to-End Flow Testing — Asset Lifecycle [P0, L]

**Agent**: Backend + Frontend

**Test Scenarios:**

- [ ] Register asset baru → verify stok bertambah → verify StockMovement created
- [ ] Handover asset → verify currentUserId changed → verify stok divisi berubah
- [ ] Loan asset → verify status IN_CUSTODY → return → verify status IN_STORAGE
- [ ] Report damaged → verify UNDER_REPAIR → complete repair → verify IN_STORAGE
- [ ] Report lost → verify LOST → investigasi → resolve (found/decommission)
- [ ] Asset soft-delete: verify aset dgn riwayat tidak bisa hard-delete
- [ ] Cascade protection: verify kategori/tipe/model dengan child tidak bisa delete

### T5-02: End-to-End Flow Testing — Transaction Lifecycle [P0, L]

**Agent**: Backend + Frontend

**Test Scenarios:**

- [ ] Request: Staff create → Leader approve → AL approve → AP approve → SA approve → execute → register asset
- [ ] Request: reject at step 2 → verify REJECTED + notification to creator
- [ ] Request: per-item PARTIAL approval → verify approvedQuantity tracked
- [ ] Loan: create → approve → assign assets → execute → overdue check → return → complete
- [ ] Handover: create → approve → execute → verify ownership transfer
- [ ] Repair: create → approve → repair → complete → verify asset status

**Cross-Role Testing (setiap role):**

```
Superadmin  → buat request → chain: AL → AP → execute
Admin Logistik → buat request → chain: AP → SA → execute
Admin Purchase → buat request → chain: AL → SA → execute
Leader      → buat request → chain: AL → AP → SA → execute
Staff       → buat request → chain: Leader → AL → AP → SA → execute
```

### T5-03: End-to-End Flow Testing — Customer Operations [P0, L]

**Agent**: Backend + Frontend

**Test Scenarios**:

- [ ] Create customer (INACTIVE) → install asset → verify ACTIVE
- [ ] Installation: individual asset + material FIFO → verify stok berkurang
- [ ] Installation: unit conversion (roll → meter) → verify calculation
- [ ] Maintenance: replacement → verify old asset returned, new asset assigned
- [ ] Maintenance: material usage → verify FIFO consumption
- [ ] Dismantle: all assets → verify customer INACTIVE
- [ ] Dismantle: condition mapping → verify asset status sesuai
- [ ] Delete customer dgn riwayat → verify 422 error

### T5-04: Data Consistency Verification [P0, L]

**Agent**: Database + Backend

**Verification Queries:**

```sql
-- 1. Stok calculated vs actual
-- Verify: SUM(StockMovement quantities) per asset = current asset quantity/balance
SELECT a.id, a.code, a.quantity,
  (SELECT SUM(sm.quantity) FROM stock_movement sm WHERE sm.assetId = a.id) as calculated_qty
FROM asset a
WHERE a.quantity != (SELECT COALESCE(SUM(sm.quantity),0) FROM stock_movement sm WHERE sm.assetId = a.id);

-- 2. Asset status vs transactions
-- Verify: asset IN_CUSTODY harus punya active loan
SELECT a.id FROM asset a
WHERE a.status = 'IN_CUSTODY'
AND NOT EXISTS (SELECT 1 FROM loan_asset_assignment la
  JOIN loan_request lr ON lr.id = la.loanRequestId
  WHERE la.assetId = a.id AND lr.status IN ('ACTIVE','APPROVED'));

-- 3. Customer status consistency
-- Verify: ACTIVE customer harus punya minimal 1 aset IN_USE
SELECT c.id FROM customer c
WHERE c.status = 'ACTIVE'
AND NOT EXISTS (
  SELECT 1 FROM installation i
  JOIN installation_material im ON im.installationId = i.id
  WHERE i.customerId = c.id -- verify actual assets still IN_USE
);

-- 4. Approval chain integrity
-- Verify: no transaction where creator = approver
SELECT r.id, r.code FROM request r
WHERE r.requesterId IN (
  -- extract approver IDs from JSON approval chain
);

-- 5. Stock Movement completeness
-- Verify: every asset status change has a corresponding StockMovement
SELECT a.id FROM asset a
LEFT JOIN stock_movement sm ON sm.assetId = a.id
WHERE sm.id IS NULL AND a.status != 'IN_STORAGE';
```

---

## Phase 2: Bug Fixing & Edge Cases (T5-05 s/d T5-08)

### T5-05: Optimistic Concurrency Control [P0, M]

**Agent**: Backend

**Acceptance Criteria**:

- [ ] Semua entity transaksional punya `version` field (OCC)
- [ ] Update menyertakan `WHERE version = currentVersion`
- [ ] Jika version mismatch → HTTP 409 Conflict
- [ ] Frontend handle 409: show "Data sudah berubah, refresh dan coba lagi"
- [ ] Applied to: Request, LoanRequest, AssetReturn, Handover, Repair, InfraProject, Asset

### T5-06: Edge Case — Concurrent Operations [P0, M]

**Agent**: Backend

**Test Cases**:

- [ ] 2 user approve request yang sama secara bersamaan → hanya 1 berhasil
- [ ] 2 user assign asset yang sama ke loan berbeda → hanya 1 berhasil
- [ ] FIFO consumption saat concurrent installation → quantity tidak over-consumed
- [ ] Handover asset yang sedang dalam process return → reject

### T5-07: Edge Case — Data Boundary [P1, M]

**Agent**: Backend

**Test Cases**:

- [ ] Request dengan 50 items (max) → verify performance
- [ ] Asset dengan nama sangat panjang (255 char)
- [ ] Serial number edge cases (special characters, unicode)
- [ ] Date edge cases (timezone, midnight, February 29)
- [ ] Numeric edge cases (0, negative, decimal precision)
- [ ] Empty arrays/strings validation
- [ ] Pagination: page 0, negative page, page beyond total

### T5-08: Bug Fix — Known Issues Resolution [P0, L]

**Agent**: All  
**Process**:

1. Run semua tests (backend + frontend)
2. Compile list semua failures
3. Triage: Critical > High > Medium > Low
4. Fix per priority
5. Re-run tests → 100% pass

---

## Phase 3: Security Audit (T5-09 s/d T5-14)

### T5-09: OWASP A01 — Broken Access Control [P0, M]

**Agent**: Security + Backend

**Checklist**:

- [ ] Setiap endpoint punya RBAC guard (`@Roles()`)
- [ ] Division scoping enforced (Leader/Staff hanya lihat divisi sendiri)
- [ ] Object-level authorization: user hanya bisa update/delete data miliknya
- [ ] No IDOR vulnerability: cannot access other user's data by changing UUID
- [ ] File upload: user hanya bisa akses file yang diizinkan
- [ ] API rate limiting di semua public endpoints

### T5-10: OWASP A02 — Cryptographic Failures [P0, S]

**Agent**: Security

**Checklist**:

- [ ] Password hashing: bcrypt cost ≥ 12
- [ ] JWT secret: minimum 256-bit
- [ ] Refresh token: httpOnly cookie dengan secure flag
- [ ] HTTPS enforced (production)
- [ ] No sensitive data in JWT payload (no password, no internal IDs)
- [ ] Sensitive data encrypted at rest (jika applicable)

### T5-11: OWASP A03 — Injection [P0, M]

**Agent**: Security + Backend

**Checklist**:

- [ ] All database queries via Prisma (parameterized by default)
- [ ] No raw SQL tanpa parameterized queries
- [ ] Input sanitization di semua DTO (class-validator)
- [ ] XSS prevention: output encoding, CSP headers
- [ ] File upload: validate file type, size, content-type
- [ ] No command injection via file names or user input

### T5-12: OWASP A07 — Authentication Failures [P0, M]

**Agent**: Security + Backend

**Checklist**:

- [ ] Rate limiting pada login (5 req/min per IP)
- [ ] Account lockout setelah 5 failed attempts (configurable)
- [ ] Refresh token rotation (reuse detection)
- [ ] Password strength validation (min 8 chars, uppercase, lowercase, number)
- [ ] Token expiration: access 15min, refresh 7days
- [ ] Logout invalidates semua token (tokenVersion increment)

### T5-13: Security Headers [P1, S]

**Agent**: Backend + DevOps

**Checklist**:

- [ ] Helmet.js configured:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security
  - X-XSS-Protection
- [ ] CORS: restrict ke frontend domain only (production)
- [ ] Cookie flags: httpOnly, secure, sameSite

### T5-14: Dependency Audit [P1, S]

**Agent**: DevOps

**Checklist**:

- [ ] `npm audit` / `pnpm audit` → 0 critical/high vulnerabilities
- [ ] Dependabot enabled di GitHub
- [ ] No outdated packages dengan known CVE
- [ ] Lock file committed (pnpm-lock.yaml)

---

## Phase 4: Performance Optimization (T5-15 s/d T5-18)

### T5-15: Database Performance [P1, M]

**Agent**: Database

**Checklist**:

- [ ] Indexes pada field yang sering di-WHERE/ORDER BY:
  - asset: code, status, modelId, currentUserId, createdAt
  - request: status, requesterId, createdAt
  - customer: status, code
  - activity_log: entityType, entityId, createdAt
- [ ] N+1 query audit: semua service pakai `include`/`select` yang tepat
- [ ] Pagination di semua list queries (default limit 20, max 100)
- [ ] Stock query optimization (avoid per-request full table scan)

### T5-16: API Performance [P1, M]

**Agent**: Backend

**Checklist**:

- [ ] Response time target: p95 < 2 detik
- [ ] Heavy aggregation queries (dashboard) cached atau optimized
- [ ] File upload: streaming (tidak buffer entire file di memory)
- [ ] Pagination: cursor-based untuk dataset besar (>10K rows)
- [ ] Connection pooling configured (Prisma default pool)

### T5-17: Frontend Performance [P1, M]

**Agent**: Frontend

**Checklist**:

- [ ] Lazy loading per route (React.lazy + Suspense)
- [ ] Heavy components lazy-loaded (modal, charts, editors)
- [ ] TanStack Query cache: appropriate staleTime (30s default)
- [ ] Image optimization: lazy loading, appropriate sizes
- [ ] Bundle size audit: no unnecessary dependencies
- [ ] Debounced search/filter inputs (300ms)
- [ ] Virtual scrolling untuk list > 100 items (jika applicable)

### T5-18: Responsive & Cross-Browser Testing [P1, M]

**Agent**: Frontend

**Checklist**:

- [ ] Breakpoints: 360px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)
- [ ] All pages functional di Chrome, Firefox, Edge, Safari
- [ ] Touch-friendly: min 44x44px tap targets
- [ ] No horizontal scroll di mobile
- [ ] Forms usable di mobile keyboard
- [ ] Dashboard charts responsive

---

## Phase 5: UAT Preparation (T5-19 s/d T5-22)

### T5-19: UAT Seed Data [P0, M]

**Agent**: Database

**Acceptance Criteria**:

- [ ] Seed script creates realistic test data:
  - 1 Superadmin, 2 Admin Logistik, 2 Admin Purchase, 3 Leader, 10 Staff
  - 5 divisions
  - 10 categories, 20 types, 50 models
  - 100+ assets (mix individual + material)
  - 20+ transactions (variety of statuses)
  - 10+ customers with installation/maintenance history
  - 3+ projects
- [ ] Seed idempotent (safe to re-run)

### T5-20: UAT Test Accounts [P0, S]

**Agent**: Database

**Acceptance Criteria**:

- [ ] Test accounts per role:
  ```
  superadmin@test.com    / TestPassword123!  (Superadmin)
  logistik@test.com      / TestPassword123!  (Admin Logistik)
  purchase@test.com      / TestPassword123!  (Admin Purchase)
  leader@test.com        / TestPassword123!  (Leader)
  staff1@test.com        / TestPassword123!  (Staff)
  staff2@test.com        / TestPassword123!  (Staff)
  ```
- [ ] Accounts seeded automatically

### T5-21: UAT Environment Deploy [P0, M]

**Agent**: DevOps

**Acceptance Criteria**:

- [ ] Docker Compose staging environment running
- [ ] Database migrated & seeded
- [ ] Frontend accessible via browser
- [ ] Backend API health check passing
- [ ] File upload storage configured
- [ ] Environment variables set (production-like)

### T5-22: UAT Checklist Document [P0, M]

**Agent**: Documentation

**Acceptance Criteria**:

- [ ] Test scenario document per module (from W3 updated)
- [ ] Each scenario: description, steps, expected result, actual result, pass/fail
- [ ] Prioritized: CRITICAL → HIGH → MEDIUM
- [ ] Tester assignment per module
- [ ] Sign-off sheet per module
- [ ] GO/NO-GO criteria defined

---

## Definition of Done (Sprint 5)

- [ ] All end-to-end flows tested (asset lifecycle, transactions, customers)
- [ ] Data consistency verified (stok, status, approval chain)
- [ ] 0 Critical / 0 High bugs remaining
- [ ] OWASP Top 10 checklist passed (0 critical vulnerabilities)
- [ ] API response p95 < 2 seconds
- [ ] All pages responsive (360px → 1440px)
- [ ] Cross-browser verified (Chrome, Firefox, Edge, Safari)
- [ ] UAT environment deployed & accessible
- [ ] UAT seed data loaded
- [ ] UAT test checklist document ready
- [ ] Quality Gate: 0 lint error, 0 typecheck error
- [ ] All tests passing: backend 100%, frontend 100%

---

## Go-Live Criteria (PRD §10.2)

Sistem dianggap layak Go-Live jika SEMUA terpenuhi:

1. ✅ Seluruh fitur MVP berfungsi dan lolos UAT
2. ✅ 0 bug Critical/High yang belum terselesaikan
3. ✅ Audit keamanan OWASP Top 10 lulus
4. ✅ Backup & recovery tested
5. ✅ User training dilaksanakan
6. ✅ API docs (Swagger) lengkap
7. ✅ Sign-off tertulis dari klien
