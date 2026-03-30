import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { tierGuard } from '../middleware/tierGuard';
import { transactionController } from '../controllers/transaction.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1).max(255),
  date: z.string().pipe(z.coerce.date()),
  categoryId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().uuid().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  from: z.string().pipe(z.coerce.date()).optional(),
  to: z.string().pipe(z.coerce.date()).optional(),
  search: z.string().max(100).optional(),
});

router.get('/', validate(querySchema, 'query'), transactionController.getAll);
router.post('/', validate(createSchema), transactionController.create);
router.get('/export', tierGuard('PRO'), transactionController.exportCSV);
router.get('/:id', transactionController.getById);
router.put('/:id', validate(createSchema), transactionController.update);
router.delete('/:id', transactionController.remove);

export { router as transactionRoutes };
