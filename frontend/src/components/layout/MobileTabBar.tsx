import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Filter, User, Calendar, MoreHorizontal } from 'lucide-react';

interface TabItem {
  path: string;
  label: string;
  icon: typeof LayoutGrid;
}

const TABS: TabItem[] = [
  { path: '/dashboard', label: 'Dash',     icon: LayoutGrid },
  { path: '/pipeline',  label: 'Pipeline', icon: Filter },
  { path: '/contacts',  label: 'Contatos', icon: User },
  { path: '/calendar',  label: 'Agenda',   icon: Calendar },
  { path: '/menu',      label: 'Mais',     icon: MoreHorizontal },
];

export default function MobileTabBar() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface border-t border-border z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 h-14">
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                isActive ? 'text-accent' : 'text-text-3 hover:text-text-1'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
