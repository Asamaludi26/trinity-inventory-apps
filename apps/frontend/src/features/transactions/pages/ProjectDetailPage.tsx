import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Play,
  Ban,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUsers } from '@/features/settings/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useProject,
  useApproveProject,
  useRejectProject,
  useExecuteProject,
  useCancelProject,
  useCompleteProject,
  useHoldProject,
  useResumeProject,
  useAddProjectTask,
  useUpdateProjectTask,
  useRemoveProjectTask,
  useAddProjectMaterial,
  useRemoveProjectMaterial,
  useAddProjectTeamMember,
  useRemoveProjectTeamMember,
} from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';

const TASK_STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'] as const;

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
  const { data: usersData } = useUsers({ limit: 200 });
  const approveProject = useApproveProject();
  const rejectProject = useRejectProject();
  const executeProject = useExecuteProject();
  const cancelProject = useCancelProject();
  const completeProject = useCompleteProject();
  const holdProject = useHoldProject();
  const resumeProject = useResumeProject();
  const addTask = useAddProjectTask();
  const updateTask = useUpdateProjectTask();
  const removeTask = useRemoveProjectTask();
  const addMaterial = useAddProjectMaterial();
  const removeMaterial = useRemoveProjectMaterial();
  const addTeamMember = useAddProjectTeamMember();
  const removeTeamMember = useRemoveProjectTeamMember();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('1');
  const [materialNote, setMaterialNote] = useState('');
  const [teamUserId, setTeamUserId] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const { can } = usePermissions();

  const users = usersData?.data ?? [];
  const userLabelById = new Map(users.map((user) => [user.id, `${user.fullName} (${user.role})`]));
  const canManageTasks = can(P.PROJECTS_MANAGE_TASKS);
  const canManageMaterials = can(P.PROJECTS_EDIT);
  const canManageTeam = can(P.PROJECTS_MANAGE_TEAM);

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

  const handleAddTask = () => {
    if (!uuid || !taskTitle.trim()) return;
    addTask.mutate(
      {
        uuid,
        data: {
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          assigneeId: taskAssigneeId ? Number(taskAssigneeId) : undefined,
          dueDate: taskDueDate || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Tugas proyek ditambahkan');
          setTaskTitle('');
          setTaskDescription('');
          setTaskDueDate('');
          setTaskAssigneeId('');
        },
        onError: () => toast.error('Gagal menambahkan tugas proyek'),
      },
    );
  };

  const handleTaskStatusChange = (taskId: number, status: string) => {
    if (!uuid) return;
    updateTask.mutate(
      { uuid, taskId, data: { status } },
      {
        onSuccess: () => toast.success('Status tugas diperbarui'),
        onError: () => toast.error('Gagal memperbarui status tugas'),
      },
    );
  };

  const handleRemoveTask = (taskId: number) => {
    if (!uuid) return;
    removeTask.mutate(
      { uuid, taskId },
      {
        onSuccess: () => toast.success('Tugas proyek dihapus'),
        onError: () => toast.error('Gagal menghapus tugas proyek'),
      },
    );
  };

  const handleAddMaterial = () => {
    if (!uuid || !materialDescription.trim()) return;
    addMaterial.mutate(
      {
        uuid,
        data: {
          description: materialDescription.trim(),
          quantity: Number(materialQuantity) || 1,
          note: materialNote.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Material proyek ditambahkan');
          setMaterialDescription('');
          setMaterialQuantity('1');
          setMaterialNote('');
        },
        onError: () => toast.error('Gagal menambahkan material proyek'),
      },
    );
  };

  const handleRemoveMaterial = (materialId: number) => {
    if (!uuid) return;
    removeMaterial.mutate(
      { uuid, materialId },
      {
        onSuccess: () => toast.success('Material proyek dihapus'),
        onError: () => toast.error('Gagal menghapus material proyek'),
      },
    );
  };

  const handleAddTeamMember = () => {
    if (!uuid || !teamUserId || !teamRole.trim()) return;
    addTeamMember.mutate(
      {
        uuid,
        data: { userId: Number(teamUserId), role: teamRole.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Anggota tim ditambahkan');
          setTeamUserId('');
          setTeamRole('');
        },
        onError: () => toast.error('Gagal menambahkan anggota tim'),
      },
    );
  };

  const handleRemoveTeamMember = (memberId: number) => {
    if (!uuid) return;
    removeTeamMember.mutate(
      { uuid, memberId },
      {
        onSuccess: () => toast.success('Anggota tim dihapus'),
        onError: () => toast.error('Gagal menghapus anggota tim'),
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
              {project.progress !== undefined && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progress Tugas</span>
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
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
          <CardContent className="space-y-4">
            {canManageTasks && (
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="task-title">Judul tugas</Label>
                  <Input
                    id="task-title"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Contoh: Survey lokasi backbone"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="task-description">Deskripsi</Label>
                  <Textarea
                    id="task-description"
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    placeholder="Detail pekerjaan atau catatan teknis"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">PIC</Label>
                  <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">Tenggat</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={taskDueDate}
                    onChange={(event) => setTaskDueDate(event.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleAddTask} disabled={addTask.isPending || !taskTitle.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    {addTask.isPending ? 'Menyimpan...' : 'Tambah Tugas'}
                  </Button>
                </div>
              </div>
            )}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tenggat</TableHead>
                    {canManageTasks && <TableHead className="w-24 text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!project.tasks?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={canManageTasks ? 6 : 5}
                        className="text-center text-muted-foreground"
                      >
                        Belum ada tugas
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.tasks.map((task, idx) => (
                      <TableRow key={task.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.description || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {task.assigneeId
                            ? (userLabelById.get(task.assigneeId) ?? `User #${task.assigneeId}`)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {canManageTasks ? (
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleTaskStatusChange(task.id, value)}
                            >
                              <SelectTrigger className="w-full min-w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TASK_STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{task.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(task.dueDate)}
                        </TableCell>
                        {canManageTasks && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTask(task.id)}
                              disabled={removeTask.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Material ({project.materials?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManageMaterials && (
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="material-description">Deskripsi material</Label>
                  <Input
                    id="material-description"
                    value={materialDescription}
                    onChange={(event) => setMaterialDescription(event.target.value)}
                    placeholder="Contoh: Kabel FO single mode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-quantity">Jumlah</Label>
                  <Input
                    id="material-quantity"
                    type="number"
                    min="1"
                    value={materialQuantity}
                    onChange={(event) => setMaterialQuantity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-note">Catatan</Label>
                  <Input
                    id="material-note"
                    value={materialNote}
                    onChange={(event) => setMaterialNote(event.target.value)}
                    placeholder="Opsional"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={handleAddMaterial}
                    disabled={addMaterial.isPending || !materialDescription.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {addMaterial.isPending ? 'Menyimpan...' : 'Tambah Material'}
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                    {canManageMaterials && <TableHead className="w-24 text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!project.materials?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={canManageMaterials ? 5 : 4}
                        className="text-center text-muted-foreground"
                      >
                        Belum ada material
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.materials.map((material, idx) => (
                      <TableRow key={material.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{material.description}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {material.note || '-'}
                        </TableCell>
                        {canManageMaterials && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMaterial(material.id)}
                              disabled={removeMaterial.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tim ({project.team?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManageTeam && (
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="team-user">User</Label>
                  <Select value={teamUserId} onValueChange={setTeamUserId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-role">Peran di proyek</Label>
                  <Input
                    id="team-role"
                    value={teamRole}
                    onChange={(event) => setTeamRole(event.target.value)}
                    placeholder="Contoh: Supervisor Lapangan"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={handleAddTeamMember}
                    disabled={addTeamMember.isPending || !teamUserId || !teamRole.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {addTeamMember.isPending ? 'Menyimpan...' : 'Tambah Anggota'}
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Bergabung</TableHead>
                    {canManageTeam && <TableHead className="w-24 text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!project.team?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={canManageTeam ? 5 : 4}
                        className="text-center text-muted-foreground"
                      >
                        Belum ada anggota tim
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.team.map((member, idx) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          {userLabelById.get(member.userId) ?? `User #${member.userId}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.joinedAt)}
                        </TableCell>
                        {canManageTeam && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTeamMember(member.id)}
                              disabled={removeTeamMember.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
