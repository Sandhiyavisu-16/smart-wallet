import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

async function getAll(userId: string) {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { isDefault: true, userId: null },
        { userId },
      ],
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });

  return categories;
}

async function create(
  userId: string,
  data: { name: string; icon?: string; color?: string },
) {
  const category = await prisma.category.create({
    data: {
      userId,
      name: data.name,
      icon: data.icon ?? null,
      color: data.color ?? null,
      isDefault: false,
    },
  });

  return category;
}

async function update(
  userId: string,
  id: string,
  data: { name?: string; icon?: string; color?: string },
) {
  const category = await prisma.category.findFirst({
    where: { id, userId },
  });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (category.isDefault) {
    throw AppError.forbidden('Cannot modify default categories');
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
    },
  });
}

async function remove(userId: string, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, userId },
  });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (category.isDefault) {
    throw AppError.forbidden('Cannot delete default categories');
  }

  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id, deletedAt: null },
  });

  if (transactionCount > 0) {
    throw AppError.badRequest(
      'Cannot delete a category that has transactions. Reassign or delete them first.',
      'CATEGORY_HAS_TRANSACTIONS',
    );
  }

  await prisma.category.delete({ where: { id } });
}

export const categoryService = { getAll, create, update, remove };
