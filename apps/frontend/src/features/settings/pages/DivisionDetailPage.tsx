import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Users, Hash, FileText, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDivision, useDeleteDivision } from '../hooks';

export function DivisionDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: division, isLoading } = useDivision(uuid);
  const deleteDivision = useDeleteDivision();

  const handleDelete = () => {
    if (!uuid) return;
    deleteDivision.mutate(uuid, {
      onSuccess: () => {
        toast.success('Divisi berhasil dihapus');
        navigate('/settings/users-divisions?tab=divisions');
      },
      onError: () => toast.error('Gagal menghapus divisi'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Divisi" description="Memuat data...">
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

  if (!division) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button
          variant="outline"
          onClick={() => navigate('/settings/users-divisions?tab=divisions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={division.name}
      description={`Kode: ${division.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/settings/users-divisions?tab=divisions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteDivision.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Divisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Kode</p>
                <p className="text-sm font-medium">{division.code}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Deskripsi</p>
                <p className="text-sm font-medium">{division.description ?? '-'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pekerjaan Lapangan</p>
                <Badge variant={division.canDoFieldwork ? 'default' : 'secondary'}>
                  {division.canDoFieldwork ? 'Ya' : 'Tidak'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={division.isActive ? 'default' : 'secondary'}>
                {division.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Anggota ({division.userCount ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {division.users && division.users.length > 0 ? (
              <ul className="space-y-2">
                {division.users.map((user) => (
                  <li key={user.uuid} className="flex items-center justify-between text-sm">
                    <span>{user.fullName}</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada anggota</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default DivisionDetailPage;
export const Component = DivisionDetailPage;
