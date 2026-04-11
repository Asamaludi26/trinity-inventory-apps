import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTab } from '../components/UsersTab';
import { DivisionsTab } from '../components/DivisionsTab';

const VALID_TABS = ['users', 'divisions'] as const;
type TabValue = (typeof VALID_TABS)[number];

export function UsersDivisionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'users';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <PageContainer title="Akun & Divisi" description="Kelola akun pengguna dan divisi organisasi">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="divisions">Divisi</TabsTrigger>
        </TabsList>
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
