import { Link, Navigate } from 'react-router-dom';
import { Box, Users, Tag, Radio, Settings as Cog, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

interface MenuItem {
  path?: string;
  label: string;
  description: string;
  icon: typeof Users;
  action?: 'logout';
}

const ITEMS: MenuItem[] = [
  { path: '/products',   label: 'Produtos',      description: 'Catálogo e dashboard de vendas',   icon: Box },
  { path: '/team',       label: 'Equipe',        description: 'Vendedores e ranking',             icon: Users },
  { path: '/tags',       label: 'Tags',          description: 'Gestão e uso de tags',             icon: Tag },
  { path: '/vext-radar', label: 'Vext Radar',    description: 'Inteligência de churn',            icon: Radio },
  { path: '/settings',   label: 'Configurações', description: 'Preferências e conta',             icon: Cog },
  { label: 'Sair',       description: 'Encerrar sessão',                                          icon: LogOut, action: 'logout' },
];

/**
 * Esta página só faz sentido em mobile. Em desktop redireciona pra dashboard
 * (todos esses itens já aparecem na sidebar).
 */
export default function Menu() {
  const { logout } = useAuthStore();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isDesktop) return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-1 tracking-tight mb-1">Menu</h1>
      <p className="text-[13px] text-text-3 mb-5">Outras seções do app</p>

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isLogout = item.action === 'logout';

          const content = (
            <div className={`bg-surface border border-border rounded-xl p-4 flex flex-col items-start gap-2 h-full transition active:scale-[0.98] ${
              isLogout ? 'hover:border-red-300' : 'hover:border-border-2'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isLogout ? 'bg-red-50' : 'bg-accent-bg'
              }`}>
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  style={{ color: isLogout ? 'var(--red)' : 'var(--accent)' }}
                />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-text-1">{item.label}</div>
                <div className="text-[11px] text-text-3 mt-0.5 leading-tight">{item.description}</div>
              </div>
            </div>
          );

          if (isLogout) {
            return (
              <button key="logout" onClick={() => logout()} className="text-left">
                {content}
              </button>
            );
          }

          return (
            <Link key={item.path} to={item.path!}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
