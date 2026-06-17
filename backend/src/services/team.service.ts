import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';
import { auditService } from './audit.service';
import crypto from 'crypto';

function generateOrgCode(): string {
  // 6 caracteres alfanuméricos maiúsculos — fácil de digitar
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/** Limites por plano — ver seção 2.4 do guia de migração multi-tenant */
const PLAN_LIMITS = {
  free:    { maxOwnedTeams: 1, maxMembersPerTeam: 6 },
  premium: { maxOwnedTeams: 5, maxMembersPerTeam: 20 },
} as const;

export class TeamService {
  /** Lista equipes das quais o usuário é membro (owned + joined) */
  async listMyTeams(userId: number) {
    return prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          select: {
            id: true, name: true, slug: true, orgCode: true,
            ownerId: true, createdAt: true,
            owner: { select: { id: true, name: true, plan: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Cria nova equipe e adiciona o criador como ADMIN.
   * Valida o limite de equipes possuídas conforme o plano do usuário (seção 2.4).
   */
  async create(name: string, ownerId: number, ownerName: string) {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true },
    });
    if (!owner) throw ApiError.notFound('Usuário não encontrado');

    const limits = PLAN_LIMITS[owner.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;

    const ownedTeamsCount = await prisma.team.count({ where: { ownerId } });
    if (ownedTeamsCount >= limits.maxOwnedTeams) {
      throw ApiError.forbidden(
        owner.plan === 'premium'
          ? `Limite de ${limits.maxOwnedTeams} equipes do plano premium atingido.`
          : `Plano gratuito permite apenas ${limits.maxOwnedTeams} equipe própria. Faça upgrade para o plano premium para criar mais equipes.`
      );
    }

    const baseSlug = slugify(name);
    // Garante unicidade do slug com sufixo aleatório
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;

    let orgCode: string;
    let attempts = 0;
    do {
      orgCode = generateOrgCode();
      attempts++;
      if (attempts > 20) throw ApiError.internal('Falha ao gerar código único');
    } while (await prisma.team.findUnique({ where: { orgCode } }));

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { name, slug, orgCode, ownerId },
      });
      // Único TeamMember com role 'admin' nesta equipe — garantido pelo
      // índice único parcial team_members_one_admin_per_team.
      await tx.teamMember.create({
        data: { teamId: newTeam.id, userId: ownerId, role: 'admin' },
      });
      return newTeam;
    });

    await auditService.log('user', ownerId, `Equipe criada: ${name}`, ownerId, ownerName, undefined, undefined, team.id);
    return team;
  }

  /** Retorna detalhes completos de uma equipe (acesso já validado por requireTeamAccess) */
  async getById(teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, name: true, plan: true } },
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true, avatar: true,
                salesGoal: true, lastSignedIn: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { contacts: true, cards: true, members: true } },
      },
    });
    if (!team) throw ApiError.notFound('Equipe não encontrada');

    const limits = PLAN_LIMITS[team.owner.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;

    return {
      ...team,
      memberLimit: limits.maxMembersPerTeam,
    };
  }

  /** Atualiza nome da equipe (apenas admin) */
  async update(teamId: number, data: { name?: string }, adminId: number, adminName: string) {
    if (!data.name) return;
    await prisma.team.update({ where: { id: teamId }, data: { name: data.name } });
    await auditService.log('user', teamId, 'Equipe atualizada', adminId, adminName, undefined, undefined, teamId);
  }

  /**
   * Permite usuário entrar numa equipe pelo orgCode.
   * Valida o limite de membros conforme o plano do DONO da equipe (seção 2.4).
   */
  async joinByOrgCode(orgCode: string, userId: number) {
    const team = await prisma.team.findUnique({
      where: { orgCode },
      include: { owner: { select: { plan: true } } },
    });
    if (!team || !team.isActive) throw ApiError.notFound('Equipe não encontrada');

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } },
    });
    if (existing) throw ApiError.conflict('Você já é membro desta equipe');

    await this.assertMemberLimitNotReached(team.id, team.owner.plan);

    await prisma.teamMember.create({
      data: { teamId: team.id, userId, role: 'seller' },
    });

    return team;
  }

  /**
   * Lança erro se a equipe já atingiu o limite de membros do plano do dono.
   * Reutilizado por joinByOrgCode, criação/aceite de convite.
   */
  async assertMemberLimitNotReached(teamId: number, ownerPlan: string) {
    const limits = PLAN_LIMITS[ownerPlan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
    const currentCount = await prisma.teamMember.count({ where: { teamId } });
    if (currentCount >= limits.maxMembersPerTeam) {
      throw ApiError.forbidden(
        `Esta equipe atingiu o limite de ${limits.maxMembersPerTeam} membros do plano do administrador.`
      );
    }
  }

  /** Lista membros de uma equipe */
  async listMembers(teamId: number) {
    return prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, avatar: true,
            salesGoal: true, lastSignedIn: true, createdAt: true,
          },
        },
      },
      // admin primeiro, depois moderators, depois sellers, por antiguidade
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  /**
   * Atualiza role de um membro entre 'moderator' e 'seller'.
   * Apenas o ADMIN pode chamar (requireTeamAdmin na rota).
   * 'admin' NUNCA é atribuível aqui — só via transferOwnership.
   */
  async updateMember(
    teamId: number, targetUserId: number,
    role: 'moderator' | 'seller', adminId: number, adminName: string
  ) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw ApiError.notFound('Equipe não encontrada');

    // O ADMIN/dono não pode ter seu próprio papel alterado por esta via —
    // a única forma de deixar de ser admin é transferir a posse.
    if (team.ownerId === targetUserId) {
      throw ApiError.forbidden(
        'Não é possível alterar o papel do administrador da equipe. Use a transferência de posse.'
      );
    }

    const target = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    if (!target) throw ApiError.notFound('Membro não encontrado nesta equipe');

    await prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId: targetUserId } },
      data: { role },
    });
    await auditService.log('user', targetUserId, `Papel atualizado para ${role}`, adminId, adminName, undefined, undefined, teamId);
  }

  /**
   * Remove membro da equipe.
   * - O ADMIN/dono NUNCA pode ser removido (nem por si mesmo, nem por moderators) —
   *   ele precisa transferir a posse antes de sair.
   * - ADMIN pode remover qualquer outro membro (moderator ou seller).
   * - MODERATOR pode remover sellers e outros moderators, mas NUNCA o admin.
   * A checagem `requesterRole` é redundante com requireTeamStaff na rota,
   * mas mantida aqui para segurança em profundidade.
   */
  async removeMember(
    teamId: number, targetUserId: number,
    requesterId: number, requesterName: string, requesterRole: 'admin' | 'moderator'
  ) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw ApiError.notFound('Equipe não encontrada');

    if (team.ownerId === targetUserId) {
      throw ApiError.forbidden(
        'Não é possível remover o administrador da equipe. Transfira a posse primeiro.'
      );
    }

    if (requesterRole !== 'admin' && requesterRole !== 'moderator') {
      throw ApiError.forbidden('Sem permissão para remover membros');
    }

    const target = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    if (!target) throw ApiError.notFound('Membro não encontrado nesta equipe');

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    await auditService.log('user', targetUserId, 'Removido da equipe', requesterId, requesterName, undefined, undefined, teamId);
  }

  /**
   * Transfere a posse (ADMIN) da equipe para outro membro.
   * Apenas o ADMIN atual pode chamar (requireTeamAdmin na rota).
   * Operação atômica:
   *  - Team.ownerId passa a ser newOwnerUserId
   *  - TeamMember do novo dono vira 'admin'
   *  - TeamMember do dono anterior vira 'moderator'
   */
  async transferOwnership(
    teamId: number, newOwnerUserId: number,
    currentAdminId: number, currentAdminName: string
  ) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw ApiError.notFound('Equipe não encontrada');

    if (team.ownerId !== currentAdminId) {
      throw ApiError.forbidden('Apenas o administrador atual pode transferir a posse');
    }
    if (newOwnerUserId === currentAdminId) {
      throw ApiError.badRequest('Você já é o administrador desta equipe');
    }

    const newOwnerMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: newOwnerUserId } },
      include: { user: { select: { name: true } } },
    });
    if (!newOwnerMembership) {
      throw ApiError.badRequest('O novo administrador precisa já ser membro da equipe');
    }

    await prisma.$transaction([
      prisma.team.update({ where: { id: teamId }, data: { ownerId: newOwnerUserId } }),
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: newOwnerUserId } },
        data: { role: 'admin' },
      }),
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: currentAdminId } },
        data: { role: 'moderator' },
      }),
    ]);

    await auditService.log(
      'user', newOwnerUserId,
      `Posse da equipe transferida para ${newOwnerMembership.user.name}`,
      currentAdminId, currentAdminName, undefined, undefined, teamId
    );
  }

  /** Ranking de vendedores da equipe (apenas role seller entram no ranking de metas) */
  async getSellerRanking(teamId: number) {
    const [members, wonDeals] = await Promise.all([
      prisma.teamMember.findMany({
        where: { teamId, role: 'seller' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, salesGoal: true } },
        },
      }),
      prisma.card.findMany({
        where: { teamId, stage: 'won' },
        select: { ownerId: true, value: true },
      }),
    ]);

    const toNum = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };

    const ranking = members
      .map(({ user }) => {
        const userDeals = wonDeals.filter((d) => d.ownerId === user.id);
        const totalValue = userDeals.reduce((acc, d) => acc + toNum(d.value), 0);
        const goal = toNum(user.salesGoal) > 0 ? toNum(user.salesGoal) : 50000;
        return {
          ...user,
          totalValue,
          dealsCount: userDeals.length,
          progress: goal > 0 ? (totalValue / goal) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    if (ranking.length === 0) {
      return {
        ranking,
        isEmpty: true,
        emptyMessage: 'Nenhum vendedor ativo na equipe. Adicione membros com o papel "vendedor" para ver o ranking.',
      };
    }

    const noSalesYet = ranking.every((r) => r.totalValue === 0);

    return {
      ranking,
      isEmpty: false,
      emptyMessage: noSalesYet
        ? 'Equipe cadastrada mas sem vendas fechadas ainda. O ranking atualiza assim que o primeiro card for ganho.'
        : null,
    };
  }
}

export const teamService = new TeamService();
