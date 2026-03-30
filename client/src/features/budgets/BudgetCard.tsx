import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { Budget } from '../../types';
import { BUDGET_THRESHOLDS } from '../../lib/constants';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const spent = budget.spent;
  const total = budget.amount + budget.rolloverAmt;
  const ratio = total > 0 ? spent / total : 0;
  const remaining = Math.max(total - spent, 0);
  const pct = Math.min(ratio * 100, 100);

  let barColor = 'bg-green-500';
  if (ratio >= BUDGET_THRESHOLDS.RED) {
    barColor = 'bg-red-500';
  } else if (ratio >= BUDGET_THRESHOLDS.GREEN) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: budget.category.color + '20', color: budget.category.color }}
          >
            {budget.category.icon}
          </span>
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">{budget.category.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              ${spent.toFixed(2)} of ${total.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {budget.rollover && (
            <Badge variant="info">Rollover</Badge>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-[var(--color-text-secondary)]">{pct.toFixed(0)}% used</span>
          <span className="text-[var(--color-text-secondary)]">${remaining.toFixed(2)} left</span>
        </div>
        <div className="w-full h-2.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {budget.rolloverAmt > 0 && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          Includes ${budget.rolloverAmt.toFixed(2)} rolled over
        </p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
        <Button variant="ghost" size="sm" onClick={() => onEdit(budget)}>
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(budget)} className="text-red-500 hover:text-red-600">
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}
