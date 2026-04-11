import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesTab } from '../components/CategoriesTab';
import { TypesTab } from '../components/TypesTab';
import { ModelsTab } from '../components/ModelsTab';

const VALID_TABS = ['categories', 'types', 'models'] as const;
type TabValue = (typeof VALID_TABS)[number];

export function CategoriesModelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'categories';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <PageContainer
      title="Kategori & Model"
      description="Kelola hirarki kategori, tipe, dan model aset"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="types">Tipe Aset</TabsTrigger>
          <TabsTrigger value="models">Model Aset</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="types">
          <TypesTab />
        </TabsContent>
        <TabsContent value="models">
          <ModelsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export default CategoriesModelsPage;
export const Component = CategoriesModelsPage;
