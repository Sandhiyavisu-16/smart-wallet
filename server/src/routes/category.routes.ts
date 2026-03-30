import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { categoryController } from '../controllers/category.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(30).default('tag'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
});

router.get('/', categoryController.getAll);
router.post('/', validate(createSchema), categoryController.create);
router.put('/:id', validate(createSchema), categoryController.update);
router.delete('/:id', categoryController.remove);

export { router as categoryRoutes };
