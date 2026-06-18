import { create } from 'zustand';
import type { User } from '../models';
import { authService } from '../services/auth.service';
import { useTeamStore, type TeamSummary } from './teamStore';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, inviteToken?: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  initAuth: () => Promise<void>;
}

/** Mapeia o formato de equipe retornado pela API (`{ role, team: {...} }`) para o TeamSummary do teamStore */
function mapTeamMembership(m: any): TeamSummary {
  return {
    id: m.team.id,
    name: m.team.name,
    slug: m.team.slug,
    ownerPlan: m.team.owner?.plan ?? 'free',
    ownerId: m.team.ownerId,
    role: m.role,
    memberCount: m.team._count?.members ?? 0,
  };
}

/** Após login/registro: popula o teamStore com as equipes do usuário e auto-seleciona se houver apenas 1 */
function applyTeams(teams: any[]) {
  const { setTeams, setActiveTeam } = useTeamStore.getState();
  const mapped = (teams ?? []).map(mapTeamMembership);
  setTeams(mapped);
  if (mapped.length === 1) {
    setActiveTeam(mapped[0]);
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const { user, teams } = await authService.login(email, password);
    set({ user: user as User, isAuthenticated: true });
    applyTeams(teams as any[]);
    return user as User;
  },

  register: async (name, email, password, inviteToken?) => {
    const { user, teams } = await authService.register(name, email, password, inviteToken);
    set({ user: user as User, isAuthenticated: true });
    applyTeams(teams as any[]);
    return user as User;
  },

  logout: () => {
    authService.logout();
    useTeamStore.getState().clearTeam();
    set({ user: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    try {
      const profile = await authService.getProfile();
      set({ user: profile as User });
      localStorage.setItem('vext_user', JSON.stringify(profile));
    } catch {}
  },

  initAuth: async () => {
    if (authService.isAuthenticated()) {
      try {
        const profile = await authService.getProfile();
        set({ user: profile as User, isAuthenticated: true });
        localStorage.setItem('vext_user', JSON.stringify(profile));
      } catch {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('vext_access_token');
        localStorage.removeItem('vext_refresh_token');
        localStorage.removeItem('vext_user');
      }
    }
  },
}));
