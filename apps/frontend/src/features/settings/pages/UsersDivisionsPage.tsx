import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTab } from '../components/UsersTab';
import { DivisionsTab } from '../components/DivisionsTab';
import { useUsers, useDivisions } from '../hooks';

const VALID_TABS = ['summary', 'users', 'divisions'] as const;
type TabValue = (typeof VALID_TABS)[number];

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_LOGISTIC: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader',
  STAFF: 'Staff',
};

function SummaryTab() {
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 200 });
  const { data: divisionsData, isLoading: divisionsLoading } = useDivisions({ limit: 200 });

  const isLoading = usersLoading || divisionsLoading;

  const users = usersData?.data ?? [];
  const divisions = divisionsData?.data ?? [];
  const totalUsers = usersData?.meta?.total ?? 0;
  const totalDivisions = divisionsData?.meta?.total ?? 0;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  // Per-role breakdown
  const roleCounts: Record<string, number> = {};
  for (const user of users) {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  }

  // Per-division user count
  const divisionUserCounts: Record<number, number> = {};
  for (const user of users) {
    if (user.divisionId) {
      divisionUserCounts[user.divisionId] = (divisionUserCounts[user.divisionId] || 0) + 1;
    }
  }

  const stats = [
    {
      title: 'Total Pengguna',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Divisi',
      value: totalDivisions,
      icon: Building2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'Pengguna Aktif',
      value: activeUsers,
      icon: UserCheck,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      title: 'Pengguna Nonaktif',
      value: inactiveUsers,
      icon: UserX,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-md p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Per-role breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Distribusi per Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(roleCounts).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm">{ROLE_LABELS[role] ?? role}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
                {Object.keys(roleCounts).length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada data.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-division user count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Anggota per Divisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {divisions.map((div) => (
                  <div key={div.id} className="flex items-center justify-between">
                    <span className="text-sm">{div.name}</span>
                    <Badge variant="secondary">{divisionUserCounts[div.id] ?? 0}</Badge>
                  </div>
                ))}
                {divisions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada divisi.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function UsersDivisionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'summary';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <PageContainer title="Akun & Divisi" description="Kelola akun pengguna dan divisi organisasi">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="divisions">Divisi</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <SummaryTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="divisions">
          <DivisionsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export default UsersDivisionsPage;
export const Component = UsersDivisionsPage;
