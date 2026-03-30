import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getAll(userId);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const notification = await notificationService.markRead(userId, id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    await notificationService.markAllRead(userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export const notificationController = { getAll, markRead, markAllRead };
