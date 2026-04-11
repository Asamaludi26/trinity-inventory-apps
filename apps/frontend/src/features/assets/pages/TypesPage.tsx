import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories, useTypes, useCreateType, useUpdateType, useDeleteType } from '../hooks';
import type { AssetType } from '../types';

export function TypesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssetType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetType | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');

  const { data: categories } = useCategories();
  const catIdParam = categoryFilter !== 'all' ? Number(categoryFilter) : undefined;
  const { data: types, isLoading } = useTypes(catIdParam);
  const createType = useCreateType();
  const updateType = useUpdateType();
  const deleteType = useDeleteType();

  const filtered = types?.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormCategoryId('');
    setFormOpen(true);
  };

  const handleEdit = (item: AssetType) => {
    setEditItem(item);
    setFormName(item.name);
    setFormCategoryId(String(item.categoryId));
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (editItem) {
        await updateType.mutateAsync({ id: editItem.id, data: { name: formName.trim() } });
        toast.success('Tipe aset berhasil diperbarui');
      } else {
        if (!formCategoryId) return;
        await createType.mutateAsync({
          categoryId: Number(formCategoryId),
          name: formName.trim(),
        });
        toast.success('Tipe aset berhasil ditambahkan');
      }
      setFormOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan tipe aset';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteType.mutateAsync(deleteTarget.id);
      toast.success('Tipe aset berhasil dihapus');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus tipe aset';
      toast.error(message);
    }
  };

  const isSubmitting = createType.isPending || updateType.isPending;

  return (
    <PageContainer
      title="Tipe Aset"
      description="Kelola tipe aset per kategori"
      actions={
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tipe
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari tipe aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Tipe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-center">Jumlah Model</TableHead>
              <TableHead className="text-center">Jumlah Aset</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={<Tag className="h-12 w-12" />}
                    title="Belum ada tipe aset"
                    description="Tambahkan tipe aset untuk mengelompokkan model."
                    action={
                      <Button variant="outline" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Tipe
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category?.name ?? '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{item._count?.models ?? 0}</TableCell>
                  <TableCell className="text-center">{item._count?.assets ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Tipe Aset' : 'Tambah Tipe Aset'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {!editItem && (
              <div className="flex flex-col gap-2">
                <Label>Kategori</Label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="typeName">Nama Tipe</Label>
              <Input
                id="typeName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Router, Switch, Kabel"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formName.trim() || (!editItem && !formCategoryId)}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Tipe Aset"
        description={`Apakah Anda yakin ingin menghapus tipe "${deleteTarget?.name}"?`}
        variant="destructive"
        confirmLabel="Hapus"
        loading={deleteType.isPending}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

export default TypesPage;
export const Component = TypesPage;
