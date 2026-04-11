import { useQuery } from '@tanstack/react-query';
import { Package, ClipboardList, Users, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/useAuthStore';
import { dashboardApi } from '../api';
import { StatCard, RecentActivityTable } from '../components';

export function DivisionDashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'division', 'stats'],
    queryFn: () => dashboardApi.getDivisionStats(),
    select: (res) => res.data.data,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['dashboard', 'division', 'members'],
    queryFn: () => dashboardApi.getDivisionMembers(),
    select: (res) => res.data.data,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(5),
    select: (res) => res.data.data,
  });

  const divisionName = user?.division?.name ?? 'Divisi';

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aset Divisi"
          value={statsData?.divisionAssets ?? 0}
          icon={Package}
          isLoading={statsLoading}
        />
        <StatCard
          title="Request Pending"
          value={statsData?.pendingRequests ?? 0}
          icon={ClipboardList}
          variant={statsData?.pendingRequests ? 'warning' : 'default'}
          isLoading={statsLoading}
        />
        <StatCard
          title="Member Aktif"
          value={statsData?.activeMembers ?? 0}
          icon={Users}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pinjaman Tim"
          value={statsData?.teamLoans ?? 0}
          icon={ArrowLeftRight}
          isLoading={statsLoading}
        />
      </div>

      {/* Division Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Anggota {divisionName} & Aset yang Dipegang
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : !members || members.length === 0 ? (
            <EmptyState
              title="Belum ada data anggota"
              description="Data anggota divisi akan muncul di sini"
              className="py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Jumlah Aset</TableHead>
                  <TableHead>Aset Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{member.role}</TableCell>
                    <TableCell className="text-right">{member.assetCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.lastAsset || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <RecentActivityTable activities={activities ?? []} isLoading={activitiesLoading} />
    </div>
  );
}
