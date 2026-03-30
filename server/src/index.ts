import { env } from './config/env';
import { app } from './app';
import { prisma } from './config/prisma';

// In Vercel deployment, cron jobs are handled by Vercel Cron (api/cron/).
// For local development, uncomment these to enable node-cron:
// import './jobs/monthlyReset';
// import './jobs/weeklySummary';

const PORT = env.PORT;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
