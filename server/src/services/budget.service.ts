import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { subscriptionService } from './subscription.service';

function defaultMonth() {
  return new Date().getMonth() + 1;
}

function defaultYear() {
  return new Date().getFullYear();
}

async function getAll(
  userId: string,
  opts: { month?: string; year?: string },
) {
  const month = opts.month ? parseInt(opts.month, 10) : defaultMonth();
  const year = opts.year ? parseInt(opts.year, 10) : defaultYear();

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  });

  return budgets;
}

async function summary(
  userId: string,
  opts: { month?: string; year?: string },
) {
  const month = opts.month ? parseInt(opts.month, 10) : defaultMonth();
  const year = opts.year ? parseInt(opts.year, 10) : defaultYear();

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);

  const byCategory = budgets.map((b) => ({
    categoryId: b.categoryId,
    categoryName: b.category?.name ?? 'Unknown',
    budgeted: Number(b.amount),
    spent: Number(b.spent),
    remaining: Number(b.amount) - Number(b.spent),
    pct: b.amount > 0 ? Math.round((Number(b.spent) / Number(b.amount)) * 100) : 0,
  }));

  return { month, year, totalBudget, totalSpent, remaining: totalBudget - totalSpent, byCategory };
}

async function create(
  userId: string,
  data: { categoryId: string; amount: number; month: number; year: number },
) {
  // Check tier limit
  const currentCount = await prisma.budget.count({
    where: { userId, month: data.month, year: data.year },
  });
  await subscriptionService.checkLimit(userId, 'budgets', currentCount);

  // Check for duplicate budget in same category/month/year
  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: data.categoryId,
      month: data.month,
      year: data.year,
    },
  });

  if (existing) {
    throw AppError.badRequest(
      'A budget already exists for this category in the selected month',
      'BUDGET_EXISTS',
    );
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      spent: 0,
      month: data.month,
      year: data.year,
    },
    include: { category: true },
  });

  return budget;
}

async function update(
  userId: string,
  id: string,
  data: { amount?: number },
) {
  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    throw AppError.notFound('Budget not found');
  }

  return prisma.budget.update({
    where: { id },
    data: { amount: data.amount },
    include: { category: true },
  });
}

async function remove(userId: string, id: string) {
  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    throw AppError.notFound('Budget not found');
  }

  await prisma.budget.delete({ where: { id } });
}

async function monthlyReset() {
  const now = new Date();
  const lastMonth = now.getMonth(); // 0-indexed, so this IS last month (current -1 +1 = current 0-indexed)
  const lastMonthYear = lastMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = lastMonth === 0 ? 12 : lastMonth;
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Find all budgets from last month
  const lastMonthBudgets = await prisma.budget.findMany({
    where: { month: prevMonth, year: lastMonthYear },
  });

  // Group by userId
  const byUser = new Map<string, typeof lastMonthBudgets>();
  for (const budget of lastMonthBudgets) {
    const list = byUser.get(budget.userId) ?? [];
    list.push(budget);
    byUser.set(budget.userId, list);
  }

  for (const [userId, budgets] of byUser) {
    for (const budget of budgets) {
      // Check if budget already exists for new month
      const existing = await prisma.budget.findFirst({
        where: {
          userId,
          categoryId: budget.categoryId,
          month: currentMonth,
          year: currentYear,
        },
      });

      if (existing) continue;

      const rollover = Math.max(0, Number(budget.amount) - Number(budget.spent));

      await prisma.budget.create({
        data: {
          userId,
          categoryId: budget.categoryId,
          amount: budget.amount,
          spent: 0,
          rollover,
          month: currentMonth,
          year: currentYear,
        },
      });
    }
  }
}

export const budgetService = { getAll, summary, create, update, remove, monthlyReset };
