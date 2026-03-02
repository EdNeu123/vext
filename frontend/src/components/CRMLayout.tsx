import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatRelative } from '../utils/format';
import {
  LayoutDashboard, GitBranch, Users, CalendarDays,
  Package, FileText, UsersRound, Tag, Radar,
  Menu, X, LogOut, Bell, Check,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { path: '/contacts', label: 'Contatos', icon: Users },
  { path: '/calendar', label: 'Agenda', icon: CalendarDays },
  { path: '/products', label: 'Produtos', icon: Package },
  { path: '/landing-pages', label: 'Landing Pages', icon: FileText },
  { path: '/team', label: 'Equipe', icon: UsersRound },
  { path: '/tags', label: 'Tags', icon: Tag },
  { path: '/vext-radar', label: 'Vext Radar', icon: Radar },
];

export default function CRMLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, logout, sidebarOpen, closeSidebar, toggleSidebar, notifications, unreadCount, loadNotifications, markAllAsRead } = useAppStore();
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => { loadNotifications(); }, []);

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Vext CRM
          </Link>
          <button onClick={closeSidebar} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-xl">
          <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white"><Menu size={20} /></button>
          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative text-gray-400 hover:text-white transition">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between p-3 border-b border-gray-800">
                    <span className="text-sm font-semibold">Notificações</span>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllAsRead()} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <Check size={12} /> Marcar todas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">Nenhuma notificação</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className={`p-3 border-b border-gray-800/50 ${!n.isRead ? 'bg-indigo-500/5' : ''}`}>
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                        <p className="text-[10px] text-gray-600 mt-1">{formatRelative(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-red-400 transition ml-2" title="Sair"><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
