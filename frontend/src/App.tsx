import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppStore } from './stores/useAppStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Contacts from './pages/Contacts';
import Calendar from './pages/Calendar';
import Products from './pages/Products';
import LandingPages from './pages/LandingPages';
import Team from './pages/Team';
import Tags from './pages/Tags';
import VextRadar from './pages/VextRadar';
import NotFound from './pages/NotFound';
import CRMLayout from './components/CRMLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <CRMLayout>{children}</CRMLayout>;
}

export default function App() {
  const initAuth = useAppStore((s) => s.initAuth);

  useEffect(() => { initAuth(); }, []);

  return (
    <>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/landing-pages" element={<ProtectedRoute><LandingPages /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
        <Route path="/vext-radar" element={<ProtectedRoute><VextRadar /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
