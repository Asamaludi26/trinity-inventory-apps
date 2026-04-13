import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/guard/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { protectedRoutes } from '@/routes/protected';
import { publicRoutes } from '@/routes/public';
import { Skeleton } from '@/components/ui/skeleton';

const AppFallback = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 p-8">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    HydrateFallback: AppFallback,
    children: [
      // Public routes (login, etc.)
      ...publicRoutes,

      // Protected routes (wrapped in AuthGuard → AppLayout)
      {
        element: <AuthGuard />,
        children: [
          // Change password page (outside AppLayout — standalone)
          {
            path: '/change-password',
            lazy: () => import('./features/auth/pages/ChangePasswordPage'),
          },
          {
            element: <AppLayout />,
            children: [
              ...protectedRoutes,
              // Catch-all 404 inside protected area
              {
                path: '*',
                lazy: () => import('./features/auth/pages/NotFoundPage'),
              },
            ],
          },
        ],
      },

      // Catch-all 404 outside protected area
      {
        path: '*',
        lazy: () => import('./features/auth/pages/NotFoundPage'),
      },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
