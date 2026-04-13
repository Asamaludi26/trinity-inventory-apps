# Sprint Plan — TrinityApps v1.0 Feature Completion

| Metadata      | Detail                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| **Versi**     | 1.0                                                                                                      |
| **Tanggal**   | 13 April 2026                                                                                            |
| **Go-Live**   | 1 Mei 2026                                                                                               |
| **Target**    | 100% coverage seluruh dokumentasi (SOP, User Flow, API, RBAC)                                            |
| **Referensi** | USER_MANUAL_SOP.md, USER_SYSTEM_FLOW.md, API_CONTRACT.md, SECURITY_AND_RBAC_MATRIX.md, ERROR_HANDLING.md |

---

## Ringkasan Analisis

### Status Saat Ini

| Area                          | Status             | Coverage |
| ----------------------------- | ------------------ | :------: |
| Database Schema               | ✅ Lengkap         |   100%   |
| Backend API (CRUD)            | ✅ Lengkap         |   95%    |
| Frontend Pages (CRUD)         | ✅ Lengkap         |   90%    |
| Auth & JWT Flow               | ✅ Lengkap         |   95%    |
| RBAC & Permissions            | ✅ Lengkap         |   90%    |
| Approval Workflow Engine      | ⚠️ Partial         |   75%    |
| Notification System (SSE/WS)  | ✅ Lengkap         |   95%    |
| Dashboard (Role-based)        | ✅ Lengkap         |   85%    |
| Export/Import                 | ⚠️ Partial         |   60%    |
| QR Code Integration           | ⚠️ Partial         |   50%    |
| Stock Management & Threshold  | ✅ Lengkap         |   90%    |
| Audit Trail/Activity Log      | ⚠️ Backend Only    |   60%    |
| Cron Jobs (Overdue, Reminder) | ✅ Lengkap         |   95%    |
| WhatsApp Integration          | ❌ Not Implemented |    0%    |

### Gap Analysis (Dokumentasi vs Implementasi)

Berikut gap yang ditemukan antara 4 dokumen referensi dan kode saat ini:

| #   | Gap                                                                                   | Sumber Dokumen                               | Severity    |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------- | ----------- |
| G1  | Approval workflow multi-layer belum sepenuhnya match approval chain per role (SOP-02) | USER_MANUAL_SOP §6.1.2, USER_SYSTEM_FLOW §9  | P0 CRITICAL |
| G2  | Partial approval (kuantitas disesuaikan) belum diverifikasi                           | USER_MANUAL_SOP §6.1.3                       | P0 CRITICAL |
| G3  | Loan asset assignment flow (Admin assign aset spesifik saat approve)                  | USER_MANUAL_SOP §6.2.2, USER_SYSTEM_FLOW §10 | P0 CRITICAL |
| G4  | Return flow with condition assessment & rejection/re-submit                           | USER_SYSTEM_FLOW §3.2                        | P0 CRITICAL |
| G5  | Stock movement tracking per setiap transaksi                                          | USER_SYSTEM_FLOW §4, §6.1-6.3                | P0 CRITICAL |
| G6  | Real-time notification via SSE/WebSocket                                              | USER_MANUAL_SOP §3.3, USER_SYSTEM_FLOW §9    | P1 HIGH     |
| G7  | Cron job overdue checker + reminder H-3 / H-1                                         | USER_SYSTEM_FLOW §3.3                        | P1 HIGH     |
| G8  | Dashboard data completeness per role sesuai SOP §4.1-4.5                              | USER_MANUAL_SOP §4                           | P1 HIGH     |
| G9  | QR code generation, print, dan scan integration                                       | USER_MANUAL_SOP §5.3, §6.5                   | P1 HIGH     |
| G10 | Export/Import Excel full integration                                                  | USER_MANUAL_SOP §SOP-06                      | P1 HIGH     |
| G11 | Stock threshold alerts & notification                                                 | USER_MANUAL_SOP §5.6                         | P1 HIGH     |
| G12 | Repair workflow chain (internal → service center → decommission)                      | USER_SYSTEM_FLOW §5, USER_MANUAL_SOP §6.4    | P1 HIGH     |
| G13 | Project lifecycle (DRAFT → PLANNING → APPROVED → IN_PROGRESS → COMPLETED)             | USER_SYSTEM_FLOW §14, USER_MANUAL_SOP §8     | P1 HIGH     |
| G14 | Installation/Maintenance/Dismantle material stock deduction                           | USER_SYSTEM_FLOW §6.1-6.3                    | P1 HIGH     |
| G15 | mustChangePassword enforcement pada login pertama                                     | USER_MANUAL_SOP §2.1, SECURITY_AND_RBAC §2.3 | P1 HIGH     |
| G16 | Audit trail UI (Activity Log page untuk Super Admin)                                  | SECURITY_AND_RBAC §3.3                       | P2 MEDIUM   |
| G17 | Global search / command palette (⌘+K / Ctrl+K)                                        | USER_MANUAL_SOP §3.4                         | P2 MEDIUM   |
| G18 | Breadcrumb navigation di header                                                       | USER_MANUAL_SOP §3.1                         | P2 MEDIUM   |
| G19 | Responsive: data table → card list pada layar kecil                                   | USER_MANUAL_SOP §FAQ                         | P2 MEDIUM   |
| G20 | WhatsApp notification integration                                                     | USER_SYSTEM_FLOW §9                          | P2 MEDIUM   |
| G21 | Bulk import aset (SOP-01 step 2)                                                      | USER_MANUAL_SOP §SOP-01                      | P2 MEDIUM   |
| G22 | Theme toggle (light/dark) persistence                                                 | USER_MANUAL_SOP §9.5                         | P2 LOW      |

---

## Sprint Breakdown

### SPRINT 1 — Core Transaction Workflows (P0 CRITICAL)

**Fokus**: Memastikan SEMUA alur transaksi inti bekerja sesuai dokumentasi, termasuk approval chain, partial approval, asset assignment, dan stock movement.

**Durasi**: Target 4-5 hari

| #   | Task                                                                                                                                                                                                                                      | Agent                  | Size | Dependency | Gap |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- | ---------- | --- |
| 1.1 | **Verifikasi & fix approval chain per role** — Pastikan `determineApprovalChain()` menghasilkan chain yang benar untuk SETIAP role creator, sesuai §6.1.2 (Staff→Leader→AL→AP→SA, Leader→AL→AP→SA, dst.)                                  | `backend`              | L    | -          | G1  |
| 1.2 | **Partial approval support** — Approver bisa menyesuaikan qty per item saat approve. Frontend harus ada field qty adjustment + alasan. Backend harus menyimpan `approvedQuantity` vs `requestedQuantity`                                  | `backend` + `frontend` | L    | 1.1        | G2  |
| 1.3 | **Loan: Admin assign aset spesifik** — Saat Admin Logistik approve pinjaman, dia harus bisa memilih aset fisik spesifik (by serial number) dari gudang. Frontend: picker aset dari available stock. Backend: create `LoanAssetAssignment` | `backend` + `frontend` | L    | -          | G3  |
| 1.4 | **Return flow: condition assessment + approval** — Peminjam ajukan return dgn kondisi per aset. Admin Logistik verifikasi & approve. Jika rusak, otomatis buat repair record. Update asset status accordingly                             | `backend` + `frontend` | L    | 1.3        | G4  |
| 1.5 | **Stock movement tracking** — Setiap transaksi (handover, loan, return, install, dismantle, maintenance) HARUS membuat `StockMovement` record. Verifikasi: IN_PURCHASE, OUT_USAGE, OUT_USAGE_CUSTODY, IN_RETURN, ADJUSTMENT, TRANSFER     | `backend`              | M    | -          | G5  |
| 1.6 | **Handover: stock & PIC update** — Saat handover disimpan, status aset dan `currentUserId` harus update. StockMovement type TRANSFER harus tercatat                                                                                       | `backend`              | M    | 1.5        | G5  |
| 1.7 | **Self-approval prevention** — User tidak boleh approve transaksi yang dia buat sendiri (error 422)                                                                                                                                       | `backend`              | S    | 1.1        | G1  |
| 1.8 | **Request post-approval execution flow** — Setelah semua approval, Admin Purchase isi detail pembelian → status PURCHASING → IN_DELIVERY → ARRIVED → Admin Logistik register aset → COMPLETED                                             | `backend` + `frontend` | L    | 1.1, 1.2   | G1  |

**Acceptance Criteria Sprint 1:**

- [ ] Approval chain menghasilkan urutan yang benar untuk SEMUA 5 role creator
- [ ] Partial approval bisa adjust qty per item
- [ ] Loan approve dengan asset assignment (pilih aset spesifik)
- [ ] Return flow: submit → verify → approve/reject
- [ ] SETIAP transaksi membuat StockMovement record
- [ ] Self-approval prevention 422 error
- [ ] Request lifecycle: PENDING → ... → COMPLETED
- [ ] Semua Quality Gate passed (lint + typecheck)

---

### SPRINT 2 — Notification, Overdue & Repair Workflow (P1 HIGH)

**Fokus**: Real-time notification, cron job untuk overdue/reminder, repair workflow lengkap, dan mustChangePassword.

**Durasi**: Target 3-4 hari

| #   | Task                                                                                                                                                                                                                       | Agent                  | Size | Dependency | Gap |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- | ---------- | --- |
| 2.1 | **Real-time notification via SSE** — EventsGateway mengirim notif ke user terkait saat: approval required, status change, overdue, stock alert. Frontend: SSE listener di layout, notification dropdown di header          | `backend` + `frontend` | XL   | Sprint 1   | G6  |
| 2.2 | **Notification UI** — Halaman notifikasi: list semua notif, mark as read, unread count badge di header bell icon                                                                                                           | `frontend`             | M    | 2.1        | G6  |
| 2.3 | **Cron job: Overdue checker** — Daily job check semua loan ON_LOAN dimana expectedReturnDate < today → set status OVERDUE, kirim notif ke peminjam + Leader + Admin Logistik                                               | `backend`              | M    | 2.1        | G7  |
| 2.4 | **Cron job: Return reminder** — H-3 dan H-1 sebelum expectedReturnDate, kirim reminder ke peminjam                                                                                                                         | `backend`              | S    | 2.1, 2.3   | G7  |
| 2.5 | **Repair workflow chain** — Lengkapi flow: UNDER_REPAIR → (perbaiki internal → IN_STORAGE) / (OUT_FOR_REPAIR → IN_STORAGE atau DECOMMISSIONED). Frontend: action buttons per status. Backend: status transition validation | `backend` + `frontend` | L    | Sprint 1   | G12 |
| 2.6 | **mustChangePassword enforcement** — Saat login, jika `mustChangePassword === true`, redirect ke change-password page. Block semua API kecuali change-password dan logout                                                  | `backend` + `frontend` | M    | -          | G15 |
| 2.7 | **Stock threshold alert** — Admin set threshold per model. Cron/trigger: saat stock berubah, cek threshold. Jika below → kirim notif ke Admin Logistik + Super Admin                                                       | `backend` + `frontend` | M    | 2.1        | G11 |

**Acceptance Criteria Sprint 2:**

- [x] Notifikasi real-time muncul di header saat ada approval request
- [x] Halaman notifikasi: list, read/unread, badge count
- [x] Loan overdue otomatis terdeteksi dan notif terkirim
- [x] Reminder H-3 dan H-1 berjalan otomatis
- [x] Repair: 3 jalur resolution (internal, service center, decommission)
- [x] Login pertama paksa ganti password
- [x] Stock threshold alert trigger notifikasi
- [x] Quality Gate passed

---

### SPRINT 3 — Project Lifecycle, Customer Operations & Dashboard (P1 HIGH)

**Fokus**: Project infrastructure lifecycle, instalasi/maintenance/dismantle material flow, dan dashboard data completeness.

**Durasi**: Target 3-4 hari

| #    | Task                                                                                                                                                                                                                       | Agent                  | Size | Dependency     | Gap |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- | -------------- | --- |
| 3.1  | **Project lifecycle** — Lengkapi state machine: DRAFT → PLANNING (submit) → APPROVED/REJECTED → IN_PROGRESS → ON_HOLD → COMPLETED/CANCELLED. Frontend: status transition buttons contextual. Backend: validate transitions | `backend` + `frontend` | L    | -              | G13 |
| 3.2  | **Project: task management** — CRUD task dalam project, assign ke team member, update progress, track completion                                                                                                           | `backend` + `frontend` | M    | 3.1            | G13 |
| 3.3  | **Installation: material stock deduction** — Saat instalasi COMPLETED, material yang terpakai harus mengurangi stok gudang otomatis. StockMovement OUT                                                                     | `backend`              | M    | Sprint 1 (1.5) | G14 |
| 3.4  | **Maintenance: replacement material** — Saat maintenance, material pengganti mengurangi stok. Record penggantian disimpan                                                                                                  | `backend`              | M    | 3.3            | G14 |
| 3.5  | **Dismantle: asset return to storage** — Saat dismantle COMPLETED, aset dikembalikan ke gudang (IN_STORAGE), kondisi sesuai field assessment. StockMovement IN                                                             | `backend`              | M    | Sprint 1 (1.5) | G14 |
| 3.6  | **Dashboard: Super Admin completeness** — Total aset, pending requests, active loans, under repair, stock alerts, tren 6 bulan, distribusi per kategori, aktivitas terbaru                                                 | `backend` + `frontend` | M    | Sprint 2 (2.7) | G8  |
| 3.7  | **Dashboard: Admin Logistik** — Stok kritis, pinjaman belum kembali, aset rusak, daily ops summary                                                                                                                         | `backend` + `frontend` | M    | 3.6            | G8  |
| 3.8  | **Dashboard: Admin Purchase** — Total pembelian, tren depresiasi, pengeluaran per kategori, pending purchase approvals                                                                                                     | `backend` + `frontend` | M    | 3.6            | G8  |
| 3.9  | **Dashboard: Leader** — Aset divisi, anggota tim + aset count, request pending dari tim                                                                                                                                    | `backend` + `frontend` | M    | 3.6            | G8  |
| 3.10 | **Dashboard: Staff** — Aset saya, pinjaman aktif, checklist pengembalian                                                                                                                                                   | `backend` + `frontend` | S    | 3.6            | G8  |

**Acceptance Criteria Sprint 3:**

- [ ] Project lifecycle state machine berfungsi lengkap
- [ ] Task CRUD dalam project berjalan
- [ ] Material di instalasi/maintenance mengurangi stok
- [ ] Dismantle mengembalikan aset ke gudang
- [ ] 5 dashboard variants menampilkan data sesuai SOP §4.1-4.5
- [ ] Quality Gate passed

---

### SPRINT 4 — QR Code, Export/Import & Audit Trail (P1-P2)

**Fokus**: QR code full integration, export/import Excel, audit trail UI.

**Durasi**: Target 2-3 hari

| #   | Task                                                                                                                                                         | Agent                  | Size | Dependency | Gap |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---- | ---------- | --- |
| 4.1 | **QR Code generation** — Setiap aset baru auto-generate QR code. QR data = asset code/UUID. Display di detail page. Print button                             | `backend` + `frontend` | M    | -          | G9  |
| 4.2 | **QR Code scan** — Tombol scan di list aset. Buka kamera → scan → redirect ke detail aset                                                                    | `frontend`             | M    | 4.1        | G9  |
| 4.3 | **Export: Assets to Excel** — Export daftar aset (filtered) ke format XLSX. Include: nama, kategori, status, kondisi, serial, brand                          | `backend` + `frontend` | M    | -          | G10 |
| 4.4 | **Export: Stok to Excel** — Export data stok untuk stock opname (SOP-06)                                                                                     | `backend` + `frontend` | S    | 4.3        | G10 |
| 4.5 | **Export: Transactions to Excel** — Export request, loan, handover, repair list                                                                              | `backend` + `frontend` | M    | 4.3        | G10 |
| 4.6 | **Import: Bulk asset import** — Upload XLSX → validate → preview → confirm → bulk create. Template download                                                  | `backend` + `frontend` | L    | -          | G21 |
| 4.7 | **Audit Trail UI** — Page `/settings/audit-log` (Super Admin only). Table: timestamp, user, action, entity, details. Filter by date range, user, entity type | `frontend`             | M    | -          | G16 |

**Acceptance Criteria Sprint 4:**

- [ ] QR code tampil di detail aset, bisa dicetak
- [ ] Scan QR dari HP/webcam redirect ke detail aset
- [ ] Export asset/stock/transaction ke XLSX berfungsi
- [ ] Bulk import aset dari XLSX dengan validasi
- [ ] Audit trail page menampilkan activity logs
- [ ] Quality Gate passed

---

### SPRINT 5 — UX Polish & Remaining Features (P2 MEDIUM-LOW)

**Fokus**: Global search, breadcrumb, responsive, theme persistence, WhatsApp integration placeholder.

**Durasi**: Target 2-3 hari

| #   | Task                                                                                                                                                                                         | Agent                  | Size | Dependency     | Gap |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- | -------------- | --- |
| 5.1 | **Global search / command palette** — Ctrl+K / ⌘+K membuka search dialog. Search: aset (nama, serial), nomor dokumen, halaman. Navigate ke result                                            | `frontend`             | M    | -              | G17 |
| 5.2 | **Breadcrumb navigation** — Dynamic breadcrumb di header berdasarkan current route. Setiap segment clickable                                                                                 | `frontend`             | S    | -              | G18 |
| 5.3 | **Responsive: table → card** — Pada viewport < 768px, DataTable otomatis switch ke card list view. Prioritize key columns                                                                    | `frontend`             | M    | -              | G19 |
| 5.4 | **Theme toggle persistence** — Dark/light mode preference disimpan di localStorage, persist across sessions                                                                                  | `frontend`             | S    | -              | G22 |
| 5.5 | **WhatsApp notification service** — Backend: WhatsApp service abstract class + implementation (via Fonnte/Wablas API). Kirim notif approval_required, status_change. Config via env variable | `backend`              | M    | Sprint 2 (2.1) | G20 |
| 5.6 | **Handover document print** — Generate print-ready handover document (PDF/print view) sesuai SOP-04                                                                                          | `frontend`             | M    | Sprint 1 (1.6) | -   |
| 5.7 | **Password validation compliance** — Enforce: min 8 char, huruf besar, huruf kecil, angka. Frontend Zod + Backend class-validator                                                            | `backend` + `frontend` | S    | -              | -   |

**Acceptance Criteria Sprint 5:**

- [ ] Ctrl+K membuka search, bisa cari aset dan navigate
- [ ] Breadcrumb muncul dan clickable
- [ ] Tabel responsif di mobile
- [ ] Theme preference persisted
- [ ] WhatsApp service functional (atau mock jika API belum ready)
- [ ] Handover document printable
- [ ] Password validation sesuai aturan
- [ ] Quality Gate passed

---

## Tracking Matrix — Coverage 100%

Mapping lengkap dari SETIAP point di dokumentasi ke sprint task:

### USER_MANUAL_SOP.md Coverage

| Section  | Deskripsi                                 | Sprint   | Task     | Status |
| -------- | ----------------------------------------- | -------- | -------- | ------ |
| §2.1     | Login pertama → ganti password            | Sprint 2 | 2.6      | ⬜     |
| §2.2     | Password requirements                     | Sprint 5 | 5.7      | ⬜     |
| §2.3     | Lupa password / reset                     | Existing | -        | ✅     |
| §2.4     | Logout                                    | Existing | -        | ✅     |
| §3.1     | Struktur layar (sidebar, header, content) | Existing | -        | ✅     |
| §3.2     | Sidebar role-based                        | Existing | -        | ✅     |
| §3.3     | Notifikasi (bell icon, real-time)         | Sprint 2 | 2.1, 2.2 | ⬜     |
| §3.4     | Pencarian global (⌘+K)                    | Sprint 5 | 5.1      | ⬜     |
| §4.1     | Dashboard Super Admin                     | Sprint 3 | 3.6      | ⬜     |
| §4.2     | Dashboard Admin Logistik                  | Sprint 3 | 3.7      | ⬜     |
| §4.3     | Dashboard Admin Purchase                  | Sprint 3 | 3.8      | ⬜     |
| §4.4     | Dashboard Leader                          | Sprint 3 | 3.9      | ⬜     |
| §4.5     | Dashboard Staff                           | Sprint 3 | 3.10     | ⬜     |
| §5.1     | Daftar aset (list, filter, search)        | Existing | -        | ✅     |
| §5.2     | Tambah aset baru (form)                   | Existing | -        | ✅     |
| §5.3     | Detail + QR code                          | Sprint 4 | 4.1      | ⬜     |
| §5.4     | Edit aset                                 | Existing | -        | ✅     |
| §5.5     | Stok aset (perspektif)                    | Existing | -        | ✅     |
| §5.6     | Threshold stok + alert                    | Sprint 2 | 2.7      | ⬜     |
| §5.7     | Kategori/Tipe/Model CRUD                  | Existing | -        | ✅     |
| §6.1.1   | Buat request (form)                       | Existing | -        | ✅     |
| §6.1.2   | Approval chain per role                   | Sprint 1 | 1.1      | ⬜     |
| §6.1.3   | Approve/reject + partial                  | Sprint 1 | 1.2      | ⬜     |
| §6.1.4   | Track status + approval timeline          | Sprint 1 | 1.8      | ⬜     |
| §6.2.1   | Buat pinjaman                             | Existing | -        | ✅     |
| §6.2.2   | Approval + assign aset                    | Sprint 1 | 1.3      | ⬜     |
| §6.2.3   | Pengembalian pinjaman                     | Sprint 1 | 1.4      | ⬜     |
| §6.3     | Serah terima (handover)                   | Sprint 1 | 1.6      | ⬜     |
| §6.4     | Lapor aset rusak                          | Sprint 2 | 2.5      | ⬜     |
| §6.5     | Scan QR code                              | Sprint 4 | 4.2      | ⬜     |
| §7.1-7.2 | Customer list + create                    | Existing | -        | ✅     |
| §7.3     | Instalasi + material                      | Sprint 3 | 3.3      | ⬜     |
| §7.4     | Maintenance + material                    | Sprint 3 | 3.4      | ⬜     |
| §7.5     | Dismantle → return aset                   | Sprint 3 | 3.5      | ⬜     |
| §8       | Proyek infrastruktur                      | Sprint 3 | 3.1, 3.2 | ⬜     |
| §9.1     | Profil sendiri                            | Existing | -        | ✅     |
| §9.2     | Kelola user (SA only)                     | Existing | -        | ✅     |
| §9.3     | Kelola divisi                             | Existing | -        | ✅     |
| §9.4     | Data pembelian                            | Existing | -        | ✅     |
| §9.5     | Tema gelap/terang                         | Sprint 5 | 5.4      | ⬜     |
| SOP-01   | Penerimaan aset dari vendor               | Sprint 4 | 4.6      | ⬜     |
| SOP-02   | Permintaan pengadaan                      | Sprint 1 | 1.1-1.8  | ⬜     |
| SOP-03   | Peminjaman & pengembalian                 | Sprint 1 | 1.3, 1.4 | ⬜     |
| SOP-04   | Serah terima antar user                   | Sprint 1 | 1.6      | ⬜     |
| SOP-05   | Pelaporan aset rusak                      | Sprint 2 | 2.5      | ⬜     |
| SOP-06   | Stock opname (export)                     | Sprint 4 | 4.4      | ⬜     |
| SOP-07   | Instalasi pelanggan                       | Sprint 3 | 3.3      | ⬜     |
| SOP-08   | Onboarding user baru                      | Sprint 2 | 2.6      | ⬜     |

### USER_SYSTEM_FLOW.md Coverage

| Section  | Deskripsi                           | Sprint                    | Task          | Status |
| -------- | ----------------------------------- | ------------------------- | ------------- | ------ |
| §1       | User journey login → aksi           | Existing + Sprint 2 (2.6) | -             | ⬜     |
| §2.1-2.3 | Request: create → approve → execute | Sprint 1                  | 1.1-1.8       | ⬜     |
| §3.1     | Loan: pembuatan + approval          | Sprint 1                  | 1.3           | ⬜     |
| §3.2     | Loan: pengembalian                  | Sprint 1                  | 1.4           | ⬜     |
| §3.3     | Loan: overdue (cron)                | Sprint 2                  | 2.3, 2.4      | ⬜     |
| §4       | Handover flow                       | Sprint 1                  | 1.6           | ⬜     |
| §5       | Repair workflow                     | Sprint 2                  | 2.5           | ⬜     |
| §6.1     | Instalasi customer                  | Sprint 3                  | 3.3           | ⬜     |
| §6.2     | Maintenance customer                | Sprint 3                  | 3.4           | ⬜     |
| §6.3     | Dismantle customer                  | Sprint 3                  | 3.5           | ⬜     |
| §7       | Proyek infrastruktur                | Sprint 3                  | 3.1, 3.2      | ⬜     |
| §8       | Auth sequence (JWT)                 | Existing                  | -             | ✅     |
| §9       | Request approval sequence           | Sprint 1                  | 1.1-1.8       | ⬜     |
| §10      | Loan sequence                       | Sprint 1                  | 1.3, 1.4      | ⬜     |
| §11      | State machine: request              | Sprint 1                  | 1.8           | ⬜     |
| §12      | State machine: aset                 | Sprint 1-3                | Multiple      | ⬜     |
| §13      | State machine: pinjaman             | Sprint 1-2                | 1.3, 1.4, 2.3 | ⬜     |
| §14      | State machine: proyek               | Sprint 3                  | 3.1           | ⬜     |
| §15      | Approval chain decision tree        | Sprint 1                  | 1.1           | ⬜     |
| §16      | System architecture overview        | Existing                  | -             | ✅     |

### API_CONTRACT.md Coverage

| Section | Deskripsi                              | Sprint                    | Status |
| ------- | -------------------------------------- | ------------------------- | ------ |
| §1-2    | RESTful principles, versioning         | Existing                  | ✅     |
| §3      | Auth endpoints + JWT                   | Existing + Sprint 2 (2.6) | ⬜     |
| §4      | Request format, validation             | Existing                  | ✅     |
| §5      | Response format (TransformInterceptor) | Existing                  | ✅     |
| §6      | Error codes mapping                    | Existing                  | ✅     |
| §7      | Pagination, filter, sorting            | Existing                  | ✅     |
| §8      | Endpoint catalog per domain            | Existing (CRUD)           | ✅     |

### SECURITY_AND_RBAC_MATRIX.md Coverage

| Section  | Deskripsi                         | Sprint                    | Status |
| -------- | --------------------------------- | ------------------------- | ------ |
| §1.2     | OWASP Top 10 compliance           | Existing                  | ✅     |
| §2.1-2.4 | JWT auth, token security, session | Existing + Sprint 2 (2.6) | ⬜     |
| §3.1     | Role definitions                  | Existing                  | ✅     |
| §3.2     | Three-tier permission model       | Existing                  | ✅     |
| §3.3     | 85+ permissions catalog           | Existing                  | ✅     |
| §3.4     | Role restrictions (hard blocks)   | Existing                  | ✅     |
| §3.5     | Mandatory permissions             | Existing                  | ✅     |

### ERROR_HANDLING.md Coverage

| Section | Deskripsi                 | Sprint   | Status |
| ------- | ------------------------- | -------- | ------ |
| §1      | Error handling principles | Existing | ✅     |
| §2      | Response format contract  | Existing | ✅     |
| §3      | Backend implementation    | Existing | ✅     |
| §4      | Frontend error handling   | Existing | ✅     |
| §5      | Status code catalog       | Existing | ✅     |
| §6      | Error logging             | Existing | ✅     |

---

## Execution Order & Dependencies

```
Sprint 1 (P0 CRITICAL)     ← MULAI DARI SINI
    ↓
Sprint 2 (P1 HIGH)         ← Depends: Sprint 1 stock movement
    ↓
Sprint 3 (P1 HIGH)         ← Depends: Sprint 1 + 2 notification
    ↓
Sprint 4 (P1-P2)           ← Independent, bisa parallel dgn Sprint 3
    ↓
Sprint 5 (P2 MEDIUM-LOW)   ← Polish, terakhir
```

**Catatan**: Sprint 3 dan 4 BISA dikerjakan secara paralel jika resource memadai.

---

## Definition of Done (setiap Sprint)

1. ✅ Semua task dalam sprint COMPLETED
2. ✅ Quality Gate passed: `pnpm --filter ./apps/frontend/ lint` + `typecheck` + `pnpm --filter ./apps/backend/ lint`
3. ✅ Zero warnings, zero errors
4. ✅ Changelog updated di `.github/docs/changelog/ReadMe.md`
5. ✅ Semua flow sesuai dokumentasi referensi
6. ✅ Error handling sesuai ERROR_HANDLING.md
7. ✅ RBAC/permissions sesuai SECURITY_AND_RBAC_MATRIX.md

---

**— Akhir Sprint Plan v1.0 —**
