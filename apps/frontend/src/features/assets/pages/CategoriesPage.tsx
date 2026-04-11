import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks';
import type { AssetCategory } from '../types';

export function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssetCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetCategory | null>(null);
  const [formName, setFormName] = useState('');

  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const filtered = categories?.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormOpen(true);
  };

  const handleEdit = (cat: AssetCategory) => {
    setEditItem(cat);
    setFormName(cat.name);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (editItem) {
        await updateCategory.mutateAsync({ id: editItem.id, data: { name: formName.trim() } });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await createCategory.mutateAsync({ name: formName.trim() });
        toast.success('Kategori berhasil ditambahkan');
      }
      setFormOpen(false);
      setFormName('');
      setEditItem(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan kategori';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success('Kategori berhasil dihapus');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus kategori';
      toast.error(message);
    }
  };

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  return (
    <PageContainer
      title="Kategori Aset"
      description="Kelola kategori untuk klasifikasi aset"
      actions={
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead className="text-center">Jumlah Tipe</TableHead>
              <TableHead className="text-center">Jumlah Aset</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={<Layers className="h-12 w-12" />}
                    title="Belum ada kategori"
                    description="Tambahkan kategori pertama untuk mulai mengklasifikasikan aset."
                    action={
                      <Button variant="outline" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kategori
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cat, idx) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-center">{cat._count?.types ?? 0}</TableCell>
                  <TableCell className="text-center">{cat._count?.assets ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(cat)}>
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
          if (!open) {
            setEditItem(null);
            setFormName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="catName">Nama Kategori</Label>
              <Input
                id="catName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Device, Tools, Material"
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
            <Button onClick={handleSubmit} disabled={isSubmitting || !formName.trim()}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Kategori"
        description={`Apakah Anda yakin ingin menghapus kategori "${deleteTarget?.name}"? Semua tipe dan model di bawah kategori ini juga akan terpengaruh.`}
        variant="destructive"
        confirmLabel="Hapus"
        loading={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

export default CategoriesPage;
export const Component = CategoriesPage;
