import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { transactionRoutes } from './routes/transaction.routes';
import { categoryRoutes } from './routes/category.routes';
import { budgetRoutes } from './routes/budget.routes';
import { goalRoutes } from './routes/goal.routes';
import { investmentRoutes } from './routes/investment.routes';
import { advisorRoutes } from './routes/advisor.routes';
import { notificationRoutes } from './routes/notification.routes';
import { settingsRoutes } from './routes/settings.routes';
import { dashboardRoutes } from './routes/dashboard.routes';

const app = express();

// Core middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(globalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const api = express.Router();
api.use('/auth', authRoutes);
api.use('/transactions', transactionRoutes);
api.use('/categories', categoryRoutes);
api.use('/budgets', budgetRoutes);
api.use('/goals', goalRoutes);
api.use('/investments', investmentRoutes);
api.use('/advisor', advisorRoutes);
api.use('/notifications', notificationRoutes);
api.use('/settings', settingsRoutes);
api.use('/dashboard', dashboardRoutes);

// In Vercel, the /api prefix is handled by the file-based routing
// so the Express app mounts at /api and routes are under /api/v1/*
app.use('/api/v1', api);

// Error handler (must be last)
app.use(errorHandler);

export { app };
