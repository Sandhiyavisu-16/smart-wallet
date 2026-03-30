import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { SavingsGoal } from '../../types';

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  goal?: SavingsGoal | null;
}

const ICON_OPTIONS = ['🎯', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🏥', '🎉', '💰', '🏖️', '📚', '🎸', '🐕', '👶'];

export function GoalForm({ isOpen, onClose, onSaved, goal }: GoalFormProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : '');
      setIcon(goal.icon || '🎯');
    } else {
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setIcon('🎯');
    }
    setError('');
  }, [goal, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !targetAmount) {
      setError('Name and target amount are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate || null,
        icon,
      };

      if (goal) {
        await api.put(`/goals/${goal.id}`, payload);
      } else {
        await api.post('/goals', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save goal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal ? 'Edit Goal' : 'New Savings Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <Input
          id="goal-name"
          label="Goal Name"
          placeholder="e.g., Emergency Fund"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          id="goal-target"
          label="Target Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="10000.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
        />

        <Input
          id="goal-date"
          label="Target Date (optional)"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--color-text)]">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                  icon === emoji
                    ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                    : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)]'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {goal ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
