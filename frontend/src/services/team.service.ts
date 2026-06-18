import { workspaceService } from './workspace.service';
import { useTeamStore } from '../store/teamStore';

function activeTeamId(): number {
  const { activeTeam } = useTeamStore.getState();
  if (!activeTeam) throw new Error('Nenhuma equipe ativa selecionada');
  return activeTeam.id;
}

/**
 * Compatibilidade: mantém a API antiga (`teamService.list()`,
 * `teamService.getSellerRanking()`) usada por páginas existentes
 * (Pipeline, Dashboard, Team), agora delegando para o workspaceService
 * com a equipe ativa do teamStore.
 */
export const teamService = {
  /** Lista membros da equipe ativa no formato "User[]" usado pelas telas legadas */
  async list() {
    const members = await workspaceService.listMembers(activeTeamId()) as any[];
    return members.map((m) => ({ ...m.user, role: m.role, teamMemberId: m.id }));
  },

  async getSellerRanking() {
    return workspaceService.getSellerRanking(activeTeamId());
  },

  async updateMember(userId: number, data: { role?: 'moderator' | 'seller' }) {
    if (!data.role) return;
    return workspaceService.updateMember(activeTeamId(), userId, data.role);
  },
};
