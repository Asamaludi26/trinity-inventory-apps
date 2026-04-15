import { type FC, useSyncExternalStore } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';

const AuthLoadingFallback: FC = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-8">
    <Skeleton className="size-12 rounded-full" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

export const AuthGuard: FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mustChangePassword = useAuthStore((state) => state.user?.mustChangePassword);
  const location = useLocation();

  // Wait for Zustand persist hydration to avoid flash redirect on page refresh
  const hasHydrated = useSyncExternalStore(useAuthStore.persist.onFinishHydration, () =>
    useAuthStore.persist.hasHydrated(),
  );

  if (!hasHydrated) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force redirect to change-password if required (except when already there)
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
};
