import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { BudgetCard } from './BudgetCard';
import { BudgetForm } from './BudgetForm';
import type { Budget } from '../../types';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
}

export function BudgetsPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [budgetsRes, summaryRes] = await Promise.all([
        api.get<Budget[]>('/budgets', { params: { month, year } }),
        api.get<BudgetSummary>('/budgets/summary', { params: { month, year } }),
      ]);
      setBudgets(budgetsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleEdit(budget: Budget) {
    setEditing(budget);
    setFormOpen(true);
  }

  async function handleDelete(budget: Budget) {
    if (!confirm(`Delete budget for ${budget.category.name}?`)) return;
    try {
      await api.delete(`/budgets/${budget.id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
  }

  const existingCategoryIds = budgets.map((b) => b.categoryId);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-24 bg-[var(--color-border)] rounded mb-2" />
              <div className="h-8 w-32 bg-[var(--color-border)] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Budget
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-[var(--color-text-secondary)]">Total Budget</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">${summary.totalBudget.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--color-text-secondary)]">Total Spent</p>
            <p className="text-2xl font-bold text-red-500">${summary.totalSpent.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--color-text-secondary)]">Remaining</p>
            <p className="text-2xl font-bold text-green-500">${summary.remaining.toFixed(2)}</p>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)] mb-4">
            No budgets set for this month. Create one to start tracking your spending.
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <BudgetForm
        isOpen={formOpen}
        onClose={handleFormClose}
        onSaved={fetchData}
        budget={editing}
        existingCategoryIds={existingCategoryIds}
      />
    </div>
  );
}
