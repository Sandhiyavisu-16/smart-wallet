import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

async function create(
  userId: string,
  type: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>,
) {
  const prefs = await prisma.notificationPref.findUnique({
    where: { userId },
  });

  if (prefs) {
    if (type === 'BUDGET_ALERT' && !prefs.budgetAlerts) return null;
    if (type === 'GOAL_MILESTONE' && !prefs.goalMilestones) return null;
    if (type === 'WEEKLY_SUMMARY' && !prefs.weeklySummary) return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      metadata: metadata ?? undefined,
      read: false,
    },
  });

  return notification;
}

async function findAll(userId: string, unreadOnly?: boolean) {
  const where: Record<string, unknown> = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return notifications;
}

async function markRead(userId: string, id: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw AppError.notFound('Notification not found');
  }

  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export const notificationService = { create, findAll, markRead, markAllRead };
