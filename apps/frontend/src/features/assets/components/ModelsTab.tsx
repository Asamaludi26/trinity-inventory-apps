import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Box } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  useCategories,
  useTypes,
  useModels,
  useCreateModel,
  useUpdateModel,
  useDeleteModel,
} from '../hooks';
import type { AssetModel } from '../types';

export function ModelsTab() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssetModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetModel | null>(null);
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formTypeId, setFormTypeId] = useState<string>('');

  const { data: categories } = useCategories();
  const catIdForTypes = categoryFilter !== 'all' ? Number(categoryFilter) : undefined;
  const { data: typesForFilter } = useTypes(catIdForTypes);
  const { data: typesForForm } = useTypes();
  const typeIdParam = typeFilter !== 'all' ? Number(typeFilter) : undefined;
  const { data: models, isLoading } = useModels(typeIdParam);
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();

  const filtered = models?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormBrand('');
    setFormTypeId('');
    setFormOpen(true);
  };

  const handleEdit = (item: AssetModel) => {
    setEditItem(item);
    setFormName(item.name);
    setFormBrand(item.brand);
    setFormTypeId(String(item.typeId));
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formBrand.trim()) return;
    try {
      if (editItem) {
        await updateModel.mutateAsync({
          id: editItem.id,
          data: { name: formName.trim(), brand: formBrand.trim() },
        });
        toast.success('Model aset berhasil diperbarui');
      } else {
        if (!formTypeId) return;
        await createModel.mutateAsync({
          typeId: Number(formTypeId),
          name: formName.trim(),
          brand: formBrand.trim(),
        });
        toast.success('Model aset berhasil ditambahkan');
      }
      setFormOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan model aset';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteModel.mutateAsync(deleteTarget.id);
      toast.success('Model aset berhasil dihapus');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus model aset';
      toast.error(message);
    }
  };

  const isSubmitting = createModel.isPending || updateModel.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari model atau brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val);
              setTypeFilter('all');
            }}
          >
            <SelectTrigger className="w-[180px]">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {typesForFilter?.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Model
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Model</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-center">Jumlah Aset</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<Box className="h-12 w-12" />}
                    title="Belum ada model aset"
                    description="Tambahkan model aset untuk mulai mencatat inventaris."
                    action={
                      <Button variant="outline" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Model
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
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type?.name ?? '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.type?.category?.name ?? '-'}
                  </TableCell>
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
            <DialogTitle>{editItem ? 'Edit Model Aset' : 'Tambah Model Aset'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {!editItem && (
              <div className="flex flex-col gap-2">
                <Label>Tipe Aset</Label>
                <Select value={formTypeId} onValueChange={setFormTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe aset" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesForForm?.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.category?.name} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="modelName">Nama Model</Label>
              <Input
                id="modelName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Mikrotik RB750Gr3"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="modelBrand">Brand</Label>
              <Input
                id="modelBrand"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                placeholder="Contoh: Mikrotik, Ubiquiti"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting || !formName.trim() || !formBrand.trim() || (!editItem && !formTypeId)
              }
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
        title="Hapus Model Aset"
        description={`Apakah Anda yakin ingin menghapus model "${deleteTarget?.name}"?`}
        variant="destructive"
        confirmLabel="Hapus"
        loading={deleteModel.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
