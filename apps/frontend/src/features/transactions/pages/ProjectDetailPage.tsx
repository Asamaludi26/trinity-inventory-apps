import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, XCircle, Play, Ban, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useProject,
  useApproveProject,
  useRejectProject,
  useExecuteProject,
  useCancelProject,
  useCompleteProject,
  useHoldProject,
  useResumeProject,
} from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function ProjectDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(uuid);
  const approveProject = useApproveProject();
  const rejectProject = useRejectProject();
  const executeProject = useExecuteProject();
  const cancelProject = useCancelProject();
  const completeProject = useCompleteProject();
  const holdProject = useHoldProject();
  const resumeProject = useResumeProject();
  const [rejectOpen, setRejectOpen] = useState(false);
  const { can } = usePermissions();

  const handleApprove = () => {
    if (!uuid || !project) return;
    approveProject.mutate(
      { uuid, version: project.version },
      {
        onSuccess: () => toast.success('Proyek berhasil disetujui'),
        onError: () => toast.error('Gagal menyetujui proyek'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!uuid || !project) return;
    rejectProject.mutate(
      { uuid, version: project.version, reason },
      {
        onSuccess: () => {
          toast.success('Proyek berhasil ditolak');
          setRejectOpen(false);
        },
        onError: () => toast.error('Gagal menolak proyek'),
      },
    );
  };

  const handleExecute = () => {
    if (!uuid || !project) return;
    executeProject.mutate(
      { uuid, version: project.version },
      {
        onSuccess: () => toast.success('Proyek berhasil dieksekusi'),
        onError: () => toast.error('Gagal mengeksekusi proyek'),
      },
    );
  };

  const handleCancel = () => {
    if (!uuid || !project) return;
    cancelProject.mutate(
      { uuid, version: project.version },
      {
        onSuccess: () => toast.success('Proyek berhasil dibatalkan'),
        onError: () => toast.error('Gagal membatalkan proyek'),
      },
    );
  };

  const handleComplete = () => {
    if (!uuid || !project) return;
    completeProject.mutate(
      { uuid, version: project.version },
      {
        onSuccess: () => toast.success('Proyek berhasil diselesaikan'),
        onError: () => toast.error('Gagal menyelesaikan proyek'),
      },
    );
  };

  const handleHold = () => {
    if (!uuid || !project) return;
    holdProject.mutate(
      { uuid, version: project.version },
      {
        onSuccess: () => toast.success('Proyek ditunda'),
        onError: () => toast.error('Gagal menunda proyek'),
      },
    );
  };

  const handleResume = () => {
    if (!uuid || !project) return;
    resumeProject.mutate(
      { uuid, version: project.version },
      {
        onSuccess: () => toast.success('Proyek dilanjutkan'),
        onError: () => toast.error('Gagal melanjutkan proyek'),
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Proyek" description="Memuat data...">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer title="Proyek Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={project.name}
      description={`Kode: ${project.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {can(P.PROJECTS_EDIT) && !['COMPLETED', 'CANCELLED'].includes(project.status) && (
            <Button variant="outline" onClick={() => navigate(`/projects/${uuid}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {project.status === 'PENDING' && can(P.PROJECTS_APPROVE) && (
            <>
              <Button variant="default" onClick={handleApprove} disabled={approveProject.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveProject.isPending ? 'Menyetujui...' : 'Approve'}
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {project.status === 'APPROVED' && can(P.PROJECTS_APPROVE) && (
            <Button variant="secondary" onClick={handleExecute} disabled={executeProject.isPending}>
              <Play className="mr-2 h-4 w-4" />
              {executeProject.isPending ? 'Mengeksekusi...' : 'Eksekusi'}
            </Button>
          )}
          {project.status === 'PENDING' && can(P.PROJECTS_CREATE) && (
            <Button variant="outline" onClick={handleCancel} disabled={cancelProject.isPending}>
              <Ban className="mr-2 h-4 w-4" />
              {cancelProject.isPending ? 'Membatalkan...' : 'Batalkan'}
            </Button>
          )}
          {project.status === 'IN_PROGRESS' && can(P.PROJECTS_APPROVE) && (
            <>
              <Button
                variant="default"
                onClick={handleComplete}
                disabled={completeProject.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {completeProject.isPending ? 'Menyelesaikan...' : 'Selesaikan'}
              </Button>
              <Button variant="outline" onClick={handleHold} disabled={holdProject.isPending}>
                <Pause className="mr-2 h-4 w-4" />
                {holdProject.isPending ? 'Menunda...' : 'Tunda'}
              </Button>
            </>
          )}
          {project.status === 'ON_HOLD' && can(P.PROJECTS_APPROVE) && (
            <Button variant="secondary" onClick={handleResume} disabled={resumeProject.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {resumeProject.isPending ? 'Melanjutkan...' : 'Lanjutkan'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Proyek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{project.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={project.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lokasi</span>
                <span className="text-sm">{project.location || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mulai</span>
                <span className="text-sm">{formatDate(project.startDate)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Selesai</span>
                <span className="text-sm">{formatDate(project.endDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deskripsi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{project.description || 'Tidak ada deskripsi.'}</p>
              <Separator className="my-4" />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dibuat Oleh</span>
                <span className="text-sm">{project.createdBy?.fullName ?? '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tugas ({project.tasks?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tenggat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!project.tasks?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada tugas
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.tasks.map((task, idx) => (
                      <TableRow key={task.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(task.dueDate)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        {project.team && project.team.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tim ({project.team.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Bergabung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.team.map((member, idx) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>{member.userId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.joinedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lampiran */}
        <AttachmentSection entityType="InfraProject" entityId={uuid} />
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectProject.isPending}
        title="Tolak Proyek"
      />
    </PageContainer>
  );
}

export default ProjectDetailPage;
export const Component = ProjectDetailPage;
