import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDivisions, useDeleteDivision } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { DivisionFormDialog } from './DivisionFormDialog';
import type { Division } from '@/types';

export function DivisionsTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editDivision, setEditDivision] = useState<Division | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const deleteDivision = useDeleteDivision();

  const { data, isLoading } = useDivisions({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const handleEdit = (division: Division) => {
    setEditDivision(division);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditDivision(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDivision.mutateAsync(deleteTarget.uuid);
      toast.success('Divisi berhasil dihapus');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus divisi';
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama divisi, kode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Divisi
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Divisi</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Fieldwork</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Status</TableHead>
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
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Tidak ada data divisi.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((division) => (
                <TableRow key={division.uuid}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {division.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{division.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {division.description || '-'}
                  </TableCell>
                  <TableCell>
                    {division.canDoFieldwork ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Ya
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Tidak</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{division.userCount ?? 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={division.isActive ? 'default' : 'secondary'}>
                      {division.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(division)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(division)}>
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

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {data.data.length} dari {data.meta.total} divisi
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <span className="text-sm">
              {page} / {data.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <DivisionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditDivision(null);
        }}
        division={editDivision}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Divisi"
        description={`Apakah Anda yakin ingin menghapus divisi "${deleteTarget?.name}"? Aksi ini tidak dapat dibatalkan.`}
        variant="destructive"
        confirmLabel="Hapus"
        loading={deleteDivision.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
