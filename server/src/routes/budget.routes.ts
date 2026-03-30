import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { budgetController } from '../controllers/budget.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  rollover: z.boolean().default(false),
});

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

router.get('/', validate(querySchema, 'query'), budgetController.getAll);
router.get('/summary', validate(querySchema, 'query'), budgetController.summary);
router.post('/', validate(createSchema), budgetController.create);
router.put('/:id', validate(createSchema), budgetController.update);
router.delete('/:id', budgetController.remove);

export { router as budgetRoutes };
