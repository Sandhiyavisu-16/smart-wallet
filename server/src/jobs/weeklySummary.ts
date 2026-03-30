import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { notificationService } from '../services/notification.service';

// Runs every Monday at 09:00 UTC
cron.schedule('0 0 9 * * 1', async () => {
  console.log('[CRON] weeklySummary: starting');

  try {
    // Find all users who have weeklySummary enabled
    const prefs = await prisma.notificationPref.findMany({
      where: { weeklySummary: true },
      select: { userId: true },
    });

    const userIds = prefs.map((p) => p.userId);
    console.log(`[CRON] weeklySummary: ${userIds.length} users opted in`);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const userId of userIds) {
      try {
        // Aggregate last 7 days of transactions
        const transactions = await prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: sevenDaysAgo, lte: now },
          },
          include: { category: true },
        });

        let totalIncome = 0;
        let totalExpenses = 0;
        const spendingByCategory = new Map<string, number>();

        for (const tx of transactions) {
          const amount = Number(tx.amount);
          if (tx.type === 'INCOME') {
            totalIncome += amount;
          } else {
            totalExpenses += amount;
            const catName = tx.category?.name ?? 'Uncategorized';
            spendingByCategory.set(catName, (spendingByCategory.get(catName) ?? 0) + amount);
          }
        }

        // Determine top spending category
        let topCategory = 'None';
        let topAmount = 0;
        for (const [category, amount] of spendingByCategory) {
          if (amount > topAmount) {
            topCategory = category;
            topAmount = amount;
          }
        }

        const metadata = {
          totalIncome,
          totalExpenses,
          topCategory,
          topCategoryAmount: topAmount,
          transactionCount: transactions.length,
        };

        const body = [
          `Income: $${totalIncome.toFixed(2)}`,
          `Expenses: $${totalExpenses.toFixed(2)}`,
          `Top category: ${topCategory} ($${topAmount.toFixed(2)})`,
        ].join(' | ');

        await notificationService.create(
          userId,
          'WEEKLY_SUMMARY',
          'Your Weekly Summary',
          body,
          metadata,
        );

        console.log(`[CRON] weeklySummary: created notification for user ${userId}`);
      } catch (error) {
        console.error(`[CRON] weeklySummary: failed for user ${userId}`, error);
      }
    }

    console.log('[CRON] weeklySummary: finished');
  } catch (error) {
    console.error('[CRON] weeklySummary: failed', error);
  }
});
