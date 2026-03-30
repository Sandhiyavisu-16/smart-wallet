import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseToken } = req.body;
    const result = await authService.register(firebaseToken);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseToken } = req.body;
    const result = await authService.login(firebaseToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function onboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { currency, monthlyIncome } = req.body;
    const user = await authService.onboarding(userId, { currency, monthlyIncome });
    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const user = await authService.me(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export const authController = { register, login, onboarding, me };
