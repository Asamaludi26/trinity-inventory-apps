import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDivision, useUpdateDivision } from '../hooks';
import {
  createDivisionSchema,
  updateDivisionSchema,
  type CreateDivisionFormData,
  type UpdateDivisionFormData,
} from '@/validation/settings.schema';
import type { Division } from '@/types';

interface DivisionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division | null;
}

export function DivisionFormDialog({ open, onOpenChange, division }: DivisionFormDialogProps) {
  const isEdit = !!division;
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateDivisionFormData | UpdateDivisionFormData>({
    resolver: zodResolver(isEdit ? updateDivisionSchema : createDivisionSchema),
    defaultValues: isEdit
      ? {
          name: division.name,
          code: division.code,
          description: division.description ?? '',
          canDoFieldwork: division.canDoFieldwork,
        }
      : { canDoFieldwork: false },
  });

  const canDoFieldwork = useWatch({ control, name: 'canDoFieldwork' });

  const onSubmit = async (data: CreateDivisionFormData | UpdateDivisionFormData) => {
    try {
      if (isEdit) {
        await updateDivision.mutateAsync({
          uuid: division.uuid,
          data: data as UpdateDivisionFormData,
        });
        toast.success('Divisi berhasil diperbarui');
      } else {
        await createDivision.mutateAsync(data as CreateDivisionFormData);
        toast.success('Divisi berhasil dibuat');
      }
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Terjadi kesalahan';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Divisi' : 'Tambah Divisi'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nama Divisi</Label>
              <Input id="name" placeholder="Nama divisi" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Kode</Label>
              <Input id="code" placeholder="TEK" className="uppercase" {...register('code')} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi divisi..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="canDoFieldwork"
              checked={canDoFieldwork}
              onChange={(e) => setValue('canDoFieldwork', e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="canDoFieldwork" className="text-sm font-normal cursor-pointer">
              Dapat melakukan pekerjaan lapangan
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createDivision.isPending || updateDivision.isPending}
            >
              {isSubmitting || createDivision.isPending || updateDivision.isPending
                ? 'Menyimpan...'
                : isEdit
                  ? 'Perbarui'
                  : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
