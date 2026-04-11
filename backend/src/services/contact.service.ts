import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';
import type { CreateContactInput, UpdateContactInput } from '../models/schemas';

export class ContactService {
  async list(userId: number, role: string, search?: string, page = 1, limit = 20) {
    const where: any = {};
    if (role !== 'admin') where.ownerId = userId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: number, requesterId?: number, requesterRole?: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        cards: { select: { id: true, title: true, value: true, stage: true } },
      },
    });
    if (!contact) throw ApiError.notFound('Contato não encontrado');
    // IDOR: sellers só acessam seus próprios contatos
    if (requesterId && requesterRole !== 'admin' && contact.ownerId !== requesterId) {
      throw ApiError.forbidden('Acesso negado');
    }
    return contact;
  }

  async create(data: CreateContactInput, ownerId: number) {
    return prisma.contact.create({ data: { ...data, ownerId } });
  }

  async update(id: number, data: UpdateContactInput, requesterId: number, requesterRole: string) {
    await this.getById(id, requesterId, requesterRole);
    return prisma.contact.update({ where: { id }, data });
  }

  async delete(id: number, requesterId: number, requesterRole: string) {
    await this.getById(id, requesterId, requesterRole);
    await prisma.contact.delete({ where: { id } });
  }

  async bulkImport(contacts: any[], ownerId: number) {
    const MAX_BULK = 500;
    if (contacts.length > MAX_BULK) {
      throw ApiError.badRequest(`Limite de ${MAX_BULK} contatos por importação`);
    }
    const data = contacts.map((c) => ({ ...c, ownerId }));
    await prisma.contact.createMany({ data, skipDuplicates: true });
    return { imported: data.length };
  }

  async getHighChurnRisk() {
    return prisma.contact.findMany({
      where: { churnRisk: 'high' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { owner: { select: { id: true, name: true } } },
    });
  }

  async getRepurchaseOpportunities() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.contact.findMany({
      where: {
        lastPurchaseAt: { lte: thirtyDaysAgo },
        churnRisk: 'low',
      },
      orderBy: { ltv: 'desc' },
      take: 10,
      include: { owner: { select: { id: true, name: true } } },
    });
  }
}

export const contactService = new ContactService();
