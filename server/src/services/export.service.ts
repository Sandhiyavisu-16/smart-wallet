import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  const [transactions, budgets, goals, investments, categories, notifications, chats, notificationPref] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
      }),
      prisma.budget.findMany({
        where: { userId },
        include: { category: true },
      }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
      prisma.notification.findMany({ where: { userId } }),
      prisma.chat.findMany({
        where: { userId },
        include: { messages: true },
      }),
      prisma.notificationPref.findUnique({ where: { userId } }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      displayName: user.displayName,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      tier: user.tier,
      createdAt: user.createdAt,
    },
    notificationPreferences: notificationPref,
    categories,
    transactions,
    budgets,
    goals,
    investments,
    notifications,
    chats,
  };
}

async function deleteUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Soft-delete and anonymize user data
  await prisma.$transaction([
    // Delete related data
    prisma.message.deleteMany({
      where: { chat: { userId } },
    }),
    prisma.chat.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.investment.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.transaction.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    }),
    prisma.category.deleteMany({ where: { userId, isDefault: false } }),
    prisma.notificationPref.deleteMany({ where: { userId } }),

    // Anonymize user
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.local`,
        displayName: 'Deleted User',
        deletedAt: new Date(),
      },
    }),
  ]);
}

export const exportService = { exportUserData, deleteUserData };
