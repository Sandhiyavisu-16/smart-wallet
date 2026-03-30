export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type AssetType = 'STOCK' | 'BOND' | 'CRYPTO' | 'MUTUAL_FUND' | 'ETF' | 'REAL_ESTATE' | 'OTHER';
export type NotificationType = 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'GOAL_MILESTONE' | 'WEEKLY_SUMMARY' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  currency: string;
  monthlyIncome: number | null;
  tier: SubscriptionTier;
  darkMode: boolean;
  onboardingDone: boolean;
  aiQueriesUsed: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  notes: string | null;
  categoryId: string;
  category: Category;
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
  rollover: boolean;
  rolloverAmt: number;
  categoryId: string;
  category: Category;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  icon: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes: string | null;
}

export interface AdvisorChat {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  topCategory: { name: string; amount: number; color: string } | null;
}

export interface DashboardChart {
  spending: Array<{
    categoryId: string;
    categoryName: string;
    color: string;
    amount: number;
  }>;
}

export interface DashboardComparison {
  thisMonth: { income: number; expenses: number; net: number };
  lastMonth: { income: number; expenses: number; net: number };
  pctChange: { income: number; expenses: number; net: number };
}
