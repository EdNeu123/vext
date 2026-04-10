import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import AppRoutes from './app/routes';

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => { initAuth(); }, []);

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppRoutes />
    </>
  );
}
