import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatRelative } from '../../utils/format';
import { Menu, Bell, Check, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-xl">
      <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white"><Menu size={20} /></button>
      <div className="flex-1" />

      <div className="flex items-center gap-4">
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
  );
}
