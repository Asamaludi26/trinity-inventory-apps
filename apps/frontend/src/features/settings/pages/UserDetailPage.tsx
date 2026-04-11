import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Shield, Mail, Phone, Building2, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser, useDeleteUser } from '../hooks';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_LOGISTIK: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader',
  STAFF: 'Staff',
};

const ROLE_COLORS: Record<UserRole, string> = {
  SUPERADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  ADMIN_LOGISTIK: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ADMIN_PURCHASE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  LEADER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export function UserDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser(uuid);
  const deleteUser = useDeleteUser();

  const handleDelete = () => {
    if (!uuid) return;
    deleteUser.mutate(uuid, {
      onSuccess: () => {
        toast.success('Akun berhasil dihapus');
        navigate('/settings/users-divisions?tab=users');
      },
      onError: () => toast.error('Gagal menghapus akun'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Akun" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/settings/users-divisions?tab=users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={user.fullName}
      description={`ID Karyawan: ${user.employeeId}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/settings/users-divisions?tab=users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ID Karyawan</p>
                <p className="text-sm font-medium">{user.employeeId}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <p className="text-sm font-medium">{user.phone ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role & Divisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Divisi</p>
                <p className="text-sm font-medium">
                  {user.division ? `${user.division.code} — ${user.division.name}` : '-'}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Login Terakhir</p>
              <p className="text-sm font-medium">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString('id-ID')
                  : 'Belum pernah login'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default UserDetailPage;
export const Component = UserDetailPage;
