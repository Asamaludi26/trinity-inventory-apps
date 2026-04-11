import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, ShieldCheck, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTab } from '../components/UsersTab';
import { DivisionsTab } from '../components/DivisionsTab';
import { useUsers, useDivisions } from '../hooks';

const VALID_TABS = ['summary', 'users', 'divisions'] as const;
type TabValue = (typeof VALID_TABS)[number];

function SummaryTab() {
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 1 });
  const { data: divisionsData, isLoading: divisionsLoading } = useDivisions({ limit: 1 });

  const isLoading = usersLoading || divisionsLoading;

  const totalUsers = usersData?.meta?.total ?? 0;
  const totalDivisions = divisionsData?.meta?.total ?? 0;

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
      value: totalUsers,
      icon: UserCheck,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      title: 'Role Tersedia',
      value: 5,
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  return (
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
