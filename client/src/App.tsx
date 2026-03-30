import { RouterProvider } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { router } from './routes';

export function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Loading SmartWallet...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
