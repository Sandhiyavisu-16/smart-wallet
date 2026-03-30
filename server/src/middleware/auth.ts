import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

export interface AuthUser {
  id: string;
  firebaseUid: string;
  email: string;
  tier: 'FREE' | 'PRO' | 'PREMIUM';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    const decoded = await firebaseAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, firebaseUid: true, email: true, tier: true },
    });

    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(AppError.unauthorized('Invalid or expired token'));
  }
}
