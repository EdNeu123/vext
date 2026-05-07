import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import Sidebar from './Sidebar';
import MobileTabBar from './MobileTabBar';
import Header from './Header';

export default function CRMLayout({ children }: { children: ReactNode }) {
  const { loadNotifications } = useNotificationStore();
  const location = useLocation();

  useEffect(() => { loadNotifications(); }, []);

  return (
    <div className="h-screen flex bg-bg text-text-1 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />

        {/* Conteúdo: padding bottom em mobile pra tab bar (h-14 + safe-area) não cobrir.
            Em desktop, padding modesto pra dar respiro mas sem sobrar muito espaço branco. */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <div key={location.pathname} className="page-enter h-full">
            {children}
          </div>
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
