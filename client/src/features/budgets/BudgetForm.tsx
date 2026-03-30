import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Budget, Category } from '../../types';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  budget?: Budget | null;
  existingCategoryIds: string[];
}

export function BudgetForm({ isOpen, onClose, onSaved, budget, existingCategoryIds }: BudgetFormProps) {
  const now = new Date();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '');
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '');
  const [rollover, setRollover] = useState(budget?.rollover ?? false);
  const [month] = useState(budget?.month ?? now.getMonth() + 1);
  const [year] = useState(budget?.year ?? now.getFullYear());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    api.get<Category[]>('/categories').then((res) => {
      setCategories(res.data);
    });
  }, [isOpen]);

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId);
      setAmount(budget.amount.toString());
      setRollover(budget.rollover);
    } else {
      setCategoryId('');
      setAmount('');
      setRollover(false);
    }
  }, [budget, isOpen]);

  const availableCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id) || c.id === budget?.categoryId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!categoryId || !amount) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        categoryId,
        amount: parseFloat(amount),
        rollover,
        month,
        year,
      };

      if (budget) {
        await api.put(`/budgets/${budget.id}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget ? 'Edit Budget' : 'Add Budget'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--color-text)]">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input w-full"
            disabled={!!budget}
          >
            <option value="">Select a category</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="amount"
          label="Budget Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="500.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="rollover"
            checked={rollover}
            onChange={(e) => setRollover(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="rollover" className="text-sm text-[var(--color-text)]">
            Roll over unspent amount to next month
          </label>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          Period: {month}/{year}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {budget ? 'Update Budget' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
