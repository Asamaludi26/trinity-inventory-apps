import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/guard/AuthGuard';
import { protectedRoutes } from '@/routes/protected';
import { publicRoutes } from '@/routes/public';

const router = createBrowserRouter([
  // Public routes (login, etc.)
  ...publicRoutes,

  // Protected routes (wrapped in AuthGuard)
  {
    element: <AuthGuard />,
    children: protectedRoutes,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
