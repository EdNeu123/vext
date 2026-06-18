import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ====================================================================
  // USUÁRIO ADMIN
  // ====================================================================

  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'VextAdmin@2025!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vext.com.br' },
    update: {},
    create: {
      name: 'Admin Vext',
      email: 'admin@vext.com.br',
      password: hashedPassword,
      role: 'admin',
      plan: 'premium',
      salesGoal: 100000,
    },
  });
  console.log(`  ✅ Admin: ${admin.email} (senha: ${adminPassword})`);

  // ====================================================================
  // EQUIPE PADRÃO (multi-tenant)
  // ====================================================================

  let team = await prisma.team.findUnique({ where: { slug: 'equipe-principal' } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'Equipe Principal',
        slug: 'equipe-principal',
        orgCode: 'VEXT01',
        ownerId: admin.id,
      },
    });
  }

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: admin.id } },
    update: { role: 'admin' },
    create: { teamId: team.id, userId: admin.id, role: 'admin' },
  });
  console.log(`  ✅ Equipe: ${team.name} (orgCode: ${team.orgCode})`);

  // ====================================================================
  // TAGS
  // ====================================================================

  const tags = [
    { label: 'Hot Lead', color: '#ef4444' },
    { label: 'Indicação', color: '#f59e0b' },
    { label: 'Inbound', color: '#3b82f6' },
    { label: 'Outbound', color: '#8b5cf6' },
    { label: 'Urgente', color: '#ec4899' },
    { label: 'Enterprise', color: '#10b981' },
  ];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { teamId_label: { teamId: team.id, label: tag.label } },
      update: {},
      create: { ...tag, teamId: team.id },
    });
  }
  console.log(`  ✅ ${tags.length} tags`);

  // ====================================================================
  // PRODUTOS
  // ====================================================================

  const products = [
    { name: 'Plano Starter',      price: 99.90,  description: 'Ideal para pequenas empresas' },
    { name: 'Plano Professional', price: 299.90, description: 'Para equipes em crescimento' },
    { name: 'Plano Enterprise',   price: 799.90, description: 'Para grandes operações' },
  ];
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { teamId: team.id, name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: { ...p, teamId: team.id } });
    }
  }
  console.log(`  ✅ ${products.length} produtos`);

  console.log('✨ Seed concluído!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
