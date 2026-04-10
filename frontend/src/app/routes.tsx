import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import CRMLayout from '../components/layout/CRMLayout';
import Login        from '../pages/Login';
import Register     from '../pages/Register';
import Dashboard    from '../pages/Dashboard';
import Pipeline     from '../pages/Pipeline';
import Contacts     from '../pages/Contacts';
import Calendar     from '../pages/Calendar';
import Products     from '../pages/Products';
import Team         from '../pages/Team';
import Tags         from '../pages/Tags';
import VextRadar    from '../pages/VextRadar';
import NotFound     from '../pages/NotFound';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <CRMLayout>{children}</CRMLayout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pipeline"   element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
      <Route path="/contacts"   element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/calendar"   element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/products"   element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/team"       element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/tags"       element={<ProtectedRoute><Tags /></ProtectedRoute>} />
      <Route path="/vext-radar" element={<ProtectedRoute><VextRadar /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
