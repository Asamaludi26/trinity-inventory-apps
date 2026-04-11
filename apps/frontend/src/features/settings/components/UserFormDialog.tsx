import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateUser, useUpdateUser, useActiveDivisions } from '../hooks';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/validation/settings.schema';
import type { User, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_LOGISTIK: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader',
  STAFF: 'Staff',
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const { data: divisions } = useActiveDivisions();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: isEdit
      ? {
          employeeId: user.employeeId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          divisionId: user.division?.id,
          phone: user.phone ?? '',
          password: '',
        }
      : { canDoFieldwork: false },
  });

  const selectedRole = useWatch({ control, name: 'role' });
  const selectedDivision = useWatch({ control, name: 'divisionId' });

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      const cleanData = { ...data };
      if (isEdit && !cleanData.password) {
        delete cleanData.password;
      }

      if (isEdit) {
        await updateUser.mutateAsync({ uuid: user.uuid, data: cleanData as UpdateUserFormData });
        toast.success('Pengguna berhasil diperbarui');
      } else {
        await createUser.mutateAsync(cleanData as CreateUserFormData);
        toast.success('Pengguna berhasil dibuat');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employeeId">ID Karyawan</Label>
              <Input id="employeeId" placeholder="EMP-001" {...register('employeeId')} />
              {errors.employeeId && (
                <p className="text-xs text-destructive">{errors.employeeId.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input id="fullName" placeholder="Nama lengkap" {...register('fullName')} />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@trinity.local"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">
              {isEdit ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setValue('role', val as UserRole, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Divisi</Label>
              <Select
                value={selectedDivision?.toString()}
                onValueChange={(val) =>
                  setValue('divisionId', Number(val), { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisions?.map((div) => (
                    <SelectItem key={div.id} value={div.id.toString()}>
                      {div.name} ({div.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telepon (opsional)</Label>
            <Input id="phone" placeholder="08xxxxxxxxxx" {...register('phone')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createUser.isPending || updateUser.isPending}
            >
              {isSubmitting || createUser.isPending || updateUser.isPending
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
