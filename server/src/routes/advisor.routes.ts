import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { advisorLimiter } from '../middleware/rateLimiter';
import { tierGuard } from '../middleware/tierGuard';
import { advisorController } from '../controllers/advisor.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

router.get('/chats', advisorController.getChats);
router.post('/chats', advisorController.createChat);
router.get('/chats/:id', advisorController.getChat);
router.post('/chats/:id/messages', advisorLimiter, validate(messageSchema), advisorController.sendMessage);
router.get('/prompts', advisorController.getSuggestedPrompts);
router.get('/health-score', tierGuard('PRO'), advisorController.getHealthScore);

export { router as advisorRoutes };
