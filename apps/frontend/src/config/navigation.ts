import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Aset',
    href: '/assets',
    icon: Package,
    children: [
      { title: 'Daftar Aset', href: '/assets', icon: Package },
      { title: 'Stok Aset', href: '/assets/stock', icon: Package },
      { title: 'Kategori', href: '/assets/categories', icon: Package },
      { title: 'Tipe', href: '/assets/types', icon: Package },
      { title: 'Model', href: '/assets/models', icon: Package },
      {
        title: 'Pembelian',
        href: '/assets/purchases',
        icon: ShoppingCart,
        roles: ['SUPERADMIN', 'ADMIN_PURCHASE'],
      },
      {
        title: 'Depresiasi',
        href: '/assets/depreciation',
        icon: ShoppingCart,
        roles: ['SUPERADMIN', 'ADMIN_PURCHASE'],
      },
    ],
  },
  {
    title: 'Transaksi',
    href: '/requests',
    icon: ArrowRightLeft,
    children: [
      { title: 'Permintaan Baru', href: '/requests', icon: ArrowRightLeft },
      { title: 'Peminjaman', href: '/loans', icon: ArrowRightLeft },
      { title: 'Pengembalian', href: '/returns', icon: ArrowRightLeft },
      { title: 'Serah Terima', href: '/handovers', icon: ArrowRightLeft },
      { title: 'Lapor Rusak', href: '/repairs', icon: ArrowRightLeft },
      { title: 'Proyek', href: '/projects', icon: ArrowRightLeft },
    ],
  },
  {
    title: 'Pelanggan',
    href: '/customers',
    icon: Users,
    children: [
      { title: 'Daftar Pelanggan', href: '/customers', icon: Users },
      { title: 'Instalasi', href: '/installation', icon: Users },
      { title: 'Maintenance', href: '/maintenance', icon: Users },
      { title: 'Dismantle', href: '/dismantle', icon: Users },
    ],
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    children: [
      { title: 'Profil', href: '/settings/profile', icon: Settings },
      {
        title: 'Akun & Divisi',
        href: '/settings/users-divisions',
        icon: Settings,
        roles: ['SUPERADMIN'],
      },
    ],
  },
];
