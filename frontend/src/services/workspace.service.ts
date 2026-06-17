import { api, extractData } from './api';

export const workspaceService = {
  /** Lista equipes do usuário logado */
  async listMyTeams()                   { return extractData(await api.get('/teams')); },

  /** Cria nova equipe */
  async createTeam(name: string)        { return extractData(await api.post('/teams', { name })); },

  /** Entra numa equipe pelo código */
  async joinByOrgCode(orgCode: string)  { return extractData(await api.post('/teams/join', { orgCode })); },

  /** Detalhes da equipe ativa */
  async getTeam(id: number)             { return extractData(await api.get(`/teams/${id}`)); },

  /** Membros da equipe ativa */
  async listMembers(id: number)         { return extractData(await api.get(`/teams/${id}/members`)); },

  /** Ranking da equipe ativa */
  async getSellerRanking(id: number)    { return extractData(await api.get(`/teams/${id}/ranking`)); },

  /** Atualiza role de um membro entre 'moderator' e 'seller' (admin only) */
  async updateMember(teamId: number, userId: number, role: 'moderator' | 'seller') {
    return extractData(await api.put(`/teams/${teamId}/members/${userId}`, { role }));
  },

  /** Remove um membro (admin ou moderator; hierarquia validada no backend) */
  async removeMember(teamId: number, userId: number) {
    return extractData(await api.delete(`/teams/${teamId}/members/${userId}`));
  },

  /** Transfere a posse (ADMIN) da equipe para outro membro (admin only) */
  async transferOwnership(teamId: number, newOwnerUserId: number) {
    return extractData(await api.put(`/teams/${teamId}/transfer-ownership`, { newOwnerUserId }));
  },
};
