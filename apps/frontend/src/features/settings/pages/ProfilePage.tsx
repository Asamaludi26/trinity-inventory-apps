import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Building2, Shield, KeyRound, Camera } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/features/auth/api/auth.api';
import { toast } from 'sonner';
import { useUploadAvatar } from '../hooks';

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_LOGISTIK: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader',
  STAFF: 'Staff',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Ukuran file maksimal 2 MB');
      return;
    }
    uploadAvatar.mutate(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  }

  async function handlePasswordChange() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru tidak cocok');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    if (!passwordForm.currentPassword) {
      toast.error('Password saat ini wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toast.success('Password berhasil diubah');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer title="Profil" description="Kelola profil akun Anda">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                aria-label="Ubah foto profil"
                disabled={uploadAvatar.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{user.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Shield className="mr-1 h-3 w-3" />
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings/notification-preferences')}
            >
              Preferensi Notifikasi
            </Button>
            {user.division && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {user.division.name}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info + Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Akun</CardTitle>
              <CardDescription>Detail akun Anda saat ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                    <p className="text-sm font-medium">{user.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{ROLE_LABELS[user.role] ?? user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Divisi</p>
                    <p className="text-sm font-medium">{user.division?.name ?? '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Ubah Password
              </CardTitle>
              <CardDescription>Perbarui password untuk keamanan akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                  }
                />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={
                  saving ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
              >
                {saving ? 'Menyimpan...' : 'Ubah Password'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;
export const Component = ProfilePage;
