import { create } from 'zustand';

export interface TeamSummary {
  id: number;
  name: string;
  slug: string;
  ownerPlan: string;          // plano do DONO da equipe ('free' | 'premium') — define os limites
  ownerId: number;
  role: 'admin' | 'moderator' | 'seller';
  memberCount: number;
}

interface TeamStore {
  activeTeam: TeamSummary | null;
  teams: TeamSummary[];
  setTeams: (teams: TeamSummary[]) => void;
  setActiveTeam: (team: TeamSummary | null) => void;
  clearTeam: () => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  activeTeam: (() => {
    const stored = sessionStorage.getItem('vext_active_team');
    return stored ? JSON.parse(stored) : null;
  })(),
  teams: [],

  setTeams: (teams) => set({ teams }),

  setActiveTeam: (team) => {
    if (team) sessionStorage.setItem('vext_active_team', JSON.stringify(team));
    else sessionStorage.removeItem('vext_active_team');
    set({ activeTeam: team });
  },

  clearTeam: () => {
    sessionStorage.removeItem('vext_active_team');
    set({ activeTeam: null, teams: [] });
  },
}));
