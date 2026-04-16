import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks';
import { useActiveDivisions } from '@/features/settings/hooks';
import type { AssetCategory, AssetClassification } from '../types';

export function CategoriesTab() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssetCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formClassification, setFormClassification] = useState<AssetClassification>('ASSET');
  const [formCustomerInstallable, setFormCustomerInstallable] = useState(false);
  const [formProjectAsset, setFormProjectAsset] = useState(false);
  const [formDivisionIds, setFormDivisionIds] = useState<number[]>([]);

  const { data: categories = [], isLoading } = useCategories();
  const { data: divisions = [] } = useActiveDivisions();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const validCategories: AssetCategory[] = Array.isArray(categories)
    ? categories
    : (categories as { data?: AssetCategory[] })?.data || [];

  const filtered = validCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const resetForm = () => {
    setFormName('');
    setFormClassification('ASSET');
    setFormCustomerInstallable(false);
    setFormProjectAsset(false);
    setFormDivisionIds([]);
    setEditItem(null);
  };

  const handleAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (cat: AssetCategory) => {
    setEditItem(cat);
    setFormName(cat.name);
    setFormClassification(cat.defaultClassification || 'ASSET');
    setFormCustomerInstallable(cat.isCustomerInstallable ?? false);
    setFormProjectAsset(cat.isProjectAsset ?? false);
    setFormDivisionIds(cat.divisions?.map((d) => d.division.id) ?? []);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      const payload = {
        name: formName.trim(),
        defaultClassification: formClassification,
        isCustomerInstallable: formCustomerInstallable,
        isProjectAsset: formProjectAsset,
        divisionIds: formDivisionIds,
      };
      if (editItem) {
        await updateCategory.mutateAsync({ id: editItem.id, data: payload });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await createCategory.mutateAsync(payload);
        toast.success('Kategori berhasil ditambahkan');
      }
      setFormOpen(false);
      resetForm();
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

  const toggleDivision = (divId: number) => {
    setFormDivisionIds((prev) =>
      prev.includes(divId) ? prev.filter((id) => id !== divId) : [...prev, divId],
    );
  };

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  const validDivisions = Array.isArray(divisions)
    ? divisions
    : (divisions as { data?: { id: number; name: string; code: string }[] })?.data || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Klasifikasi</TableHead>
              <TableHead className="text-center">Pelanggan</TableHead>
              <TableHead className="text-center">Proyek</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead className="text-center">Tipe</TableHead>
              <TableHead className="text-center">Aset</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={9}>
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
                  <TableCell>
                    <Badge
                      variant={cat.defaultClassification === 'MATERIAL' ? 'secondary' : 'default'}
                    >
                      {cat.defaultClassification === 'MATERIAL' ? 'Material' : 'Aset'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {cat.isCustomerInstallable ? '✓' : '—'}
                  </TableCell>
                  <TableCell className="text-center">{cat.isProjectAsset ? '✓' : '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {cat.divisions?.map((d) => (
                        <Badge key={d.division.id} variant="outline" className="text-xs">
                          {d.division.code}
                        </Badge>
                      ))}
                      {(!cat.divisions || cat.divisions.length === 0) && (
                        <span className="text-muted-foreground text-xs">Semua</span>
                      )}
                    </div>
                  </TableCell>
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
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Nama */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="catName">Nama Kategori</Label>
              <Input
                id="catName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Perangkat Jaringan, Kabel, Alat Kerja"
              />
            </div>

            {/* Klasifikasi Default */}
            <div className="flex flex-col gap-2">
              <Label>Klasifikasi Default</Label>
              <Select
                value={formClassification}
                onValueChange={(val) => setFormClassification(val as AssetClassification)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSET">Aset (Individual)</SelectItem>
                  <SelectItem value="MATERIAL">Material (Habis Pakai)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Klasifikasi default untuk tipe & model di bawah kategori ini. Dapat di-override per
                tipe.
              </p>
            </div>

            {/* Opsi Tambahan */}
            <div className="flex flex-col gap-3">
              <Label>Opsi Tambahan</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="customerInstallable"
                  checked={formCustomerInstallable}
                  onCheckedChange={(checked) => setFormCustomerInstallable(checked === true)}
                />
                <Label htmlFor="customerInstallable" className="font-normal cursor-pointer">
                  Dapat dipasang ke pelanggan
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Muncul di form instalasi & maintenance pelanggan
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="projectAsset"
                  checked={formProjectAsset}
                  onCheckedChange={(checked) => setFormProjectAsset(checked === true)}
                />
                <Label htmlFor="projectAsset" className="font-normal cursor-pointer">
                  Dapat dipasang ke proyek
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Muncul di form proyek infrastruktur
              </p>
            </div>

            {/* Hak Akses Divisi */}
            <div className="flex flex-col gap-2">
              <Label>Hak Akses Divisi</Label>
              <p className="text-xs text-muted-foreground">
                Pilih divisi yang dapat mengakses kategori ini. Kosongkan untuk semua divisi.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {validDivisions.map((div) => (
                  <div key={div.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`div-${div.id}`}
                      checked={formDivisionIds.includes(div.id)}
                      onCheckedChange={() => toggleDivision(div.id)}
                    />
                    <Label htmlFor={`div-${div.id}`} className="font-normal cursor-pointer text-sm">
                      {div.name}
                    </Label>
                  </div>
                ))}
                {validDivisions.length === 0 && (
                  <p className="col-span-2 text-xs text-muted-foreground">Belum ada divisi</p>
                )}
              </div>
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
    </div>
  );
}
