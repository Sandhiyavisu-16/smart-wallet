import cron from 'node-cron';
import { budgetService } from '../services/budget.service';
import { subscriptionService } from '../services/subscription.service';

// Runs at 00:05 on the 1st of each month
cron.schedule('0 5 0 1 * *', async () => {
  console.log('[CRON] monthlyReset: starting');

  try {
    await budgetService.monthlyReset();
    console.log('[CRON] monthlyReset: budgets rolled over');
  } catch (error) {
    console.error('[CRON] monthlyReset: budget reset failed', error);
  }

  try {
    await subscriptionService.resetMonthlyAIQueries();
    console.log('[CRON] monthlyReset: AI query counters reset');
  } catch (error) {
    console.error('[CRON] monthlyReset: AI query reset failed', error);
  }

  console.log('[CRON] monthlyReset: finished');
});
