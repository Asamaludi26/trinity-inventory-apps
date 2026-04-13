import {
  LayoutDashboard,
  Package,
  BarChart3,
  ClipboardList,
  Handshake,
  Wrench,
  Users,
  Zap,
  Settings,
  User,
  UsersRound,
  Tags,
  ShoppingCart,
  HardHat,
  FileText,
  ArrowLeftRight,
  Cable,
  RotateCcw,
  TrendingDown,
  History,
  type LucideIcon,
} from 'lucide-react';

export type NavGroup = 'MANAJEMEN' | 'PROYEK' | 'SISTEM';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  group?: NavGroup;
  roles?: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  // ── MANAJEMEN ──
  {
    title: 'Pusat Aset',
    href: '/assets',
    icon: Package,
    group: 'MANAJEMEN',
    children: [
      {
        title: 'Catat Aset',
        href: '/assets',
        icon: FileText,
        roles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
      },
      {
        title: 'Stok Aset',
        href: '/assets/stock',
        icon: BarChart3,
      },
      {
        title: 'Request Aset',
        href: '/requests',
        icon: ClipboardList,
        children: [
          { title: 'Request Baru', href: '/requests', icon: ClipboardList },
          { title: 'Request Pinjam', href: '/loans', icon: ArrowLeftRight },
          { title: 'Pengembalian', href: '/returns', icon: RotateCcw },
        ],
      },
      {
        title: 'Handover Aset',
        href: '/handovers',
        icon: Handshake,
        roles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
      },
      {
        title: 'Perbaikan Aset',
        href: '/repairs',
        icon: Wrench,
        roles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
      },
    ],
  },
  {
    title: 'Manajemen Pelanggan',
    href: '/customers',
    icon: Users,
    group: 'MANAJEMEN',
    children: [
      { title: 'Daftar Pelanggan', href: '/customers', icon: Users },
      {
        title: 'Manajemen Instalasi',
        href: '/installation',
        icon: Zap,
        roles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
      },
      {
        title: 'Manajemen Maintenance',
        href: '/maintenance',
        icon: Wrench,
      },
      {
        title: 'Data Dismantle',
        href: '/dismantle',
        icon: Cable,
        roles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
      },
    ],
  },
  // ── PROYEK ──
  {
    title: 'Proyek Infrastruktur',
    href: '/projects',
    icon: HardHat,
    group: 'PROYEK',
  },
  // ── SISTEM ──
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    group: 'SISTEM',
    children: [
      { title: 'Kelola Akun', href: '/settings/profile', icon: User },
      {
        title: 'Akun & Divisi',
        href: '/settings/users-divisions',
        icon: UsersRound,
        roles: ['SUPERADMIN'],
      },
      {
        title: 'Kategori & Model',
        href: '/assets/categories',
        icon: Tags,
        roles: ['SUPERADMIN', 'ADMIN_LOGISTIK'],
      },
      {
        title: 'Data Pembelian',
        href: '/assets/purchases',
        icon: ShoppingCart,
        roles: ['SUPERADMIN', 'ADMIN_PURCHASE'],
      },
      {
        title: 'Data Depresiasi',
        href: '/assets/depreciation',
        icon: TrendingDown,
        roles: ['SUPERADMIN', 'ADMIN_PURCHASE'],
      },
      {
        title: 'Audit Trail',
        href: '/settings/audit-log',
        icon: History,
        roles: ['SUPERADMIN'],
      },
    ],
  },
];
