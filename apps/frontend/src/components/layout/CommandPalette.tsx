import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Box,
  Building2,
  ClipboardList,
  Hammer,
  HandshakeIcon,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  TrendingDown,
  Undo2,
  Users,
  Wrench,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  keywords?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Dashboard
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard />, keywords: 'beranda home' },

  // Aset
  { label: 'Daftar Aset', path: '/assets', icon: <Box />, keywords: 'asset inventaris' },
  { label: 'Stok Aset', path: '/assets/stock', icon: <Package />, keywords: 'stok gudang' },
  {
    label: 'Kategori & Model',
    path: '/assets/categories',
    icon: <Tag />,
    keywords: 'kategori model tipe',
  },
  {
    label: 'Pembelian Aset',
    path: '/assets/purchases',
    icon: <ShoppingCart />,
    keywords: 'beli purchase pengadaan',
  },
  {
    label: 'Depresiasi',
    path: '/assets/depreciation',
    icon: <TrendingDown />,
    keywords: 'depresiasi penyusutan',
  },

  // Transaksi
  {
    label: 'Permintaan Aset',
    path: '/requests',
    icon: <ClipboardList />,
    keywords: 'request permintaan pengajuan',
  },
  { label: 'Peminjaman', path: '/loans', icon: <HandshakeIcon />, keywords: 'pinjam loan' },
  { label: 'Pengembalian', path: '/returns', icon: <Undo2 />, keywords: 'kembali return' },
  {
    label: 'Serah Terima',
    path: '/handovers',
    icon: <HandshakeIcon />,
    keywords: 'serah terima handover',
  },
  { label: 'Perbaikan', path: '/repairs', icon: <Wrench />, keywords: 'perbaikan repair servis' },
  { label: 'Proyek', path: '/projects', icon: <Hammer />, keywords: 'proyek project' },

  // Pelanggan
  {
    label: 'Pelanggan',
    path: '/customers',
    icon: <Building2 />,
    keywords: 'customer pelanggan client',
  },
  {
    label: 'Instalasi',
    path: '/installation',
    icon: <Wrench />,
    keywords: 'instalasi installation',
  },
  {
    label: 'Maintenance',
    path: '/maintenance',
    icon: <Wrench />,
    keywords: 'maintenance perawatan',
  },
  { label: 'Dismantle', path: '/dismantle', icon: <Hammer />, keywords: 'dismantle bongkar' },

  // Laporan
  {
    label: 'Laporan Keuangan',
    path: '/dashboard/finance',
    icon: <BarChart3 />,
    keywords: 'laporan keuangan finance report',
  },

  // Pengaturan
  {
    label: 'Profil Saya',
    path: '/settings/profile',
    icon: <Users />,
    keywords: 'profil akun profile',
  },
  {
    label: 'Pengguna & Divisi',
    path: '/settings/users-divisions',
    icon: <Users />,
    keywords: 'user pengguna divisi',
  },
  {
    label: 'Audit Log',
    path: '/settings/audit-log',
    icon: <Settings />,
    keywords: 'audit log history riwayat',
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenPalette = () => {
      setOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Navigasi Cepat">
      <CommandInput placeholder="Cari halaman atau fitur..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
        <CommandGroup heading="Dashboard">
          {NAV_ITEMS.filter((item) => item.path.startsWith('/dashboard')).map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords ?? ''}`}
              onSelect={() => handleSelect(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Manajemen Aset">
          {NAV_ITEMS.filter((item) => item.path.startsWith('/assets')).map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords ?? ''}`}
              onSelect={() => handleSelect(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Transaksi">
          {NAV_ITEMS.filter((item) =>
            ['/requests', '/loans', '/returns', '/handovers', '/repairs', '/projects'].some((p) =>
              item.path.startsWith(p),
            ),
          ).map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords ?? ''}`}
              onSelect={() => handleSelect(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pelanggan & Layanan">
          {NAV_ITEMS.filter((item) =>
            ['/customers', '/installation', '/maintenance', '/dismantle'].some((p) =>
              item.path.startsWith(p),
            ),
          ).map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords ?? ''}`}
              onSelect={() => handleSelect(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pengaturan">
          {NAV_ITEMS.filter((item) => item.path.startsWith('/settings')).map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords ?? ''}`}
              onSelect={() => handleSelect(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="border-t px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <CommandShortcut>Ctrl+K</CommandShortcut> untuk membuka |{' '}
          <CommandShortcut>Up/Down</CommandShortcut> navigasi |{' '}
          <CommandShortcut>Enter</CommandShortcut> pilih | <CommandShortcut>Esc</CommandShortcut>{' '}
          tutup
        </p>
      </div>
    </CommandDialog>
  );
}
