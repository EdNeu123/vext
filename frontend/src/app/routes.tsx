import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import CRMLayout from '../components/layout/CRMLayout';
import Login             from '../pages/Login';
import Register          from '../pages/Register';
import WorkspaceSelector  from '../pages/WorkspaceSelector';
import Dashboard          from '../pages/Dashboard';
import Pipeline           from '../pages/Pipeline';
import Contacts           from '../pages/Contacts';
import Calendar           from '../pages/Calendar';
import Products           from '../pages/Products';
import Team                from '../pages/Team';
import Tags                from '../pages/Tags';
import VextRadar           from '../pages/VextRadar';
import Settings            from '../pages/Settings';
import Menu                 from '../pages/Menu';
import NotFound             from '../pages/NotFound';

/** Rota pública: redireciona autenticados para /workspace */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/workspace" replace />;
  return <>{children}</>;
}

/** Rota autenticada: redireciona não-autenticados para /login (não exige equipe ativa) */
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Rota de workspace: exige autenticação E equipe ativa; sem ela, vai para /workspace */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { activeTeam } = useTeamStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!activeTeam) return <Navigate to="/workspace" replace />;
  return <CRMLayout>{children}</CRMLayout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Públicas — redireciona autenticados para /workspace */}
      <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

      {/* Seletor de workspace — autenticado, sem exigir equipe ativa */}
      <Route path="/workspace" element={<AuthRoute><WorkspaceSelector /></AuthRoute>} />

      {/* Raiz -> workspace (que por sua vez redireciona conforme o estado de auth) */}
      <Route path="/" element={<Navigate to="/workspace" replace />} />

      {/* Rotas de negócio — exigem equipe ativa */}
      <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pipeline"   element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
      <Route path="/contacts"   element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/calendar"   element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/products"   element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/team"       element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/tags"       element={<ProtectedRoute><Tags /></ProtectedRoute>} />
      <Route path="/vext-radar" element={<ProtectedRoute><VextRadar /></ProtectedRoute>} />
      <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/menu"       element={<ProtectedRoute><Menu /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
