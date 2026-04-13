# REBUILD Sprint Roadmap

| Metadata      | Detail                                                                    |
| ------------- | ------------------------------------------------------------------------- |
| **Versi**     | 1.0                                                                       |
| **Tanggal**   | 14 April 2026                                                             |
| **Tujuan**    | Roadmap sprint rebuild dari analisa kode saat ini hingga production-ready |
| **Referensi** | PRD v3.1, SDD v3.1, Business Logic Docs, W1–W5 Sprint History             |
| **Status**    | ACTIVE                                                                    |

---

## Dokumen Sprint

| #   | File                                                                               | Deskripsi                                              |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 00  | [../ANALYSIS/00_ANALISA_CURRENT_STATE.md](../ANALYSIS/00_ANALISA_CURRENT_STATE.md) | Analisa persentase kelengkapan vs PRD                  |
| 01  | [SPRINT_0_FOUNDATION.md](SPRINT_0_FOUNDATION.md)                                   | Sprint 0: Auth, Guards, Base Layout, DB Schema         |
| 02  | [SPRINT_1_MASTER_DATA.md](SPRINT_1_MASTER_DATA.md)                                 | Sprint 1: Kategori, Aset, Stok, Pembelian, Depresiasi  |
| 03  | [SPRINT_2_TRANSACTIONS.md](SPRINT_2_TRANSACTIONS.md)                               | Sprint 2: Request, Loan, Return, Handover, Repair      |
| 04  | [SPRINT_3_CUSTOMERS_PROJECTS.md](SPRINT_3_CUSTOMERS_PROJECTS.md)                   | Sprint 3: Pelanggan, Instalasi, Maintenance, Dismantle |
| 05  | [SPRINT_4_DASHBOARD_CROSSCUTTING.md](SPRINT_4_DASHBOARD_CROSSCUTTING.md)           | Sprint 4: Dashboard, Notifikasi, QR, Import/Export     |
| 06  | [SPRINT_5_STABILIZATION.md](SPRINT_5_STABILIZATION.md)                             | Sprint 5: Bug Fix, Security Audit, Performance, UAT    |

---

## Timeline Overview

```
Sprint 0 (Foundation)          ██████████ DONE (W1–W5)
Sprint 1 (Master Data)         ████████░░ ~80% structure, perlu validasi logika
Sprint 2 (Transactions)        ██████░░░░ ~60% structure, perlu validasi approval flow
Sprint 3 (Customers/Projects)  ██████░░░░ ~60% structure, perlu validasi FIFO & material
Sprint 4 (Dashboard/Cross)     ████░░░░░░ ~40% perlu enrichment & integrasi
Sprint 5 (Stabilization)       ░░░░░░░░░░ Belum dimulai
```

---

## Prinsip Pengerjaan

1. **Validasi sebelum Build** — Setiap sprint dimulai dengan validasi kode existing vs spesifikasi PRD
2. **Per-Module Completion** — Selesaikan 1 modul tuntas sebelum lanjut ke modul berikutnya
3. **Backend → Frontend** — Backend dulu (API + business logic), baru Frontend (UI + integrasi)
4. **Test setiap modul** — Minimal smoke test manual setelah setiap modul selesai
5. **Quality Gate wajib** — Lint + Typecheck harus 0 error sebelum commit

---

## Dependency Map

```
Sprint 0 (Foundation)
    ├── Auth & RBAC Guards
    ├── Prisma Schema & Migrations
    ├── Base Layout & Components
    └── Config & Interceptors
         │
         ▼
Sprint 1 (Master Data) ──────────────────────────────────┐
    ├── AssetCategory → AssetType → AssetModel (hirarki) │
    ├── Asset Registration & Stock                        │
    ├── PurchaseMasterData                                │
    └── Depreciation                                      │
         │                                                │
         ▼                                                │
Sprint 2 (Transactions) ◄────────────────────────────────┘
    ├── Approval Engine (shared)                  depends on: Asset, Stock, User
    ├── Request Pengadaan (asset registration)
    ├── Loan → Return (linked lifecycle)
    ├── Handover (asset transfer)
    └── Repair (damage report)
         │
         ▼
Sprint 3 (Customers/Projects) ◄── depends on: Asset, Stock, StockMovement
    ├── Customer CRUD + auto-status
    ├── Installation (FIFO material)
    ├── Maintenance (replacement + material)
    ├── Dismantle (return assets)
    └── InfraProject (task + material + team)
         │
         ▼
Sprint 4 (Dashboard/CrossCutting) ◄── depends on: ALL modules
    ├── Dashboard aggregations
    ├── Notifications (in-app + WA)
    ├── QR Code / Barcode
    ├── Import / Export
    └── Settings enrichment
         │
         ▼
Sprint 5 (Stabilization)
    ├── Integration testing
    ├── Bug fixing
    ├── Security audit
    ├── Performance optimization
    └── UAT preparation
```
