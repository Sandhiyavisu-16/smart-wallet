import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { subscriptionService } from './subscription.service';
import { notificationService } from './notification.service';

async function findAll(userId: string) {
  const [active, completed] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, completedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.goal.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  return { active, completed };
}

async function create(
  userId: string,
  data: {
    name: string;
    targetAmount: number;
    targetDate?: Date;
    icon?: string;
  },
) {
  const currentCount = await prisma.goal.count({
    where: { userId, completedAt: null },
  });
  await subscriptionService.checkLimit(userId, 'goals', currentCount);

  const goal = await prisma.goal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      targetDate: data.targetDate ?? null,
      icon: data.icon ?? 'piggy-bank',
    },
  });

  return goal;
}

async function update(
  userId: string,
  id: string,
  data: {
    name?: string;
    targetAmount?: number;
    targetDate?: Date;
    icon?: string;
  },
) {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    throw AppError.notFound('Goal not found');
  }

  return prisma.goal.update({
    where: { id },
    data: {
      name: data.name,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate,
      icon: data.icon,
    },
  });
}

async function contribute(userId: string, id: string, amount: number) {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    throw AppError.notFound('Goal not found');
  }

  if (goal.completedAt) {
    throw AppError.badRequest('This goal is already completed');
  }

  const previousAmount = Number(goal.currentAmount);
  const newAmount = previousAmount + amount;
  const targetAmount = Number(goal.targetAmount);
  const isComplete = newAmount >= targetAmount;

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: {
      currentAmount: Math.min(newAmount, targetAmount),
      completedAt: isComplete ? new Date() : null,
    },
  });

  // Check milestones (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100];
  for (const milestone of milestones) {
    const threshold = targetAmount * (milestone / 100);
    if (previousAmount < threshold && newAmount >= threshold) {
      await notificationService.create(
        userId,
        'GOAL_MILESTONE',
        `Goal Milestone: ${milestone}%`,
        `You've reached ${milestone}% of your "${goal.name}" goal!`,
        { goalId: id, milestone, currentAmount: newAmount, targetAmount },
      );
    }
  }

  return {
    ...updatedGoal,
    projectedCompletion: isComplete ? null : getProjectedCompletion(updatedGoal),
  };
}

async function remove(userId: string, id: string) {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    throw AppError.notFound('Goal not found');
  }

  await prisma.goal.delete({ where: { id } });
}

function getProjectedCompletion(goal: {
  createdAt: Date;
  currentAmount: number | { toNumber(): number };
  targetAmount: number | { toNumber(): number };
}): Date | null {
  const current = typeof goal.currentAmount === 'number'
    ? goal.currentAmount
    : goal.currentAmount.toNumber();
  const target = typeof goal.targetAmount === 'number'
    ? goal.targetAmount
    : goal.targetAmount.toNumber();

  if (current <= 0) return null;

  const elapsed = Date.now() - goal.createdAt.getTime();
  if (elapsed <= 0) return null;

  const rate = current / elapsed; // amount per ms
  const remaining = target - current;
  const msToComplete = remaining / rate;

  return new Date(Date.now() + msToComplete);
}

export const goalService = { findAll, create, update, contribute, remove };
