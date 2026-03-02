import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin - senha segura gerada via env ou fallback para dev
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
      salesGoal: 100000,
    },
  });
  console.log(`  ✅ Admin criado: ${admin.email} (senha: ${adminPassword})`);

  // Tags padrão
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
      where: { label: tag.label },
      update: {},
      create: tag,
    });
  }
  console.log(`  ✅ ${tags.length} tags criadas`);

  // Produtos de exemplo
  const products = [
    { name: 'Plano Starter', price: 99.90, description: 'Ideal para pequenas empresas' },
    { name: 'Plano Professional', price: 299.90, description: 'Para equipes em crescimento' },
    { name: 'Plano Enterprise', price: 799.90, description: 'Para grandes operações' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(product) + 1 },
      update: {},
      create: product,
    });
  }
  console.log(`  ✅ ${products.length} produtos criados`);

  console.log('✨ Seed concluído!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
