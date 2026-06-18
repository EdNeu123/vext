import { prisma } from '../config/prisma';

export class TagService {
  /**
   * Listagem de tags com contagem de uso (#cards usando).
   * Por default retorna só ativas; passe includeInactive=true pra trazer todas.
   */
  async list(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

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

  async create(data: { label: string; color: string }) {
    return prisma.tag.create({ data });
  }

  async update(id: number, data: { label?: string; color?: string; isActive?: boolean }) {
    return prisma.tag.update({ where: { id }, data });
  }

  /**
   * Em vez de deletar, desativa (preserva histórico de uso).
   * Hard-delete só se forçado E não estiver em uso.
   */
  async delete(id: number, force = false) {
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
  async getUsage(id: number) {
    const tag = await prisma.tag.findUnique({ where: { id } });
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
}

export const tagService = new TagService();
