import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

async function findAll(userId: string) {
  const assets = await prisma.investment.findMany({
    where: { userId },
    orderBy: { purchaseDate: 'desc' },
  });

  return assets;
}

async function getSummary(userId: string) {
  const assets = await prisma.investment.findMany({
    where: { userId },
  });

  let totalInvested = 0;
  let currentValue = 0;
  const diversification: Record<string, { value: number; count: number }> = {};

  for (const asset of assets) {
    const qty = Number(asset.quantity);
    const purchase = Number(asset.purchasePrice);
    const current = Number(asset.currentPrice);

    const invested = qty * purchase;
    const value = qty * current;

    totalInvested += invested;
    currentValue += value;

    if (!diversification[asset.type]) {
      diversification[asset.type] = { value: 0, count: 0 };
    }
    diversification[asset.type].value += value;
    diversification[asset.type].count += 1;
  }

  const totalGain = currentValue - totalInvested;
  const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const breakdown = Object.entries(diversification).map(([type, data]) => ({
    type,
    value: data.value,
    count: data.count,
    pct: currentValue > 0 ? Math.round((data.value / currentValue) * 100) : 0,
  }));

  return { totalInvested, currentValue, totalGain, gainPct, diversification: breakdown };
}

async function create(
  userId: string,
  data: {
    name: string;
    type: string;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: Date;
    notes?: string;
  },
) {
  const asset = await prisma.investment.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      currentPrice: data.currentPrice,
      purchaseDate: data.purchaseDate,
      notes: data.notes ?? null,
    },
  });

  return asset;
}

async function update(
  userId: string,
  id: string,
  data: {
    name?: string;
    type?: string;
    quantity?: number;
    purchasePrice?: number;
    currentPrice?: number;
    purchaseDate?: Date;
    notes?: string;
  },
) {
  const asset = await prisma.investment.findFirst({
    where: { id, userId },
  });

  if (!asset) {
    throw AppError.notFound('Investment not found');
  }

  return prisma.investment.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      currentPrice: data.currentPrice,
      purchaseDate: data.purchaseDate,
      notes: data.notes,
    },
  });
}

async function remove(userId: string, id: string) {
  const asset = await prisma.investment.findFirst({
    where: { id, userId },
  });

  if (!asset) {
    throw AppError.notFound('Investment not found');
  }

  await prisma.investment.delete({ where: { id } });
}

export const investmentService = { findAll, getSummary, create, update, remove };
