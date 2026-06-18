import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';

export class TagService {
  /**
   * Listagem de tags com contagem de uso (#cards usando), escopada à equipe.
   * Por default retorna só ativas; passe includeInactive=true pra trazer todas.
   */
  async list(teamId: number, includeInactive = false) {
    const where: any = { teamId };
    if (!includeInactive) where.isActive = true;

    const tags = await prisma.tag.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { label: 'asc' }],
      include: {
        _count: { select: { cards: true } },
      },
    });

    return tags.map(t => ({
      id: t.id,
      label: t.label,
      color: t.color,
      isActive: t.isActive,
      createdAt: t.createdAt,
      usageCount: t._count.cards,
    }));
  }

  async create(data: { label: string; color: string }, teamId: number) {
    const existing = await prisma.tag.findUnique({
      where: { teamId_label: { teamId, label: data.label } },
    });
    if (existing) throw ApiError.conflict('Já existe uma tag com este nome nesta equipe');
    return prisma.tag.create({ data: { ...data, teamId } });
  }

  async update(id: number, data: { label?: string; color?: string; isActive?: boolean }, teamId: number) {
    await this.getOwned(id, teamId);
    return prisma.tag.update({ where: { id }, data });
  }

  /**
   * Em vez de deletar, desativa (preserva histórico de uso).
   * Hard-delete só se forçado E não estiver em uso.
   */
  async delete(id: number, teamId: number, force = false) {
    await this.getOwned(id, teamId);
    const usage = await prisma.cardTag.count({ where: { tagId: id } });

    if (force && usage === 0) {
      await prisma.tag.delete({ where: { id } });
      return { hardDeleted: true };
    }

    // Soft-delete: desativa pra preservar histórico
    await prisma.tag.update({ where: { id }, data: { isActive: false } });
    return { hardDeleted: false, deactivated: true, usageCount: usage };
  }

  /**
   * Detalhe de uso de uma tag — quais cards/contatos usam.
   * Útil pra modal de "Onde essa tag aparece?"
   */
  async getUsage(id: number, teamId: number) {
    const tag = await prisma.tag.findFirst({ where: { id, teamId } });
    if (!tag) return null;

    const cardTags = await prisma.cardTag.findMany({
      where: { tagId: id },
      include: {
        card: {
          select: {
            id: true, title: true, value: true, stage: true,
            contact: { select: { id: true, name: true, company: true } },
          },
        },
      },
    });

    return {
      tag,
      cards: cardTags.map(ct => ct.card),
      totalUsage: cardTags.length,
    };
  }

  /** Garante que a tag pertence à equipe antes de mutações */
  private async getOwned(id: number, teamId: number) {
    const tag = await prisma.tag.findFirst({ where: { id, teamId } });
    if (!tag) throw ApiError.notFound('Tag não encontrada');
    return tag;
  }
}

export const tagService = new TagService();
