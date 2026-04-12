import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <FileQuestion className="text-muted-foreground h-20 w-20" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground text-lg">Halaman yang Anda cari tidak ditemukan.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Kembali
        </Button>
        <Button onClick={() => navigate('/dashboard')}>Ke Dashboard</Button>
      </div>
    </div>
  );
}

export default NotFoundPage;

export const Component = NotFoundPage;
