# UI/UX Design Document — TrinityApps v1.0

| Metadata          | Detail                                 |
| ----------------- | -------------------------------------- |
| **Versi**         | 1.0 Final                              |
| **Tanggal**       | 10 April 2026                          |
| **Status**        | Ready for Implementation               |
| **Referensi**     | PRD v3.1, SDD v3.1                     |
| **Go-Live**       | 1 Mei 2026                             |
| **Design System** | Shadcn UI + Tailwind CSS 3.4           |
| **Target Device** | Desktop-first, responsive hingga 360px |

> **Scope**: Dokumen ini mendefinisikan spesifikasi visual, layout, komponen UI, hierarki navigasi, dan panduan interaksi untuk seluruh halaman TrinityApps. Rujukan silang ke PRD (fitur & role) dan SDD (struktur folder & API endpoint) berlaku sepenuhnya.

---

## Daftar Isi

1. [Design Principles & Token System](#1-design-principles--token-system)
2. [Typography & Color Palette](#2-typography--color-palette)
3. [Breakpoint & Responsive Strategy](#3-breakpoint--responsive-strategy)
4. [Global Layout Architecture](#4-global-layout-architecture)
5. [Navigation & Information Architecture](#5-navigation--information-architecture)
6. [Component Library Map](#6-component-library-map)
7. [Page-by-Page Wireframe Specification](#7-page-by-page-wireframe-specification)
8. [Interaction Patterns & Micro-Interactions](#8-interaction-patterns--micro-interactions)
9. [Accessibility (A11y) Standards](#9-accessibility-a11y-standards)
10. [Dark Mode Specification](#10-dark-mode-specification)

---

## 1. Design Principles & Token System

### 1.1 Prinsip Desain

| #   | Prinsip                     | Penjelasan                                                                                   |
| --- | --------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Clarity First**           | Setiap elemen UI harus memiliki tujuan yang jelas. Tidak ada dekorasi tanpa fungsi.          |
| 2   | **Role-Aware**              | Tampilan dan navigasi menyesuaikan role pengguna (5 role × 5 dashboard berbeda).             |
| 3   | **Progressive Disclosure**  | Informasi kompleks (approval chain, audit trail) ditampilkan bertahap via tab/accordion.     |
| 4   | **Consistent DRY Patterns** | Semua modul transaksi menggunakan pola layout identik: List → Detail → Form.                 |
| 5   | **Feedback Immediate**      | Setiap aksi pengguna mendapat respons visual dalam < 200ms (loading state, toast, skeleton). |

### 1.2 Design Token (Shadcn UI + Tailwind CSS)

Seluruh warna menggunakan CSS Custom Properties yang didefinisikan di `index.css` dan dikonsumsi via utility class Tailwind/Shadcn.

```css
/* Light Mode Tokens */
--background: 0 0% 100%; /* Latar belakang utama */
--foreground: 222.2 84% 4.9%; /* Teks utama */
--card: 0 0% 100%; /* Latar belakang kartu */
--card-foreground: 222.2 84% 4.9%;
--primary: 221.2 83.2% 53.3%; /* Aksi utama (tombol, link) */
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%; /* Aksi sekunder */
--muted: 210 40% 96.1%; /* Elemen tidak aktif */
--muted-foreground: 215.4 16.3% 46.9%;
--accent: 210 40% 96.1%; /* Hover state */
--destructive: 0 84.2% 60.2%; /* Error & hapus */
--border: 214.3 31.8% 91.4%;
--ring: 221.2 83.2% 53.3%; /* Focus ring */
--radius: 0.5rem; /* Border radius default */
```

### 1.3 Semantic Color Mapping per Role

| Role           | Gradient                        | Badge Class                       | Penggunaan                 |
| -------------- | ------------------------------- | --------------------------------- | -------------------------- |
| Super Admin    | `from-violet-500 to-purple-600` | `bg-violet-100 text-violet-800`   | Sidebar header, badge role |
| Admin Logistik | `from-sky-400 to-blue-500`      | `bg-sky-100 text-sky-800`         | Sidebar header, badge role |
| Admin Purchase | `from-emerald-400 to-teal-500`  | `bg-emerald-100 text-emerald-800` | Sidebar header, badge role |
| Leader         | `from-indigo-400 to-blue-500`   | `bg-indigo-100 text-indigo-800`   | Sidebar header, badge role |
| Staff          | `from-slate-400 to-gray-500`    | `bg-slate-100 text-slate-800`     | Sidebar header, badge role |

### 1.4 Status Color Mapping

| Status         | Background       | Text               | Icon | Konteks                        |
| -------------- | ---------------- | ------------------ | ---- | ------------------------------ |
| PENDING        | `bg-yellow-100`  | `text-yellow-800`  | ⏳   | Request/Loan menunggu approval |
| APPROVED       | `bg-green-100`   | `text-green-800`   | ✓    | Semua approval selesai         |
| REJECTED       | `bg-red-100`     | `text-red-800`     | ✗    | Ditolak oleh approver          |
| IN_PROGRESS    | `bg-blue-100`    | `text-blue-800`    | ⟳    | Sedang diproses                |
| COMPLETED      | `bg-emerald-100` | `text-emerald-800` | ✓✓   | Selesai                        |
| CANCELLED      | `bg-gray-100`    | `text-gray-500`    | —    | Dibatalkan oleh creator        |
| IN_STORAGE     | `bg-slate-100`   | `text-slate-700`   | 📦   | Aset di gudang                 |
| IN_USE         | `bg-blue-100`    | `text-blue-700`    | 👤   | Aset sedang digunakan          |
| UNDER_REPAIR   | `bg-orange-100`  | `text-orange-700`  | 🔧   | Aset dalam perbaikan           |
| DECOMMISSIONED | `bg-red-100`     | `text-red-700`     | ⊘    | Aset dihapuskan                |
| LOW_STOCK      | `bg-red-50`      | `text-red-600`     | ▼    | Stok di bawah threshold        |

---

## 2. Typography & Color Palette

### 2.1 Font Stack

```css
font-family:
  'Inter',
  system-ui,
  -apple-system,
  'Segoe UI',
  sans-serif;
```

### 2.2 Type Scale

| Level     | Tailwind Class | Size | Weight     | Line Height | Penggunaan                             |
| --------- | -------------- | ---- | ---------- | ----------- | -------------------------------------- |
| Display   | `text-3xl`     | 30px | Bold (700) | 36px        | Judul halaman utama (Dashboard)        |
| Heading 1 | `text-2xl`     | 24px | Semibold   | 32px        | Judul halaman (e.g., "Daftar Aset")    |
| Heading 2 | `text-xl`      | 20px | Semibold   | 28px        | Judul section (e.g., "Detail Pemohon") |
| Heading 3 | `text-lg`      | 18px | Medium     | 28px        | Judul card / sub-section               |
| Body      | `text-sm`      | 14px | Regular    | 20px        | Teks umum, isi tabel, form label       |
| Caption   | `text-xs`      | 12px | Regular    | 16px        | Timestamp, hint text, secondary info   |

### 2.3 Spacing Scale

| Token   | Value | Penggunaan                        |
| ------- | ----- | --------------------------------- |
| `p-2`   | 8px   | Padding dalam badge, small button |
| `p-4`   | 16px  | Padding card, form field spacing  |
| `p-6`   | 24px  | Padding container halaman         |
| `gap-4` | 16px  | Jarak antar elemen dalam grid     |
| `gap-6` | 24px  | Jarak antar section               |
| `mb-8`  | 32px  | Margin bawah judul halaman        |

---

## 3. Breakpoint & Responsive Strategy

### 3.1 Breakpoint Definition (NFR-10)

| Breakpoint | Min Width | Penggunaan                    | Layout Behavior                  |
| ---------- | --------- | ----------------------------- | -------------------------------- |
| `xs`       | 360px     | Smartphone portrait           | Single column, sidebar collapsed |
| `sm`       | 640px     | Smartphone landscape / tablet | Single column, sidebar overlay   |
| `md`       | 768px     | Tablet portrait               | Two columns, sidebar collapsible |
| `lg`       | 1024px    | Tablet landscape / laptop     | Full layout, sidebar permanent   |
| `xl`       | 1280px    | Desktop                       | Full layout, wider content area  |
| `2xl`      | 1440px    | Large desktop                 | Max-width container, centered    |

### 3.2 Responsive Behavior Matrix

| Komponen          | < 768px (Mobile)          | 768px–1024px (Tablet)     | > 1024px (Desktop)        |
| ----------------- | ------------------------- | ------------------------- | ------------------------- |
| Sidebar           | Hidden, hamburger trigger | Collapsible (icons only)  | Permanent, fully expanded |
| Data Table        | Berubah menjadi Card list | Scrollable horizontal     | Full table view           |
| Form Layout       | Single column             | Two columns               | Two/three columns         |
| Dashboard Cards   | Stack vertikal (1 kolom)  | Grid 2 kolom              | Grid 4 kolom              |
| Modal/Dialog      | Full-screen bottom sheet  | Center dialog (80% width) | Center dialog (max 640px) |
| Approval Timeline | Vertikal (step-by-step)   | Vertikal                  | Horizontal timeline       |

---

## 4. Global Layout Architecture

### 4.1 Master Layout (Authenticated Pages)

```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────────────────┐ │
│ │          │ │  Header Bar                            │ │
│ │          │ │  ┌─────────────┬──────────┬──────────┐ │ │
│ │          │ │  │ Breadcrumb  │ Search   │ 🔔 👤    │ │ │
│ │          │ │  └─────────────┴──────────┴──────────┘ │ │
│ │  S       │ ├────────────────────────────────────────┤ │
│ │  I       │ │                                        │ │
│ │  D       │ │  Main Content Area                     │ │
│ │  E       │ │                                        │ │
│ │  B       │ │  ┌──────────────────────────────────┐  │ │
│ │  A       │ │  │  Page-specific content            │  │ │
│ │  R       │ │  │  (Table, Form, Dashboard, etc.)   │  │ │
│ │          │ │  │                                    │  │ │
│ │          │ │  └──────────────────────────────────┘  │ │
│ │          │ │                                        │ │
│ └──────────┘ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Dimensi:**

- Sidebar: `w-64` (256px) expanded, `w-16` (64px) collapsed
- Header: `h-16` (64px) fixed top
- Content padding: `p-6` (24px)
- Max content width: `max-w-7xl` (1280px), centered pada layar > 1440px

### 4.2 Header Bar Components

| Posisi | Komponen               | Deskripsi                                                     |
| ------ | ---------------------- | ------------------------------------------------------------- |
| Kiri   | Breadcrumb             | Navigasi hierarkis: `Dashboard > Transaksi > Permintaan Baru` |
| Tengah | Global Search (⌘+K)    | Command palette: cari aset, user, transaksi, navigasi halaman |
| Kanan  | Notification Bell (🔔) | Dropdown: 5 notifikasi terakhir + "Lihat Semua"               |
| Kanan  | User Avatar            | Dropdown: Nama, Role, [Kelola Akun], [Ganti Tema], [Logout]   |

### 4.3 Login Page Layout (Unauthenticated)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ┌─────────────────────────┐                │
│              │       🔺 LOGO           │                │
│              │    TrinityApps          │                │
│              │                         │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Email             │  │                │
│              │  └───────────────────┘  │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Password    👁    │  │                │
│              │  └───────────────────┘  │                │
│              │                         │                │
│              │  [      LOGIN       ]   │                │
│              │                         │                │
│              │  Lupa Password?          │                │
│              └─────────────────────────┘                │
│                                                         │
│              ┌──────────────────────┐                   │
│              │  🌙 / ☀ Theme Toggle │                   │
│              └──────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Navigation & Information Architecture

### 5.1 Sidebar Navigation Hierarchy

Sidebar menampilkan menu berdasarkan permission pengguna. Item yang tidak memiliki akses otomatis disembunyikan (bukan di-grey-out).

```
SIDEBAR STRUCTURE
═══════════════════════════════════

┌─────────────────────────────────┐
│  🔺 TrinityApps                │
│  [Nama User]                    │
│  Role Badge ▼ (gradient)        │
├─────────────────────────────────┤
│                                 │
│  📊  Dashboard                  │
│                                 │
│  ── MANAJEMEN ──────────────── │
│                                 │
│  📦  Pusat Aset         ▾      │
│     ├ 📝 Catat Aset            │
│     ├ 📊 Stok Aset             │
│     ├ 📋 Request Aset    ▾     │
│     │   ├ Request Baru          │
│     │   └ Request Pinjam        │
│     ├ 🤝 Handover Aset         │
│     └ 🔧 Perbaikan Aset        │
│                                 │
│  👥  Manajemen Pelanggan ▾     │
│     ├ 📋 Daftar Pelanggan      │
│     ├ ⚡ Manajemen Instalasi    │
│     ├ 🔧 Manajemen Maintenance │
│     └ 🔌 Data Dismantle        │
│                                 │
│  ── PROYEK ─────────────────── │
│                                 │
│  🏗  Proyek Infrastruktur      │
│                                 │
│  ── SISTEM ─────────────────── │
│                                 │
│  ⚙  Pengaturan          ▾     │
│     ├ 👤 Kelola Akun           │
│     ├ 👥 Akun & Divisi         │
│     ├ 🏷  Kategori & Model     │
│     └ 💰 Data Pembelian        │
│                                 │
├─────────────────────────────────┤
│  📖 v1.0 · © TrinityApps 2026  │
└─────────────────────────────────┘
```

### 5.2 Menu Visibility per Role

| Menu Item             | Super Admin | Admin Logistik | Admin Purchase | Leader | Staff |
| --------------------- | :---------: | :------------: | :------------: | :----: | :---: |
| Dashboard             |     ✅      |       ✅       |       ✅       |   ✅   |  ✅   |
| Catat Aset            |     ✅      |       ✅       |       —        |   —    |   —   |
| Stok Aset             |     ✅      |       ✅       |       ✅       |   ✅   |  ✅   |
| Request Baru          |     ✅      |       ✅       |       ✅       |   ✅   |  ✅   |
| Request Pinjam        |     ✅      |       ✅       |       ✅       |   ✅   |  ✅   |
| Handover Aset         |     ✅      |       ✅       |       —        |   —    |   —   |
| Perbaikan Aset        |     ✅      |       ✅       |       —        |   —    |   —   |
| Daftar Pelanggan      |     ✅      |       ✅       |       —        |   ✅   |  ✅   |
| Manajemen Instalasi   |     ✅      |       ✅       |       —        |   —    |   —   |
| Manajemen Maintenance |     ✅      |       ✅       |       —        |   ✅   |  ✅   |
| Data Dismantle        |     ✅      |       ✅       |       —        |   —    |   —   |
| Proyek Infrastruktur  |     ✅      |       ✅       |       ✅       |   ✅   |  ✅   |
| Kelola Akun           |     ✅      |       ✅       |       ✅       |   ✅   |  ✅   |
| Akun & Divisi         |     ✅      |       —        |       —        |   —    |   —   |
| Kategori & Model      |     ✅      |       ✅       |       —        |   —    |   —   |
| Data Pembelian        |     ✅      |       —        |       ✅       |   —    |   —   |

---

## 6. Component Library Map

### 6.1 Shadcn UI Components (Base Layer)

Seluruh komponen di bawah ini diimpor dari `components/ui/` dan mengikuti konvensi Shadcn UI dengan customisasi token TrinityApps.

| Komponen       | File                | Varian                                             | Penggunaan Utama                        |
| -------------- | ------------------- | -------------------------------------------------- | --------------------------------------- |
| `Button`       | `Button.tsx`        | default, destructive, outline, ghost, link         | CTA, submit, navigasi                   |
| `Input`        | `Input.tsx`         | text, email, password, number, search              | Form input field                        |
| `Card`         | `Card.tsx`          | CardHeader, CardContent, CardFooter                | Wrapper konten, stat card, detail panel |
| `Dialog`       | `dialog.tsx`        | Dialog, DialogContent, DialogHeader, DialogFooter  | Modal form, konfirmasi, detail view     |
| `Table`        | `table.tsx`         | Table, TableHeader, TableBody, TableRow, TableCell | Data listing semua modul                |
| `Badge`        | `Badge.tsx`         | default, secondary, destructive, outline           | Status indicator, role badge, tag       |
| `Tabs`         | `tabs.tsx`          | TabsList, TabsTrigger, TabsContent                 | Section navigation dalam detail view    |
| `DropdownMenu` | `dropdown-menu.tsx` | Trigger, Content, Item, Separator                  | Action menu, user menu, filter          |
| `Label`        | `label.tsx`         | —                                                  | Form field label dengan htmlFor         |
| `Alert`        | `Alert.tsx`         | default, destructive                               | Warning banner, error message           |
| `Modal`        | `Modal.tsx`         | —                                                  | Legacy modal wrapper                    |

### 6.2 Custom Composite Components

| Komponen             | Lokasi                              | Deskripsi                                                                     |
| -------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `ResponsiveTable`    | `components/`                       | Table yang otomatis berubah menjadi Card list pada viewport < 768px           |
| `ApprovalTimeline`   | `features/transactions/components/` | Timeline vertikal/horizontal menampilkan langkah approval dengan status badge |
| `StatusBadge`        | `components/`                       | Badge dengan warna otomatis berdasarkan mapping status (lihat Tabel §1.4)     |
| `TransactionForm`    | `features/transactions/components/` | Form wrapper dengan React Hook Form + Zod validation + loading state          |
| `PaginationControls` | `components/`                       | Komponen pagination: halaman, limit per page, total records                   |
| `StockView`          | `features/stock/components/`        | Tabel stok dengan toggle perspektif (gudang utama / divisi / pribadi)         |
| `CustomSelect`       | `components/`                       | Dropdown select dengan search, multi-select, dan async loading                |
| `QRCodeDisplay`      | `components/`                       | Generator dan viewer QR code per aset                                         |
| `FileUpload`         | `components/`                       | Drag-and-drop upload dengan preview (JPG, PNG, PDF; max 5MB)                  |
| `ConfirmDialog`      | `components/`                       | Dialog konfirmasi: "Apakah Anda yakin?" dengan tombol Batal / Konfirmasi      |

### 6.3 Form Pattern (React Hook Form + Zod)

Semua form mengikuti pola yang sama:

```tsx
// Pattern: Form dengan validasi Zod + React Hook Form
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage /> {/* Error otomatis dari Zod */}
        </FormItem>
      )}
    />
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? <Spinner /> : 'Simpan'}
    </Button>
  </form>
</Form>
```

---

## 7. Page-by-Page Wireframe Specification

### 7.1 Dashboard (F-01)

#### 7.1.1 Dashboard Utama — Super Admin

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Utama                               [April 2026] │
├──────────┬──────────┬──────────┬──────────────────────────── │
│ Total    │ Request  │ Pinjaman │ Aset         │ Stok       │ │
│ Aset     │ Pending  │ Aktif    │ Rusak        │ Low Alert  │ │
│ [1,247]  │ [23]     │ [15]     │ [8]          │ [5]        │ │
├──────────┴──────────┴──────────┴──────────────┴────────────┤ │
│                                                             │ │
│  ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  │ 📈 Tren Aset (6 bulan)   │ │ 🥧 Aset per Kategori    │  │
│  │  [Line Chart]             │ │  [Pie Chart]             │  │
│  └──────────────────────────┘ └──────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📋 Aktivitas Terbaru                                 │   │
│  │ ┌────────┬──────────────┬───────────┬──────────────┐ │   │
│  │ │ Waktu  │ Aksi         │ User      │ Status       │ │   │
│  │ ├────────┼──────────────┼───────────┼──────────────┤ │   │
│  │ │ 5m ago │ Request #247 │ Budi (S)  │ ⏳ Pending   │ │   │
│  │ │ 1h ago │ Handover #89 │ Rina (AL) │ ✓ Completed  │ │   │
│  │ │ 2h ago │ Loan #156    │ Andi (L)  │ ⟳ On Loan    │ │   │
│  │ └────────┴──────────────┴───────────┴──────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 7.1.2 Dashboard Keuangan — Admin Purchase

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Keuangan                                         │
├──────────┬──────────┬──────────┬───────────────────────────  │
│ Total    │ Depresi- │ Budget   │ Pending                    │
│ Pembelian│ asi Bulan│ Tersisa  │ Approval                   │
│ Rp 2.4M │ Rp 180K  │ Rp 1.2M  │ [7]                       │
├──────────┴──────────┴──────────┴───────────────────────────  │
│                                                              │
│  ┌──────────────────────────┐ ┌──────────────────────────┐   │
│  │ 📊 Tren Depresiasi       │ │ 📊 Pengeluaran/Kategori │   │
│  │  [Bar Chart - Monthly]    │ │  [Stacked Bar Chart]     │   │
│  └──────────────────────────┘ └──────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 📋 Pembelian Terbaru                                 │    │
│  │  [Table: Model, Vendor, Harga, Tanggal, Status]      │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

#### 7.1.3 Dashboard Operasional — Admin Logistik

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Operasional                                      │
├──────────┬──────────┬──────────┬───────────────────────────  │
│ Total    │ Stok     │ Pinjaman │ Dalam                      │
│ Aset     │ Kritis ⚠ │ Belum   │ Perbaikan                  │
│ [1,247]  │ [5]      │ Kembali  │ [8]                        │
│          │          │ [12]     │                             │
├──────────┴──────────┴──────────┴───────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🚨 Alert: Stok di Bawah Threshold                    │    │
│  │  [Table: Model, Stok Sisa, Threshold, Status]         │    │
│  │  Red row: Kabel UTP (sisa 5, threshold 20) [KRITIS]   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────┐ ┌──────────────────────────┐   │
│  │ 🥧 Kondisi Aset          │ │ 📋 Pinjaman Pending      │   │
│  │  [Donut: Good/Damaged/   │ │  Return                   │   │
│  │   Repair/Decommissioned] │ │  [Table]                  │   │
│  └──────────────────────────┘ └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### 7.1.4 Dashboard Divisi — Leader

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Divisi: [Nama Divisi]                            │
├──────────┬──────────┬──────────┬───────────────────────────  │
│ Aset     │ Request  │ Member   │ Pinjaman                   │
│ Divisi   │ Pending  │ Aktif    │ Tim                        │
│ [85]     │ [3]      │ [12]     │ [4]                        │
├──────────┴──────────┴──────────┴───────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 👥 Anggota Divisi & Aset yang Dipegang               │    │
│  │  [Table: Nama, Role, Jumlah Aset, Aset Terakhir]     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────┐ ┌──────────────────────────┐   │
│  │ 📊 Aset Divisi per Status│ │ 📋 Transaksi Terbaru     │   │
│  │  [Horizontal Bar Chart]  │ │  [Table: 5 terakhir]      │   │
│  └──────────────────────────┘ └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### 7.1.5 Dashboard Pribadi — Staff

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Saya                                             │
├──────────┬──────────┬──────────────────────────────────────  │
│ Aset     │ Pinjaman │ Pending Return                        │
│ Saya     │ Aktif    │                                       │
│ [3]      │ [1]      │ [1]                                   │
├──────────┴──────────┴──────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 📦 Aset yang Saya Pegang                             │    │
│  │  [Table: Nama Aset, Kategori, Kondisi, Sejak Tanggal]│    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 📋 Riwayat Request & Pinjaman Saya                   │    │
│  │  [Table: ID, Tipe, Tanggal, Status]                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ ✅ Checklist: Aset yang Harus Dikembalikan            │    │
│  │  ☐ Laptop ThinkPad X1 (jatuh tempo: 15 Apr 2026)    │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Manajemen Aset (F-02)

#### 7.2.1 Daftar Aset (`/assets`)

```
┌──────────────────────────────────────────────────────────────┐
│  Pencatatan Aset                          [+ Tambah Aset]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌────────────────────────────────────┐         │
│  │ Filter   │ │ 🔍 Cari nama, serial number, brand │         │
│  │          │ ├────────────────────────────────────┤         │
│  │ Kategori │ │                                    │         │
│  │ [▼ All]  │ │ ┌──────┬────────┬──────┬─────┬───┐│         │
│  │          │ │ │ Nama │Kategori│Serial│Stts │ ⋮ ││         │
│  │ Tipe     │ │ ├──────┼────────┼──────┼─────┼───┤│         │
│  │ [▼ All]  │ │ │ OLT  │Jaringan│SN001 │📦   │ ⋮ ││         │
│  │          │ │ │ Kabel │Kabel  │—     │📦   │ ⋮ ││         │
│  │ Status   │ │ │ ...  │ ...   │...   │...  │...││         │
│  │ [▼ All]  │ │ └──────┴────────┴──────┴─────┴───┘│         │
│  │          │ │                                    │         │
│  │ Kondisi  │ │ ◀ 1 2 3 ... 10 ▶  [20/page ▼]    │         │
│  │ [▼ All]  │ └────────────────────────────────────┘         │
│  └──────────┘                                                │
└──────────────────────────────────────────────────────────────┘
```

**Aksi per Row (Menu ⋮):**

- 👁 Lihat Detail
- ✏️ Edit
- 📱 Tampilkan QR Code
- 🗑 Hapus (dengan konfirmasi dialog, hanya jika status `IN_STORAGE`)

#### 7.2.2 Detail Aset (Modal / Halaman)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Kembali                                                  │
│                                                              │
│  ┌──────────────────────────────┬───────────────────────────┐│
│  │  📦 OLT Huawei MA5608T      │  ┌─────────────────────┐  ││
│  │                              │  │  ▓▓▓▓▓▓▓▓▓         │  ││
│  │  Kategori: Perangkat Jaringan│  │  [QR CODE]          │  ││
│  │  Tipe: OLT                   │  │                     │  ││
│  │  Model: MA5608T              │  └─────────────────────┘  ││
│  │  Brand: Huawei               │                           ││
│  │  S/N: HW-OLT-2025-001       │  Status: 📦 In Storage    ││
│  │  MAC: AA:BB:CC:DD:EE:FF      │  Kondisi: ✅ Good         ││
│  │                              │  PIC: —                   ││
│  │  Lokasi: Gudang Utama        │  Divisi: —                ││
│  └──────────────────────────────┴───────────────────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────── │
│  │ [Umum] [Pembelian] [Depresiasi] [Riwayat] [Transaksi]   ││
│  ├──────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │  Tab content berdasarkan selection                       ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Stok Aset (`/stock`)

```
┌──────────────────────────────────────────────────────────────┐
│  Stok Aset                                                   │
│                                                              │
│  [📦 Gudang Utama] [🏢 Gudang Divisi] [👤 Stok Pribadi]     │
│   ─────────────     (toggle aktif = underline + primary)     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔍 Cari model atau brand...                                │
│                                                              │
│  ┌───────────┬───────┬──────────┬────────┬──────────┐       │
│  │ Model     │ Brand │ Stok     │ Thres- │ Status   │       │
│  │           │       │ Tersedia │ hold   │          │       │
│  ├───────────┼───────┼──────────┼────────┼──────────┤       │
│  │ Kabel UTP │ AMP   │ 5        │ 20     │ 🔴 KRITIS│       │
│  │ ONU       │ ZTE   │ 15       │ 10     │ 🟢 AMAN  │       │
│  │ Connector │ AMP   │ 12       │ 10     │ 🟡 DEKAT │       │
│  └───────────┴───────┴──────────┴────────┴──────────┘       │
│                                                              │
│  [⚙ Atur Threshold] (visible: SA, AL only)                  │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Modul Transaksi — Pola DRY (F-04)

Semua 6 modul transaksi (Request, Loan, Return, Handover, Repair, Project) mengikuti **tiga layout identik**: List, Detail, dan Form.

#### 7.4.1 Transaction List (Pola Umum)

```
┌──────────────────────────────────────────────────────────────┐
│  [Nama Modul: e.g., "Permintaan Baru"]     [+ Buat Baru]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter: [Status ▼] [Tanggal: __ s/d __] [Divisi ▼]        │
│  🔍 Cari nomor dokumen atau nama pemohon...                 │
│                                                              │
│  ┌─────────┬──────────┬───────────┬────────┬───────┬──────┐ │
│  │ No. Dok │ Pemohon  │ Tanggal   │ Status │Approver│ ⋮   │ │
│  ├─────────┼──────────┼───────────┼────────┼───────┼──────┤ │
│  │ RQ-001  │ Budi (S) │ 08 Apr 26 │ ⏳     │ Andi  │ ⋮   │ │
│  │ RQ-002  │ Rina (L) │ 07 Apr 26 │ ✓      │ —     │ ⋮   │ │
│  │ LN-015  │ Cici (S) │ 05 Apr 26 │ ✗      │ —     │ ⋮   │ │
│  └─────────┴──────────┴───────────┴────────┴───────┴──────┘ │
│                                                              │
│  ◀ 1 2 3 ▶  Menampilkan 1-20 dari 156 data                 │
└──────────────────────────────────────────────────────────────┘
```

#### 7.4.2 Transaction Detail (Pola Umum)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Kembali ke Daftar                                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ RQ-2026-0408-0001                    Status: ⏳ PENDING  ││
│  │ Dibuat oleh: Budi Santoso (Staff)                        ││
│  │ Divisi: Teknik | Tanggal: 08 April 2026                  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──── APPROVAL TIMELINE ───────────────────────────────────┐│
│  │                                                          ││
│  │  [1. Leader]──→[2. Admin Log.]──→[3. Admin Pur.]──→[4.SA]│
│  │   ✓ Approved    ⏳ Pending        ○ Waiting       ○ Wait ││
│  │   Andi          —                —               —       ││
│  │   08 Apr 10:30                                           ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──── DETAIL ITEM ─────────────────────────────────────────┐│
│  │ ┌──────────┬──────────┬───────┬──────────┬─────────────┐ ││
│  │ │ Item     │ Tipe     │ Qty   │ Approved │ Status      │ ││
│  │ ├──────────┼──────────┼───────┼──────────┼─────────────┤ ││
│  │ │ Kabel UTP│ Cat5e AMP│ 100m  │ 100m     │ ✓ Approved  │ ││
│  │ │ ONU      │ ZTE F660 │ 5 pcs │ 3 pcs    │ ⚠ Partial   │ ││
│  │ └──────────┴──────────┴───────┴──────────┴─────────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──── AKSI ────────────────────────────────────────────────┐│
│  │ [✓ Approve] [✗ Reject]   (muncul jika user = approver)  ││
│  │ [Batalkan Request]        (muncul jika user = creator)   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [Umum] [Audit Trail]                                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 08 Apr 10:30 — Andi (Leader): Approved                  ││
│  │ 08 Apr 09:00 — Budi (Staff): Request Created            ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### 7.4.3 Transaction Form (Pola Umum)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Kembali                                                  │
│  Buat [Nama Transaksi] Baru                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─── Informasi Pemohon (auto-filled) ──────────────────────┐│
│  │ Nama: Budi Santoso     Divisi: Teknik     Role: Staff    ││
│  │ Tanggal: 10 April 2026 (auto)                             ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─── Detail Transaksi ────────────────────────────────────┐ │
│  │                                                          │ │
│  │  Tipe Order:  (●) Regular  (○) Urgent  (○) Project       │ │
│  │  Alokasi:     (●) Penggunaan    (○) Inventaris            │ │
│  │  Justifikasi: [_________________________________]         │ │
│  │                                                          │ │
│  │  ── Item Request ──────────────────────────────────────  │ │
│  │  ┌──────────┬───────────┬──────┬──────┬────┐            │ │
│  │  │ Nama Item│ Tipe/Brand│ Qty  │ Unit │ 🗑 │            │ │
│  │  ├──────────┼───────────┼──────┼──────┼────┤            │ │
│  │  │ [_____]  │ [______]  │ [__] │ [▼]  │ 🗑 │            │ │
│  │  └──────────┴───────────┴──────┴──────┴────┘            │ │
│  │  [+ Tambah Item]  (max 50 item per request)              │ │
│  │                                                          │ │
│  │  Lampiran: [📎 Upload File]   (JPG/PNG/PDF, max 5MB)     │ │
│  │  Catatan:  [_________________________________]            │ │
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [Kirim Request]  [Batal]                                    │
│                                                              │
│  ℹ Setelah dikirim, request akan diteruskan ke Leader Divisi │
│    untuk persetujuan. Anda akan menerima notifikasi.         │
└──────────────────────────────────────────────────────────────┘
```

### 7.5 Manajemen Pelanggan (F-05)

#### 7.5.1 Daftar Pelanggan

```
┌──────────────────────────────────────────────────────────────┐
│  Daftar Pelanggan                         [+ Tambah Pelanggan]│
├──────────────────────────────────────────────────────────────┤
│  🔍 Cari nama atau kode pelanggan...     [Status ▼]          │
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┬────┬────────┐ │
│  │ Kode     │ Nama     │ Kontak   │ Instalasi│ MT │ Aksi   │ │
│  ├──────────┼──────────┼──────────┼──────────┼────┼────────┤ │
│  │ TMI-001  │ PT ABC   │ 08xx     │ 3        │ 5  │ ⋮      │ │
│  └──────────┴──────────┴──────────┴──────────┴────┴────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### 7.5.2 Detail Pelanggan (`/customers/:id`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Kembali                                                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  TMI-001 — PT ABC Telekomunikasi                         ││
│  │  Alamat: Jl. Merdeka No. 10, Bandung                      ││
│  │  Kontak: 081234567890 | Status: ✅ Aktif                  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [Info Umum] [Instalasi] [Maintenance] [Dismantle] [File]    │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Tab content...                                          ││
│  │                                                          ││
│  │  Instalasi tab: tabel instalasi + [+ Tambah Instalasi]   ││
│  │  Maintenance tab: tabel maintenance + [+ Tambah MT]       ││
│  │  Dismantle tab: tabel dismantle + [+ Tambah Dismantle]    ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 7.6 Pengaturan (F-06)

#### 7.6.1 Akun & Divisi (`/settings/users-divisions`)

```
┌──────────────────────────────────────────────────────────────┐
│  Manajemen Akun & Divisi                                     │
│                                                              │
│  [Ringkasan] [Daftar Akun] [Daftar Divisi]                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab: Ringkasan                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ Total    │ Super    │ Admin    │ Leader   │              │
│  │ User: 35 │ Admin: 2 │ Log: 3   │ : 5      │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│  Tab: Daftar Akun                 [+ Tambah Akun]            │
│  ┌──────────┬──────────┬──────────┬──────────┬──────┐       │
│  │ Nama     │ Email    │ Role     │ Divisi   │ Aksi │       │
│  ├──────────┼──────────┼──────────┼──────────┼──────┤       │
│  │ Budi S.  │ budi@... │ Staff    │ Teknik   │ ⋮    │       │
│  └──────────┴──────────┴──────────┴──────────┴──────┘       │
│                                                              │
│  Aksi per row: Edit, Reset Password, Manage Permission,      │
│  Deactivate                                                  │
└──────────────────────────────────────────────────────────────┘
```

### 7.7 Proyek Infrastruktur (F-04.6)

```
┌──────────────────────────────────────────────────────────────┐
│  Proyek Infrastruktur                      [+ Buat Proyek]   │
├──────────────────────────────────────────────────────────────┤
│  Filter: [Status ▼] [Tipe ▼] [Prioritas ▼]                  │
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────┐       │
│  │ ID       │ Nama     │ Status   │ Timeline │ Lead │       │
│  ├──────────┼──────────┼──────────┼──────────┼──────┤       │
│  │ PID-001  │ OLT Rack │ ⟳ Active │ Jan-Mar  │ Andi │       │
│  └──────────┴──────────┴──────────┴──────────┴──────┘       │
│                                                              │
│  Detail Proyek: Tabs [Info] [Tasks] [Material] [Tim]         │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Interaction Patterns & Micro-Interactions

### 8.1 Loading States

| Konteks           | Pattern                                         | Durasi Trigger |
| ----------------- | ----------------------------------------------- | -------------- |
| Page initial load | Skeleton loader (Shadcn Skeleton komponen)      | > 300ms        |
| Table data fetch  | Skeleton rows (3-5 baris placeholder)           | > 300ms        |
| Button submit     | Spinner inline + text "Menyimpan..." + disabled | Immediately    |
| Navigation        | Top progress bar (NProgress style)              | > 200ms        |
| Modal open        | Fade-in 150ms + scale from 95%                  | Immediately    |

### 8.2 Toast Notifications

| Tipe    | Warna           | Icon | Durasi | Contoh Pesan                   |
| ------- | --------------- | ---- | ------ | ------------------------------ |
| Success | `bg-green-500`  | ✓    | 3s     | "Request berhasil dibuat"      |
| Error   | `bg-red-500`    | ✗    | 5s     | "Gagal menyimpan. Coba lagi."  |
| Warning | `bg-yellow-500` | ⚠    | 4s     | "Stok mendekati batas minimum" |
| Info    | `bg-blue-500`   | ℹ    | 3s     | "Data berhasil diperbarui"     |

### 8.3 Confirmation Dialogs

Digunakan untuk aksi destruktif atau ireversibel:

```
┌─────────────────────────────────────────┐
│  ⚠ Konfirmasi Penolakan                 │
│                                         │
│  Anda akan menolak request RQ-001.      │
│  Aksi ini tidak dapat dibatalkan.       │
│                                         │
│  Alasan penolakan: *                    │
│  [______________________________]        │
│                                         │
│            [Batal]  [Ya, Tolak]          │
└─────────────────────────────────────────┘
```

### 8.4 Empty States

Setiap tabel dan list memiliki empty state yang informatif:

```
┌─────────────────────────────────────────┐
│                                         │
│           📋                            │
│     Belum Ada Data                      │
│                                         │
│  Belum ada request yang dibuat.         │
│  Klik tombol di atas untuk membuat      │
│  request baru.                          │
│                                         │
│  [+ Buat Request Baru]                  │
└─────────────────────────────────────────┘
```

### 8.5 Form Validation Display

```
┌─────────────────────────────────────────┐
│  Email *                                │
│  ┌─────────────────────────────────┐    │
│  │ invalidemail                    │    │  ← border-destructive
│  └─────────────────────────────────┘    │
│  ⚠ Format email tidak valid             │  ← text-destructive, text-xs
└─────────────────────────────────────────┘
```

---

## 9. Accessibility (A11y) Standards

### 9.1 WCAG 2.1 AA Compliance

| Aspek               | Standar                                            | Implementasi                                        |
| ------------------- | -------------------------------------------------- | --------------------------------------------------- |
| Color Contrast      | Minimum 4.5:1 (normal text), 3:1 (large text)      | Verified via axe-core integration                   |
| Keyboard Navigation | Semua elemen interaktif dapat dijangkau via Tab    | `tabIndex`, `onKeyDown` handlers                    |
| Focus Indicator     | Visible focus ring pada semua interactive elements | `ring-2 ring-ring ring-offset-2`                    |
| Screen Reader       | Semua gambar memiliki `alt`, form memiliki `label` | `aria-label`, `aria-describedby`, `sr-only`         |
| Reduced Motion      | Animasi dihormati `prefers-reduced-motion`         | `useReducedMotion()` hook, CSS media query          |
| Error Announcement  | Error form diumumkan ke screen reader              | `aria-invalid`, `aria-errormessage`, `role="alert"` |

### 9.2 Keyboard Shortcut

| Shortcut   | Aksi                    |
| ---------- | ----------------------- |
| `⌘ + K`    | Buka Global Search      |
| `Escape`   | Tutup modal/dropdown    |
| `Tab`      | Navigate antar field    |
| `Enter`    | Submit form / Confirm   |
| `Arrow ↑↓` | Navigate dropdown items |

---

## 10. Dark Mode Specification

TrinityApps mendukung dua tema yang dapat diaktifkan via toggle di User Menu.

### 10.1 Dark Mode Token Override

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --destructive: 0 62.8% 30.6%;
  --border: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

### 10.2 Dark Mode Behavior

| Komponen      | Light Mode              | Dark Mode                    |
| ------------- | ----------------------- | ---------------------------- |
| Background    | `bg-background` (white) | `bg-background` (dark gray)  |
| Card          | White + shadow          | Dark card + subtle border    |
| Table rows    | Even: `bg-muted`        | Even: `bg-muted` (darker)    |
| Status badges | Colored bg + dark text  | Same palette, adjusted alpha |
| Charts        | Light gridlines         | Dark gridlines, bright data  |
| Sidebar       | White bg                | Dark bg with gradient header |

---

## Referensi Silang

| Topik                                | Dokumen                    | Section               |
| ------------------------------------ | -------------------------- | --------------------- |
| Fitur dan requirement lengkap        | PRD v3.1                   | Section 5-6           |
| Struktur folder frontend             | SDD v3.1                   | Section 2.1           |
| API endpoint & URL mapping           | SDD v3.1                   | Section 3-4           |
| ERD & database schema                | SDD v3.1                   | Section 5             |
| Matriks approval workflow            | PRD v3.1                   | Section 7.3           |
| Matriks akses RBAC per modul         | PRD v3.1                   | Section 7.2           |
| Permission keys & role defaults      | `permissions.constants.ts` | Source code (backend) |
| User flow lengkap (Mermaid diagrams) | USER_SYSTEM_FLOW.md        | Dokumen terpisah      |
| User Manual end-user                 | USER_MANUAL_SOP.md         | Dokumen terpisah      |

---

**— Akhir Dokumen UI/UX Design Document v1.0 —**
