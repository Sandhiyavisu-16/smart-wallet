import type { VercelRequest, VercelResponse } from '@vercel/node';
import { budgetService } from '../../server/src/services/budget.service';
import { subscriptionService } from '../../server/src/services/subscription.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the request is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[CRON] monthlyReset: starting');

  const results: Record<string, string> = {};

  try {
    await budgetService.monthlyReset();
    results.budgets = 'success';
    console.log('[CRON] monthlyReset: budgets rolled over');
  } catch (error) {
    results.budgets = 'failed';
    console.error('[CRON] monthlyReset: budget reset failed', error);
  }

  try {
    await subscriptionService.resetMonthlyAIQueries();
    results.aiQueries = 'success';
    console.log('[CRON] monthlyReset: AI query counters reset');
  } catch (error) {
    results.aiQueries = 'failed';
    console.error('[CRON] monthlyReset: AI query reset failed', error);
  }

  console.log('[CRON] monthlyReset: finished');
  return res.status(200).json({ ok: true, results });
}
