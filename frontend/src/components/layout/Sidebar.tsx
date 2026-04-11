import { Link, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import {
  LayoutDashboard, GitBranch, Users, CalendarDays,
  Package, User2, Tag, Radar, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pipeline',   label: 'Pipeline',  icon: GitBranch },
  { path: '/contacts',   label: 'Contatos',  icon: Users },
  { path: '/calendar',   label: 'Agenda',    icon: CalendarDays },
  { path: '/products',   label: 'Produtos',  icon: Package },
  { path: '/team',       label: 'Equipe',    icon: User2 },
  { path: '/tags',       label: 'Tags',      icon: Tag },
  { path: '/vext-radar', label: 'Vext Radar', icon: Radar },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, closeSidebar } = useUiStore();

  return (
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
  );
}
