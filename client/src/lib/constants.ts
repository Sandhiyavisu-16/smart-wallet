export const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const TIER_LIMITS = {
  FREE: { goals: 3, budgets: 5, aiQueries: 10 },
  PRO: { goals: Infinity, budgets: Infinity, aiQueries: 100 },
  PREMIUM: { goals: Infinity, budgets: Infinity, aiQueries: Infinity },
} as const;

export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Health',
  'Income',
  'Other',
] as const;

export const BUDGET_THRESHOLDS = {
  GREEN: 0.7,
  AMBER: 0.9,
  RED: 1.0,
} as const;
