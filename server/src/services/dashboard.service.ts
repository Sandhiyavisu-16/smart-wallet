import { prisma } from '../config/prisma';

function defaultMonth() {
  return new Date().getMonth() + 1;
}

function defaultYear() {
  return new Date().getFullYear();
}

async function getSummary(userId: string, month?: number, year?: number) {
  const m = month ?? defaultMonth();
  const y = year ?? defaultYear();
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 1);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
        deletedAt: null,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        deletedAt: null,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpenses = Number(expenseResult._sum.amount ?? 0);
  const netSavings = totalIncome - totalExpenses;

  return { month: m, year: y, totalIncome, totalExpenses, netSavings };
}

async function getChart(userId: string, month?: number, year?: number) {
  const m = month ?? defaultMonth();
  const y = year ?? defaultYear();
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'EXPENSE',
      deletedAt: null,
      date: { gte: startDate, lt: endDate },
    },
    include: { category: true },
  });

  const categoryMap = new Map<string, { name: string; color: string | null; total: number }>();

  for (const tx of transactions) {
    const catId = tx.categoryId;
    const existing = categoryMap.get(catId);
    if (existing) {
      existing.total += Number(tx.amount);
    } else {
      categoryMap.set(catId, {
        name: tx.category?.name ?? 'Uncategorized',
        color: tx.category?.color ?? null,
        total: Number(tx.amount),
      });
    }
  }

  const data = Array.from(categoryMap.entries()).map(([categoryId, info]) => ({
    categoryId,
    categoryName: info.name,
    color: info.color,
    amount: info.total,
  }));

  // Sort descending by amount
  data.sort((a, b) => b.amount - a.amount);

  return { month: m, year: y, data };
}

async function getComparison(userId: string) {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastYear = lastMonthDate.getFullYear();

  const [current, previous] = await Promise.all([
    getSummary(userId, thisMonth, thisYear),
    getSummary(userId, lastMonth, lastYear),
  ]);

  function pctChange(curr: number, prev: number): number | null {
    if (prev === 0) return curr > 0 ? 100 : null;
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  }

  return {
    current,
    previous,
    changes: {
      income: pctChange(current.totalIncome, previous.totalIncome),
      expenses: pctChange(current.totalExpenses, previous.totalExpenses),
      netSavings: pctChange(current.netSavings, previous.netSavings),
    },
  };
}

export const dashboardService = { getSummary, getChart, getComparison };
