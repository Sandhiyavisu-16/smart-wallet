import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { tierGuard } from '../middleware/tierGuard';
import { investmentController } from '../controllers/investment.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(tierGuard('PRO'));

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['STOCK', 'BOND', 'CRYPTO', 'MUTUAL_FUND', 'ETF', 'REAL_ESTATE', 'OTHER']),
  quantity: z.number().positive(),
  purchasePrice: z.number().positive(),
  currentPrice: z.number().nonnegative(),
  purchaseDate: z.string().pipe(z.coerce.date()),
  notes: z.string().max(500).optional(),
});

router.get('/', investmentController.getAll);
router.get('/summary', investmentController.summary);
router.post('/', validate(createSchema), investmentController.create);
router.put('/:id', validate(createSchema), investmentController.update);
router.delete('/:id', investmentController.remove);

export { router as investmentRoutes };
