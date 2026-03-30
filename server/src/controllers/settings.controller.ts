import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const profile = await settingsService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const profile = await settingsService.updateProfile(userId, req.body);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function getNotificationPrefs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const prefs = await settingsService.getNotificationPrefs(userId);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
}

async function updateNotificationPrefs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const prefs = await settingsService.updateNotificationPrefs(userId, req.body);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
}

async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const subscription = await settingsService.getSubscription(userId);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
}

async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const data = await settingsService.exportData(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    await settingsService.deleteAccount(userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const settingsController = {
  getProfile,
  updateProfile,
  getNotificationPrefs,
  updateNotificationPrefs,
  getSubscription,
  exportData,
  deleteAccount,
};
