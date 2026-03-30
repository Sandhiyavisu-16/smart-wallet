import { Request, Response, NextFunction } from 'express';
import { SubscriptionTier } from '@prisma/client';
import { AppError } from '../utils/errors';

const tierLevel: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
};

export function tierGuard(requiredTier: SubscriptionTier) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userTier = req.user?.tier ?? 'FREE';
    if (tierLevel[userTier] < tierLevel[requiredTier]) {
      next(AppError.forbidden(`This feature requires a ${requiredTier} subscription`));
      return;
    }
    next();
  };
}
