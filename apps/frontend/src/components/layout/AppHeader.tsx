import { Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Search, Sun, User } from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NotificationDropdown } from './NotificationDropdown';
import { CommandPalette } from './CommandPalette';

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_LOGISTIK: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader',
  STAFF: 'Staff',
};

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  finance: 'Keuangan',
  operations: 'Operasional',
  division: 'Divisi',
  personal: 'Personal',
  assets: 'Pusat Aset',
  stock: 'Stok Aset',
  categories: 'Kategori',
  types: 'Tipe',
  models: 'Model',
  purchases: 'Pembelian',
  depreciation: 'Depresiasi',
  requests: 'Request Baru',
  loans: 'Peminjaman',
  returns: 'Pengembalian',
  handovers: 'Serah Terima',
  repairs: 'Perbaikan',
  projects: 'Proyek',
  customers: 'Pelanggan',
  installation: 'Instalasi',
  installations: 'Instalasi',
  maintenance: 'Maintenance',
  dismantle: 'Dismantle',
  dismantles: 'Dismantle',
  notifications: 'Notifikasi',
  settings: 'Pengaturan',
  profile: 'Profil',
  'users-divisions': 'Akun & Divisi',
  users: 'Pengguna',
  divisions: 'Divisi',
  'audit-log': 'Audit Log',
  new: 'Baru',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useUIStore();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {pathSegments.map((segment, index) => {
            const path = '/' + pathSegments.slice(0, index + 1).join('/');
            const label = ROUTE_LABELS[segment] ?? segment;
            const isLast = index === pathSegments.length - 1;

            return (
              // ✅ Menggunakan Fragment agar Separator dan Item sejajar
              <Fragment key={path}>
                {/* Separator dipanggil sebelum Item (kecuali elemen pertama) */}
                {index > 0 && <BreadcrumbSeparator />}

                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Global search trigger */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground w-44 justify-between"
          onClick={() => {
            window.dispatchEvent(new Event('open-command-palette'));
          }}
          aria-label="Cari halaman (Ctrl+K)"
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5" />
            <span className="text-xs">Cari...</span>
          </span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
            Ctrl+K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => {
            window.dispatchEvent(new Event('open-command-palette'));
          }}
          aria-label="Cari halaman"
        >
          <Search className="size-4" />
        </Button>

        <CommandPalette />
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Ganti tema">
          {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{user?.fullName ?? 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 size-4" />
              Kelola Akun
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="mr-2 size-4" />
              ) : (
                <Sun className="mr-2 size-4" />
              )}
              {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
