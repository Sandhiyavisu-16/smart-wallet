import jwt from 'jsonwebtoken';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(firebaseToken: string, displayName?: string) {
  const decoded = await firebaseAuth.verifyIdToken(firebaseToken).catch(() => {
    throw AppError.unauthorized('Invalid Firebase token');
  });

  const existing = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (existing) {
    throw AppError.badRequest('User already registered', 'USER_EXISTS');
  }

  const user = await prisma.user.create({
    data: {
      firebaseUid: decoded.uid,
      email: decoded.email ?? '',
      displayName: displayName ?? decoded.name ?? null,
      currency: 'USD',
      tier: 'FREE',
      onboardingDone: false,
      notificationPref: {
        create: {
          budgetAlerts: true,
          weeklySummary: true,
          goalMilestones: true,
          emailEnabled: false,
          pushEnabled: true,
        },
      },
    },
  });

  const token = signToken(user.id);
  return { user, token };
}

async function login(firebaseToken: string) {
  const decoded = await firebaseAuth.verifyIdToken(firebaseToken).catch(() => {
    throw AppError.unauthorized('Invalid Firebase token');
  });

  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (!user) {
    throw AppError.notFound('User not found. Please register first.');
  }

  const token = signToken(user.id);
  return { user, token };
}

async function onboarding(
  userId: string,
  data: { currency: string; monthlyIncome: number },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      currency: data.currency,
      monthlyIncome: data.monthlyIncome,
      onboardingDone: true,
    },
  });

  return user;
}

async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPref: true },
  });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return user;
}

export const authService = { register, login, onboarding, me };
