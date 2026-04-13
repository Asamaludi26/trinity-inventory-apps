# 06 — Sidebar Minimize & Flyout Dropdown Design

> Dokumentasi design sidebar saat di-minimize (collapsed) dengan flyout dropdown panel.
> Referensi dari screenshot & kode aktual SidebarNav + sidebarConfig.

---

## 1. Overview Sidebar

Sidebar memiliki 2 mode operasi:

- **Expanded** (264px): Menu lengkap dengan label teks + collapsible sub-menu
- **Collapsed** (72px): Icon-only dengan **flyout dropdown panel** saat diklik

---

## 2. Struktur Menu

```
MENU_STRUCTURE (dari sidebarConfig.ts)
│
├── Dashboard                           [icon: dashboard]
│   └── permission: dashboard:view
│
├── ─── Section: PUSAT ASET ───
│
├── Pusat Aset                          [icon: asset]
│   ├── Catat Aset                      [icon: register]    → /assets/new
│   ├── Stok Aset                       [icon: box]         → /stock
│   ├── Request Aset (sub-group)        [icon: request]
│   │   ├── Request Baru                                    → /requests/asset-requests
│   │   └── Request Pinjam              [icon: loan]        → /requests/loans
│   ├── Handover Aset                   [icon: handover]    → /handover
│   └── Perbaikan Aset                  [icon: repair]      → /repair
│
├── ─── Section: MANAJEMEN PELANGGAN ───
│
├── Manajemen Pelanggan                 [icon: customer]
│   ├── Daftar Pelanggan                [icon: users]       → /customers
│   ├── Manajemen Instalasi             [icon: install]     → /customers/installation
│   ├── Manajemen Maintenance           [icon: maintenance] → /customers/maintenance
│   └── Data Dismantle                  [icon: dismantle]   → /customers/dismantle
│
├── ─── Section: PROYEK ───
│
├── Proyek Infrastruktur                [icon: project]     → /projects
│
├── ─── Section: PENGATURAN ───
│
└── Pengaturan                          [icon: settings]
    ├── Kelola Akun                     [icon: userCog]     → /settings/profile
    ├── Akun & Divisi                   [icon: users]       → /settings/users-divisions
    ├── Kategori & Model                [icon: category]    → /settings/categories
    └── Data Pembelian                  [icon: dollar]      → /settings/purchase-master
```

---

## 3. Mode Collapsed — Flyout Dropdown Design

### 3.1 Visualisasi

```
┌─────────────────────────────────────────────────────────────────┐
│           COLLAPSED SIDEBAR + FLYOUT PANEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────┐                                                       │
│  │ logo │  ← Logo/brand area (tetap terlihat)                  │
│  ├──────┤                                                       │
│  │  🏠  │  ← Dashboard (single item, direct nav)               │
│  │──────│                                                       │
│  │  📦  │──────→┌─────────────────────────────┐                │
│  │      │       │ PUSAT ASET              (header)              │
│  │      │       ├─────────────────────────────┤                │
│  │      │       │ 📋 Catat Aset              │                │
│  │      │       │ 📦 Stok Aset               │                │
│  │      │       │ ── Request Aset ──         │ ← sub-section   │
│  │      │       │    📝 Request Baru          │   label         │
│  │      │       │    🔄 Request Pinjam        │                │
│  │      │       │ 🤝 Handover Aset           │                │
│  │      │       │ 🔧 Perbaikan Aset          │                │
│  │      │       └─────────────────────────────┘                │
│  │──────│                                                       │
│  │  👥  │──────→┌─────────────────────────────┐                │
│  │      │       │ MANAJEMEN PELANGGAN  (header)│               │
│  │      │       ├─────────────────────────────┤                │
│  │      │       │ 👤 Daftar Pelanggan         │                │
│  │      │       │ 📥 Manajemen Instalasi      │                │
│  │      │       │ 🔧 Manajemen Maintenance    │                │
│  │      │       │ 🏗️ Data Dismantle           │                │
│  │      │       └─────────────────────────────┘                │
│  │──────│                                                       │
│  │  🏗  │  ← Proyek (single item, direct nav)                  │
│  │──────│                                                       │
│  │  ⚙️  │──────→┌─────────────────────────────┐                │
│  │      │       │ PENGATURAN          (header) │               │
│  │      │       ├─────────────────────────────┤                │
│  │      │       │ 👤 Kelola Akun              │                │
│  │      │       │ 👥 Akun & Divisi            │                │
│  │      │       │ 📁 Kategori & Model         │                │
│  │      │       │ 💰 Data Pembelian           │                │
│  │      │       └─────────────────────────────┘                │
│  │──────│                                                       │
│  │ theme│  ← Theme toggle (sun/moon)                           │
│  │ user │  ← User avatar + logout                              │
│  └──────┘                                                       │
│                                                                  │
│  Dari screenshot:                                               │
│  - Foto menunjukkan flyout "MANAJEMEN PELANGGAN" terbuka       │
│  - Background flyout: semi-transparent dark card                │
│  - Border: subtle white/gray border                             │
│  - Rounded corners pada panel                                   │
│  - Icon + label untuk setiap item                               │
│  - Active item: highlighted dengan primary color                │
│  - Section header: uppercase, smaller font, muted color         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Behavior Flyout (dari kode)

```
┌─────────────────────────────────────────────────────────────────┐
│              FLYOUT BEHAVIOR SPECIFICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRIGGER:                                                       │
│  └── Click pada icon button saat collapsed                      │
│      (bukan hover — intentional click-based)                    │
│                                                                  │
│  POSITIONING:                                                   │
│  ├── Flyout muncul di sebelah kanan icon                       │
│  ├── top: getBoundingClientRect().top dari button               │
│  │   └── Capped: max(8, min(buttonTop, window.innerHeight-320))│
│  │       → Mencegah flyout keluar viewport                      │
│  ├── left: getBoundingClientRect().right + 12px gap             │
│  └── Position: fixed (tidak scroll dengan sidebar)              │
│                                                                  │
│  BACKDROP:                                                      │
│  ├── Fixed overlay (inset-0, z-[60])                            │
│  ├── Transparent (tidak ada dim/blur)                           │
│  └── Click backdrop → close flyout                              │
│                                                                  │
│  FLYOUT PANEL:                                                  │
│  ├── z-index: z-[61] (above backdrop)                           │
│  ├── Position: fixed                                            │
│  ├── Border radius: rounded-xl                                  │
│  ├── Min-width: 200px                                           │
│  ├── Max-height: 320px (scrollable jika overflow)               │
│  ├── Dark theme:                                                │
│  │   ├── bg: sidebar-dark-flyout                                │
│  │   ├── border: white/[0.08]                                   │
│  │   └── shadow: shadow-flyout-dark                             │
│  └── Light theme:                                               │
│      ├── bg: white                                              │
│      ├── border: gray-200                                       │
│      └── shadow: shadow-xl                                      │
│                                                                  │
│  HEADER:                                                        │
│  ├── px-4 py-3                                                  │
│  ├── Border bottom separator                                   │
│  ├── Font: sidebar-flyout-title (uppercase, tracking, small)   │
│  └── Shows parent menu label (e.g., "MANAJEMEN PELANGGAN")     │
│                                                                  │
│  ITEMS:                                                         │
│  ├── Padding: p-1.5 container                                  │
│  ├── Each item: sidebar-flyout-item class                      │
│  │   ├── Icon (w-4 h-4, opacity-70)                            │
│  │   ├── Label text                                             │
│  │   └── Hover: bg highlight                                   │
│  ├── Active item: primary color highlight                      │
│  └── Sub-sections (nested children):                            │
│      ├── Section label: sidebar-flyout-section-label            │
│      │   └── Muted color, smaller font                          │
│      └── Grandchild items indented                              │
│                                                                  │
│  CLOSE TRIGGERS:                                                │
│  ├── Click on backdrop (area outside flyout)                    │
│  ├── Click on menu item (navigates + closes)                    │
│  └── Click same icon button again (toggle)                     │
│                                                                  │
│  ONLY ONE:                                                      │
│  └── Hanya 1 flyout terbuka pada satu waktu                    │
│      (click icon lain → replace, bukan stack)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Mode Expanded — Collapsible Sub-Menu

```
┌─────────────────────────────────────────────────────────────────┐
│             EXPANDED SIDEBAR BEHAVIOR                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Width: 264px                                                   │
│                                                                  │
│  Parent menu (has children):                                    │
│  ├── Click → Toggle expand/collapse                             │
│  ├── Click JUGA navigasi ke first child (default page)          │
│  ├── Chevron (▼) rotates 180° saat expanded                   │
│  └── Expand animation: max-h transition 300ms ease-in-out      │
│                                                                  │
│  Child items:                                                   │
│  ├── Indented (pl-10)                                           │
│  ├── Smaller icon (w-4 vs w-5)                                  │
│  └── Click → Navigate to page                                  │
│                                                                  │
│  Nested children (grandchild, e.g., Request Aset):             │
│  └── Sub-group dalam expanded parent                            │
│      ├── Section label muted                                    │
│      └── Items indented further                                 │
│                                                                  │
│  Active Highlighting:                                           │
│  ├── Active leaf: primary color bg + white text                 │
│  ├── Active parent: subtle bg + bold                            │
│  └── Active indicator: left border accent (bar vertikal)        │
│                                                                  │
│  Section Dividers:                                              │
│  ├── Horizontal line (h-px, subtle color)                       │
│  └── Section label: uppercase, tracking-wide, muted             │
│      (e.g., "PUSAT ASET", "MANAJEMEN PELANGGAN")              │
│                                                                  │
│  Auto-expand:                                                   │
│  └── Parent menu auto-expand jika child aktif                   │
│      (saat navigasi via URL atau side-effect)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Collapse/Expand Toggle

```
┌─────────────────────────────────────────────────────────────────┐
│              COLLAPSE/EXPAND MECHANISM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Toggle Button:                                                 │
│  ├── Desktop only (hidden on mobile)                            │
│  ├── Icon: panelLeft (sidebar toggle icon)                      │
│  ├── Position: bottom area sidebar atau dedicated button         │
│  └── State persisted di localStorage via useUIStore              │
│                                                                  │
│  Transition:                                                    │
│  ├── Width: 72px ↔ 264px                                       │
│  ├── Duration: CSS transition (smooth)                          │
│  └── Content: icon-only ↔ icon + label                         │
│                                                                  │
│  Mobile:                                                        │
│  ├── Sidebar selalu expanded saat dibuka                        │
│  ├── Overlay mode (tidak push content)                          │
│  ├── Swipe-to-close gesture support                             │
│  └── Auto-close setelah navigasi                                │
│                                                                  │
│  State: useUIStore.isSidebarCollapsed                           │
│  └── Persisted di localStorage                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Permission-Based Filtering

```
┌─────────────────────────────────────────────────────────────────┐
│            PERMISSION-BASED MENU VISIBILITY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Function: filterVisibleItems(menuItems, userPermissions)       │
│                                                                  │
│  Logic:                                                         │
│  1. Untuk setiap menu item:                                     │
│     a. Cek item.permission terhadap user.permissions            │
│     b. Jika tidak punya permission → hide item                  │
│     c. Jika punya children → rekursif filter children           │
│     d. Jika semua children hidden → hide parent juga            │
│                                                                  │
│  Menu-Permission Mapping:                                       │
│  ├── Dashboard        → dashboard:view                          │
│  ├── Pusat Aset       → assets:view                             │
│  │   ├── Catat Aset   → assets:create                          │
│  │   ├── Stok Aset    → assets:view                             │
│  │   ├── Request Baru → requests:view:own                       │
│  │   ├── Request Pinjam→ loan-requests:view:own                 │
│  │   ├── Handover     → assets:handover                         │
│  │   └── Perbaikan    → assets:repair:manage                    │
│  ├── Manajemen Pelanggan → customers:view                       │
│  │   ├── Daftar Pelanggan → customers:view                      │
│  │   ├── Instalasi    → assets:install                          │
│  │   ├── Maintenance  → maintenances:view                       │
│  │   └── Dismantle    → assets:dismantle                        │
│  ├── Proyek           → projects:view                           │
│  └── Pengaturan                                                 │
│      ├── Kelola Akun  → account:manage                          │
│      ├── Akun & Divisi→ users:view                              │
│      ├── Kategori     → categories:view                         │
│      └── Pembelian    → assets:view-price                       │
│                                                                  │
│  Result: Setiap user hanya melihat menu yang sesuai role/perm  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Active Page Synchronization

```
┌─────────────────────────────────────────────────────────────────┐
│            ACTIVE PAGE ↔ SIDEBAR SYNC                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  URL Pathname → activePage → Sidebar Highlight                  │
│                                                                  │
│  Mapping (PathToPage):                                          │
│  /                          → dashboard                         │
│  /assets                    → registration                      │
│  /assets/new                → registration                      │
│  /stock                     → stok-aset                         │
│  /requests/asset-requests   → request-hub                       │
│  /requests/loans            → request-pinjam                    │
│  /handover                  → handover                          │
│  /repair                    → perbaikan-aset                    │
│  /customers                 → pelanggan                         │
│  /customers/installation    → customer-installation-form        │
│  /customers/maintenance     → customer-maintenance-form         │
│  /customers/dismantle       → customer-dismantle-form           │
│  /settings/profile          → kelola-akun                       │
│  /settings/users-divisions  → pengaturan-pengguna               │
│  /settings/categories       → kategori-model                    │
│  /settings/purchase-master  → data-pembelian                    │
│  /projects                  → proyek-infrastruktur              │
│                                                                  │
│  Functions:                                                      │
│  ├── isMenuActive(item, activePage) → exact match               │
│  ├── hasActiveChild(item, activePage) → recursive child check   │
│  └── Auto-expand parent when child is active                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Sidebar Footer

```
┌─────────────────────────────────────────────────────────────────┐
│                  SIDEBAR FOOTER                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Theme Toggle:                                                  │
│  ├── Sun icon (☀️) ↔ Moon icon (🌙)                            │
│  ├── Toggles dark/light mode                                    │
│  ├── State persisted via useUIStore                              │
│  └── Collapsed: icon only, Expanded: icon + "Light/Dark" label │
│                                                                  │
│  User Profile:                                                  │
│  ├── Avatar with role-based gradient border:                    │
│  │   ├── SUPER_ADMIN:    purple-500 → purple-600                │
│  │   ├── ADMIN_LOGISTIK: sky-500 → sky-600                     │
│  │   ├── ADMIN_PURCHASE: teal-500 → teal-600                   │
│  │   ├── LEADER:         indigo-500 → indigo-600               │
│  │   ├── STAFF:          slate-500 → slate-600                  │
│  │   └── TEKNISI:        orange-500 → amber-600                 │
│  │                                                               │
│  ├── Collapsed: avatar only                                     │
│  ├── Expanded: avatar + name + role badge                       │
│  └── Logout button (icon or text based on mode)                 │
│                                                                  │
│  Collapse Toggle (Desktop only):                                │
│  ├── panelLeft icon                                             │
│  └── Toggles isSidebarCollapsed                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. CSS Classes (Custom Tailwind)

```css
/* Key sidebar CSS classes (dari kode) */

.sidebar-nav-icon-btn {
  /* Collapsed mode button: centered, square, 44x44 */
  @apply relative w-11 h-11 mx-auto rounded-xl flex items-center 
         justify-center transition-all duration-200;
}

.sidebar-active-indicator {
  /* Vertical left bar for active collapsed item */
  @apply absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 
         rounded-r-full;
}

.sidebar-flyout {
  /* Flyout panel positioning */
  @apply fixed z-[61] rounded-xl border min-w-[200px] 
         animate-in fade-in-0 zoom-in-95;
}

.sidebar-flyout-title {
  /* Header text in flyout */
  @apply text-[11px] font-semibold uppercase tracking-wider;
}

.sidebar-flyout-item {
  /* Clickable item in flyout */
  @apply flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm 
         transition-colors cursor-pointer w-full;
}

.sidebar-flyout-section-label {
  /* Sub-section label in flyout */
  @apply text-[10px] font-medium uppercase tracking-wider 
         px-3 py-1.5 mt-1;
}

.sidebar-nav-item {
  /* Expanded mode parent item */
  @apply w-full flex items-center justify-between rounded-xl 
         transition-colors duration-200 group cursor-pointer;
}

.sidebar-nav-leaf {
  /* Expanded mode leaf item */
  @apply w-full flex items-center gap-3 rounded-xl 
         transition-colors duration-200;
}

.sidebar-nav-active {
  /* Active item highlight */
  @apply bg-primary-500 text-white shadow-sm shadow-primary-500/25;
}

.sidebar-section-label {
  /* Section divider label */
  @apply block text-[10px] font-semibold uppercase tracking-[0.08em] 
         mt-2 text-slate-500;
}
```

---

## 10. Catatan untuk Rebuild

1. **Click-based flyout** (bukan hover) — intentional untuk mobile-friendly & accessibility
2. **Fixed positioning** untuk flyout — tidak affected by scroll, viewport-aware capping
3. **Backdrop overlay** — transparent click-to-close area, bukan visual dim
4. **Only 1 flyout** pada satu waktu — replace, bukan stack
5. **Permission filtering** — hide menu item sepenuhnya jika user tidak punya permission
6. **Auto-expand parent** saat child active — UX penting untuk deep links
7. **Section dividers** — visual grouping di expanded mode
8. **Role gradient** pada avatar — quick visual identification role user
9. **State persistence** — collapse state + theme disimpan di localStorage
10. **Mobile: swipe-to-close** — gesture support untuk mobile UX
11. **Icon size**: parent = w-5 h-5, child = w-4 h-4 (visual hierarchy)
12. **Max-height 320px** pada flyout — scrollable jika menu panjang
