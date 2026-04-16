import { prisma } from '../config/prisma';

export class TagService {
  async list() {
    return prisma.tag.findMany({ orderBy: { label: 'asc' } });
  }

  async create(data: { label: string; color: string }) {
    return prisma.tag.create({ data });
  }

  async update(id: number, data: { label?: string; color?: string }) {
    return prisma.tag.update({ where: { id }, data });
  }

  async delete(id: number) {
    await prisma.cardTag.deleteMany({ where: { tagId: id } });
    await prisma.tag.delete({ where: { id } });
  }
}

export const tagService = new TagService();
