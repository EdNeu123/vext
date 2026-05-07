import { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatRelative } from '../../utils/format';
import { Bell, Sun, Moon } from 'lucide-react';

export default function Header() {
  const { dark, toggleDark } = useUiStore();
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="h-14 flex items-center px-4 sm:px-6 gap-3 bg-surface border-b border-border flex-shrink-0">
      <div className="flex-1" />

      {/* Toggle Light / Dark */}
      <button
        onClick={toggleDark}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 border border-border text-text-2 text-xs font-medium hover:text-text-1 transition"
        title={dark ? 'Mudar para claro' : 'Mudar para escuro'}
      >
        {dark ? <><Sun size={13} /> Light</> : <><Moon size={13} /> Dark</>}
      </button>

      {/* Notificações */}
      <div className="relative">
        <button
          onClick={() => setShowNotif((v) => !v)}
          className="relative text-text-2 hover:text-text-1 transition p-1"
          aria-label="Notificações"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 min-w-[15px] h-[15px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: 'var(--red)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotif && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
            <div className="absolute right-0 top-9 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-[13px] font-semibold text-text-1">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] text-accent hover:opacity-80 transition font-medium"
                  >
                    Marcar todas
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-text-3 text-center">Nenhuma notificação</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-2.5 border-b border-border ${!n.isRead ? 'bg-accent-bg' : ''}`}
                  >
                    <p className="text-[13px] font-medium text-text-1">{n.title}</p>
                    {n.message && <p className="text-[11px] text-text-3 mt-0.5">{n.message}</p>}
                    <p className="text-[10px] text-text-3 mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
