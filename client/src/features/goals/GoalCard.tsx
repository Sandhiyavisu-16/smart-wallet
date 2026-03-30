import { useState } from 'react';
import { Pencil, Trash2, PiggyBank } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { SavingsGoal } from '../../types';

interface GoalCardProps {
  goal: SavingsGoal;
  onContribute: (goalId: string, amount: number) => Promise<void>;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}

export function GoalCard({ goal, onContribute, onEdit, onDelete }: GoalCardProps) {
  const [showContribute, setShowContribute] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const clampedPct = Math.min(pct, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  let ringColor = 'text-primary-500';
  if (goal.isCompleted) ringColor = 'text-green-500';
  else if (pct >= 75) ringColor = 'text-emerald-500';
  else if (pct >= 50) ringColor = 'text-blue-500';

  const projectedDate =
    !goal.isCompleted && goal.currentAmount > 0 && goal.createdAt
      ? (() => {
          const created = new Date(goal.createdAt).getTime();
          const elapsed = Date.now() - created;
          const rate = goal.currentAmount / elapsed;
          const remaining = goal.targetAmount - goal.currentAmount;
          if (rate > 0) {
            const msLeft = remaining / rate;
            return new Date(Date.now() + msLeft);
          }
          return null;
        })()
      : null;

  async function handleContribute() {
    const val = parseFloat(contributeAmount);
    if (!val || val <= 0) return;
    setContributing(true);
    try {
      await onContribute(goal.id, val);
      setContributeAmount('');
      setShowContribute(false);
    } finally {
      setContributing(false);
    }
  }

  return (
    <div className="card flex flex-col items-center gap-4 text-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`${ringColor} transition-all duration-700`}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">{goal.icon || '🎯'}</span>
          <span className="text-sm font-bold">{clampedPct.toFixed(0)}%</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[var(--color-text)]">{goal.name}</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
        </p>
      </div>

      {projectedDate && !goal.isCompleted && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          Projected: {projectedDate.toLocaleDateString()}
        </p>
      )}

      {goal.targetDate && !goal.isCompleted && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          Target: {new Date(goal.targetDate).toLocaleDateString()}
        </p>
      )}

      {goal.isCompleted && (
        <p className="text-sm font-medium text-green-500">Goal Completed!</p>
      )}

      {!goal.isCompleted && (
        <>
          {showContribute ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" isLoading={contributing} onClick={handleContribute}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowContribute(false)}>
                &times;
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setShowContribute(true)}>
              <PiggyBank className="w-4 h-4 mr-1" /> Contribute
            </Button>
          )}
        </>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)] w-full justify-center">
        <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(goal)} className="text-red-500 hover:text-red-600">
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}
