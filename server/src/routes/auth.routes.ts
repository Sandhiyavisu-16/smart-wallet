import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { authController } from '../controllers/auth.controller';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  firebaseToken: z.string(),
  displayName: z.string().optional(),
});

const onboardingSchema = z.object({
  currency: z.string().length(3),
  monthlyIncome: z.number().positive(),
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(registerSchema), authController.login);
router.post('/onboarding', authenticate, validate(onboardingSchema), authController.onboarding);
router.get('/me', authenticate, authController.me);

export { router as authRoutes };
