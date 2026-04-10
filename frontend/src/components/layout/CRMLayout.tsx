import { ReactNode, useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useNotificationStore } from '../../store/notificationStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function CRMLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen, closeSidebar } = useUiStore();
  const { loadNotifications } = useNotificationStore();

  useEffect(() => { loadNotifications(); }, []);

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
