import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { goalController } from '../controllers/goal.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  targetDate: z.string().pipe(z.coerce.date()).optional(),
  icon: z.string().max(30).default('piggy-bank'),
});

const contributeSchema = z.object({
  amount: z.number().positive(),
});

router.get('/', goalController.getAll);
router.post('/', validate(createSchema), goalController.create);
router.put('/:id', validate(createSchema), goalController.update);
router.patch('/:id/contribute', validate(contributeSchema), goalController.contribute);
router.delete('/:id', goalController.remove);

export { router as goalRoutes };
