import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { settingsController } from '../controllers/settings.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const profileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  currency: z.string().length(3).optional(),
  monthlyIncome: z.number().positive().optional(),
  darkMode: z.boolean().optional(),
});

const notifPrefSchema = z.object({
  budgetAlerts: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  goalMilestones: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

router.get('/profile', settingsController.getProfile);
router.put('/profile', validate(profileSchema), settingsController.updateProfile);
router.get('/notifications', settingsController.getNotificationPrefs);
router.put('/notifications', validate(notifPrefSchema), settingsController.updateNotificationPrefs);
router.get('/subscription', settingsController.getSubscription);
router.post('/export-data', settingsController.exportData);
router.post('/delete-account', settingsController.deleteAccount);

export { router as settingsRoutes };
