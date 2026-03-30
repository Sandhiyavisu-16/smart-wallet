import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../server/src/config/prisma';
import { notificationService } from '../../server/src/services/notification.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the request is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[CRON] weeklySummary: starting');

  try {
    const prefs = await prisma.notificationPref.findMany({
      where: { weeklySummary: true },
      select: { userId: true },
    });

    const userIds = prefs.map((p) => p.userId);
    console.log(`[CRON] weeklySummary: ${userIds.length} users opted in`);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let processed = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const transactions = await prisma.transaction.findMany({
          where: {
            userId,
            deletedAt: null,
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

        let topCategory = 'None';
        let topAmount = 0;
        for (const [category, amount] of spendingByCategory) {
          if (amount > topAmount) {
            topCategory = category;
            topAmount = amount;
          }
        }

        const body = [
          `Income: $${totalIncome.toFixed(2)}`,
          `Expenses: $${totalExpenses.toFixed(2)}`,
          `Top category: ${topCategory} ($${topAmount.toFixed(2)})`,
        ].join(' | ');

        await notificationService.create(userId, 'WEEKLY_SUMMARY', 'Your Weekly Summary', body, {
          totalIncome,
          totalExpenses,
          topCategory,
          topCategoryAmount: topAmount,
          transactionCount: transactions.length,
        });

        processed++;
      } catch (error) {
        failed++;
        console.error(`[CRON] weeklySummary: failed for user ${userId}`, error);
      }
    }

    console.log(`[CRON] weeklySummary: finished (${processed} ok, ${failed} failed)`);
    return res.status(200).json({ ok: true, processed, failed });
  } catch (error) {
    console.error('[CRON] weeklySummary: failed', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
