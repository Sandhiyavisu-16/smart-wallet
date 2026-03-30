import { TrendingUp, TrendingDown, Wallet, Tag } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import type { DashboardSummary, DashboardComparison } from '../../types';

interface SummaryCardsProps {
  summary: DashboardSummary;
  comparison: DashboardComparison;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-sm text-[var(--color-text-secondary)]">No change</span>;
  }

  const isPositive = value > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-emerald-500' : 'text-red-500'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function SummaryCards({ summary, comparison }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Income',
      value: formatCurrency(summary.totalIncome),
      change: comparison.pctChange.income,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses),
      change: comparison.pctChange.expenses,
      icon: TrendingDown,
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(summary.netSavings),
      change: comparison.pctChange.net,
      icon: Wallet,
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Top Category',
      value: summary.topCategory ? summary.topCategory.name : 'N/A',
      subValue: summary.topCategory ? formatCurrency(summary.topCategory.amount) : undefined,
      icon: Tag,
      iconBg: summary.topCategory
        ? undefined
        : 'bg-gray-100 dark:bg-gray-500/20',
      iconColor: summary.topCategory
        ? undefined
        : 'text-gray-600 dark:text-gray-400',
      dotColor: summary.topCategory?.color,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[var(--color-text-secondary)]">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                {'subValue' in card && card.subValue && (
                  <p className="text-sm text-[var(--color-text-secondary)]">{card.subValue}</p>
                )}
                {'change' in card && card.change !== undefined && (
                  <ChangeIndicator value={card.change} />
                )}
              </div>
              <div
                className={`p-2 rounded-lg ${card.iconBg ?? ''}`}
                style={
                  card.dotColor
                    ? { backgroundColor: card.dotColor + '20' }
                    : undefined
                }
              >
                <Icon
                  className={`w-5 h-5 ${card.iconColor ?? ''}`}
                  style={card.dotColor ? { color: card.dotColor } : undefined}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
