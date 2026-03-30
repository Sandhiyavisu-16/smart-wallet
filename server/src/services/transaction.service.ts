import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { paginate, paginatedResponse } from '../utils/pagination';
import { toCSV } from '../utils/csv';
import { notificationService } from './notification.service';

interface TransactionFilters {
  page?: string;
  limit?: string;
  category?: string;
  type?: string;
  from?: string;
  to?: string;
  search?: string;
}

async function getAll(userId: string, filters: TransactionFilters) {
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const { skip, take } = paginate({ page, limit });

  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
  };

  if (filters.category) {
    where.categoryId = filters.category;
  }

  if (filters.type) {
    where.type = filters.type as 'INCOME' | 'EXPENSE';
  }

  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) (where.date as Prisma.DateTimeFilter).gte = new Date(filters.from);
    if (filters.to) (where.date as Prisma.DateTimeFilter).lte = new Date(filters.to);
  }

  if (filters.search) {
    where.description = { contains: filters.search, mode: 'insensitive' };
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  return paginatedResponse(data, total, { page, limit });
}

async function getById(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    include: { category: true },
  });

  if (!transaction) {
    throw AppError.notFound('Transaction not found');
  }

  return transaction;
}

async function create(
  userId: string,
  data: {
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    categoryId: string;
    description?: string;
    date: Date;
  },
) {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description ?? null,
      date: data.date,
    },
    include: { category: true },
  });

  if (data.type === 'EXPENSE') {
    const txDate = new Date(data.date);
    await recalculateBudgetSpent(
      userId,
      data.categoryId,
      txDate.getMonth() + 1,
      txDate.getFullYear(),
    );
  }

  return transaction;
}

async function update(
  userId: string,
  id: string,
  data: {
    amount?: number;
    type?: 'INCOME' | 'EXPENSE';
    categoryId?: string;
    description?: string;
    date?: Date;
  },
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!existing) {
    throw AppError.notFound('Transaction not found');
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
      date: data.date,
    },
    include: { category: true },
  });

  // Recalculate budget for the old category/month
  if (existing.type === 'EXPENSE') {
    const oldDate = new Date(existing.date);
    await recalculateBudgetSpent(
      userId,
      existing.categoryId,
      oldDate.getMonth() + 1,
      oldDate.getFullYear(),
    );
  }

  // Recalculate budget for the new category/month if it changed
  const newCategoryId = data.categoryId ?? existing.categoryId;
  const newDate = data.date ? new Date(data.date) : new Date(existing.date);
  const newType = data.type ?? existing.type;
  const categoryChanged = newCategoryId !== existing.categoryId;
  const dateChanged = data.date && new Date(data.date).getTime() !== new Date(existing.date).getTime();

  if (newType === 'EXPENSE' && (categoryChanged || dateChanged)) {
    await recalculateBudgetSpent(
      userId,
      newCategoryId,
      newDate.getMonth() + 1,
      newDate.getFullYear(),
    );
  }

  return transaction;
}

async function remove(userId: string, id: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!existing) {
    throw AppError.notFound('Transaction not found');
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  if (existing.type === 'EXPENSE') {
    const txDate = new Date(existing.date);
    await recalculateBudgetSpent(
      userId,
      existing.categoryId,
      txDate.getMonth() + 1,
      txDate.getFullYear(),
    );
  }
}

async function exportCSV(userId: string, _filters?: Record<string, unknown>) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, deletedAt: null },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const rows = transactions.map((t) => ({
    date: t.date.toISOString().split('T')[0],
    type: t.type,
    category: t.category?.name ?? '',
    amount: t.amount.toString(),
    description: t.description ?? '',
  }));

  return toCSV(rows, ['date', 'type', 'category', 'amount', 'description']);
}

async function recalculateBudgetSpent(
  userId: string,
  categoryId: string,
  month: number,
  year: number,
) {
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId, month, year },
  });

  if (!budget) return;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: 'EXPENSE',
      deletedAt: null,
      date: { gte: startDate, lt: endDate },
    },
    _sum: { amount: true },
  });

  const spent = result._sum.amount ?? 0;

  await prisma.budget.update({
    where: { id: budget.id },
    data: { spent },
  });

  const pct = budget.amount > 0 ? (Number(spent) / Number(budget.amount)) * 100 : 0;

  if (pct >= 100) {
    await notificationService.create(
      userId,
      'BUDGET_ALERT',
      'Budget Exceeded',
      `You have exceeded your budget for this category. Spent: ${spent}/${budget.amount}`,
      { budgetId: budget.id, categoryId, pct },
    );
  } else if (pct >= 80) {
    await notificationService.create(
      userId,
      'BUDGET_ALERT',
      'Budget Warning',
      `You have used ${Math.round(pct)}% of your budget for this category.`,
      { budgetId: budget.id, categoryId, pct },
    );
  }
}

export const transactionService = { getAll, getById, create, update, remove, exportCSV };
