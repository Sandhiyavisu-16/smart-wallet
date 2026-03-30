import { SubscriptionTier } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

const TIER_LIMITS: Record<SubscriptionTier, { goals: number; budgets: number; aiQueries: number }> = {
  FREE: { goals: 3, budgets: 5, aiQueries: 10 },
  PRO: { goals: Infinity, budgets: Infinity, aiQueries: 100 },
  PREMIUM: { goals: Infinity, budgets: Infinity, aiQueries: Infinity },
};

async function checkLimit(
  userId: string,
  resource: 'goals' | 'budgets' | 'ai_queries',
  currentCount: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  if (!user) throw AppError.notFound('User not found');

  const limits = TIER_LIMITS[user.tier];
  let max: number;

  switch (resource) {
    case 'goals':
      max = limits.goals;
      break;
    case 'budgets':
      max = limits.budgets;
      break;
    case 'ai_queries':
      max = limits.aiQueries;
      break;
  }

  if (currentCount >= max) {
    throw AppError.forbidden(
      `${user.tier} tier limit reached for ${resource}. Please upgrade your subscription.`,
    );
  }
}

async function getUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, aiQueriesUsed: true },
  });

  if (!user) throw AppError.notFound('User not found');

  const [goalCount, budgetCount] = await Promise.all([
    prisma.goal.count({ where: { userId } }),
    prisma.budget.count({
      where: {
        userId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }),
  ]);

  const limits = TIER_LIMITS[user.tier];

  return {
    tier: user.tier,
    goals: { used: goalCount, limit: limits.goals },
    budgets: { used: budgetCount, limit: limits.budgets },
    aiQueries: { used: user.aiQueriesUsed, limit: limits.aiQueries },
  };
}

async function resetMonthlyAIQueries() {
  const now = new Date();
  await prisma.user.updateMany({
    where: {
      aiQueriesResetAt: { lt: now },
    },
    data: {
      aiQueriesUsed: 0,
      aiQueriesResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
  });
}

export const subscriptionService = { checkLimit, getUsage, resetMonthlyAIQueries, TIER_LIMITS };
