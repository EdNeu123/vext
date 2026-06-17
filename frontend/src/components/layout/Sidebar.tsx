import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { useNotificationStore } from '../../store/notificationStore';
import Avatar from '../ui/Avatar';
import { initialsOf, colorForName } from '../../utils/avatar';
import type { ReactNode } from 'react';
import logoVext from '../../assets/img/logo.png';

/* ──────────────────────────────────────────────────────────────
   Ícones — SVGs portados do vext-layout.jsx do design system.
   strokeWidth 1.8, traço fino refinado. Cor herdada via currentColor.
   ────────────────────────────────────────────────────────────── */

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IconDashboard = () => (
  <Icon>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);
const IconPipeline = () => (
  <Icon>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Icon>
);
const IconContacts = () => (
  <Icon>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
  </Icon>
);
const IconCalendar = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="9" cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="16" r="1" fill="currentColor" />
  </Icon>
);
const IconProducts = () => (
  <Icon>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </Icon>
);
const IconTeam = IconContacts;
const IconTeamSwitch = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="text-accent">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);
const IconTags = () => (
  <Icon>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Icon>
);
const IconRadar = () => (
  <Icon>
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
  </Icon>
);
const IconSettings = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
);

const IconLogout = () => (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

/* ──────────────────────────────────────────────────────────────
   NAV_ITEMS — portado do design (sem Landing Pages, conforme decidido)
   Settings vai pra rota nova /settings (placeholder no momento)
   ────────────────────────────────────────────────────────────── */

type NavEntry =
  | { kind: 'item'; path: string; label: string; icon: () => JSX.Element; badgeKey?: string }
  | { kind: 'separator'; label: string };

const NAV_ITEMS: NavEntry[] = [
  { kind: 'item', path: '/dashboard',  label: 'Dashboard',  icon: IconDashboard },
  { kind: 'item', path: '/pipeline',   label: 'Pipeline',   icon: IconPipeline,  badgeKey: 'pipeline' },
  { kind: 'item', path: '/contacts',   label: 'Contatos',   icon: IconContacts,  badgeKey: 'contacts' },
  { kind: 'item', path: '/calendar',   label: 'Agenda',     icon: IconCalendar,  badgeKey: 'calendar' },
  { kind: 'item', path: '/products',   label: 'Produtos',   icon: IconProducts,  badgeKey: 'products' },
  { kind: 'separator', label: 'Gestão' },
  { kind: 'item', path: '/team',       label: 'Equipe',     icon: IconTeam,      badgeKey: 'team' },
  { kind: 'item', path: '/tags',       label: 'Tags',       icon: IconTags,      badgeKey: 'tags' },
  { kind: 'item', path: '/vext-radar', label: 'Vext Radar', icon: IconRadar,     badgeKey: 'vext-radar' },
  { kind: 'separator', label: 'Sistema' },
  { kind: 'item', path: '/settings',   label: 'Configurações', icon: IconSettings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeTeam } = useTeamStore();
  const { unreadCount } = useNotificationStore();

  // Badges — por enquanto só pipeline tem fonte real (notifications).
  // Os outros são preenchidos quando tivermos APIs de contagem.
  const badgeFor = (key?: string): string | null => {
    if (key === 'pipeline' && unreadCount > 0) {
      return unreadCount > 9 ? '9+' : String(unreadCount);
    }
    return null;
  };

  return (
    <aside className="hidden lg:flex w-[220px] flex-col bg-surface border-r border-border flex-shrink-0">
      {/* Logo — SVG portado do design (W em retângulo accent) */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-border flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-1.5">
          {/* <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="7" fill="var(--accent)" />
            <path d="M7 9L11.5 19L14 13.5L16.5 19L21 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="20" r="1.5" fill="white" fillOpacity="0.5" />
          </svg> */}
          <img
              src={logoVext}
              alt="Logo Vext CRM"
              className="w-14 h-14 object-contain"
            />
          <div className="leading-none">
            <span className="font-bold text-[15px] tracking-tight text-text-1">Vext</span>
            <span className="font-bold text-[15px] text-accent"> CRM</span>
          </div>
        </Link>
      </div>

      {/* Equipe ativa — link para o seletor de workspace */}
      {activeTeam && (
        <Link
          to="/workspace"
          className="flex items-center gap-2 px-3 py-2 mx-2 mt-2 rounded-token hover:bg-surface-2 transition-colors"
        >
          <div className="w-6 h-6 rounded bg-accent-bg flex items-center justify-center shrink-0">
            <IconTeamSwitch />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-text-3 leading-none">Equipe</div>
            <div className="text-[13px] font-semibold text-text-1 truncate leading-tight">
              {activeTeam.name}
            </div>
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto">
        {NAV_ITEMS.map((entry, idx) => {
          if (entry.kind === 'separator') {
            return (
              <div
                key={`sep-${idx}`}
                className="flex items-center gap-2 mt-2.5 mb-1.5 px-1"
              >
                <div className="h-px flex-1 bg-border" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-text-3 whitespace-nowrap">
                  {entry.label}
                </span>
              </div>
            );
          }

          const isActive = location.pathname === entry.path;
          const badge = badgeFor(entry.badgeKey);
          const IconComp = entry.icon;

          return (
            <Link
              key={entry.path}
              to={entry.path}
              className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 mb-px rounded-md text-[13px] transition-all ${
                isActive
                  ? 'bg-accent-bg text-accent font-semibold'
                  : 'text-text-2 hover:bg-surface-2 hover:text-text-1 font-normal'
              }`}
            >
              <IconComp />
              <span className="flex-1">{entry.label}</span>
              {badge && (
                <span
                  className={`text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center px-1.5 border border-border ${
                    isActive
                      ? 'bg-accent text-white border-transparent'
                      : 'bg-surface-2 text-text-3'
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User no rodapé com botão de logout */}
      <div className="px-3.5 py-2.5 border-t border-border flex items-center gap-2.5 flex-shrink-0">
        <Avatar
          initials={initialsOf(user?.name)}
          size={30}
          color={colorForName(user?.name)}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-1 truncate">
            {user?.name ?? 'Usuário'}
          </div>
          <div className="text-[10px] text-text-3">
            {user?.role === 'admin' ? 'Admin' : 'Vendedor'}
          </div>
        </div>
        
        {/* Botão de Logout para o Desktop */}
        <button
          onClick={() => logout()}
          title="Sair"
          className="p-1.5 text-text-3 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <IconLogout />
        </button>
      </div>
    </aside>
  );
}
