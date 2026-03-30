import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { dashboardController } from '../controllers/dashboard.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

router.get('/summary', validate(querySchema, 'query'), dashboardController.summary);
router.get('/chart', validate(querySchema, 'query'), dashboardController.chart);
router.get('/comparison', dashboardController.comparison);

export { router as dashboardRoutes };
