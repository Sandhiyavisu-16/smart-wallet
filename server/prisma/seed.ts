import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Food', icon: 'utensils', color: '#ef4444' },
  { name: 'Transport', icon: 'car', color: '#f97316' },
  { name: 'Entertainment', icon: 'film', color: '#a855f7' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Utilities', icon: 'zap', color: '#eab308' },
  { name: 'Health', icon: 'heart-pulse', color: '#22c55e' },
  { name: 'Income', icon: 'wallet', color: '#3b82f6' },
  { name: 'Other', icon: 'tag', color: '#6b7280' },
];

async function main() {
  console.log('Seeding default categories...');

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: null as unknown as string, name: category.name } },
      update: {},
      create: {
        ...category,
        isDefault: true,
        userId: null,
      },
    });
  }

  console.log(`Seeded ${defaultCategories.length} default categories`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
