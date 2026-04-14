import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCustomer, useDeleteCustomer } from '../hooks';

export function CustomerDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(uuid ?? '');
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = () => {
    if (!uuid) return;
    deleteCustomer.mutate(uuid, {
      onSuccess: () => {
        toast.success('Pelanggan berhasil dihapus');
        navigate('/customers');
      },
      onError: () => toast.error('Gagal menghapus pelanggan'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Pelanggan" description="Memuat data...">
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

  if (!customer) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={customer.name}
      description={`Kode: ${customer.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button variant="outline" onClick={() => navigate(`/customers/${uuid}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteCustomer.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kode</span>
              <span className="font-mono text-sm">{customer.code}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nama</span>
              <span className="text-sm font-medium">{customer.name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                {customer.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Alamat</span>
              <span className="text-sm text-right max-w-[60%]">{customer.address || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Telepon</span>
              <span className="text-sm">{customer.phone || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{customer.email || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">PIC</span>
              <span className="text-sm">{customer.picName || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Telp PIC</span>
              <span className="text-sm">{customer.picPhone || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{customer._count?.installations ?? 0}</p>
                <p className="text-sm text-muted-foreground">Instalasi</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{customer._count?.maintenances ?? 0}</p>
                <p className="text-sm text-muted-foreground">Pemeliharaan</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{customer._count?.dismantles ?? 0}</p>
                <p className="text-sm text-muted-foreground">Pembongkaran</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default CustomerDetailPage;
export const Component = CustomerDetailPage;
