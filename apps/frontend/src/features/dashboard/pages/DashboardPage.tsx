import { PageContainer } from '../../../components/layout/PageContainer';

export function DashboardPage() {
  return (
    <PageContainer title="Dashboard" description="Ringkasan inventaris Anda">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Dashboard cards will be implemented here */}
        <p className="text-muted-foreground col-span-full text-center py-12">
          Dashboard sedang dikembangkan.
        </p>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
export const Component = DashboardPage;
