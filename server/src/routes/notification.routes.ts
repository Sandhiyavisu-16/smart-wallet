import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getAll);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export { router as notificationRoutes };
