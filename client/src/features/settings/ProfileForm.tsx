import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF', 'CNY', 'BRL'];

export function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setCurrency(user.currency);
      setMonthlyIncome(user.monthlyIncome?.toString() || '');
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const payload = {
        displayName: displayName.trim() || null,
        currency,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
      };
      const res = await api.put('/settings/profile', payload);
      updateUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
          Profile updated successfully.
        </div>
      )}

      <Input
        id="display-name"
        label="Display Name"
        placeholder="Your name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-[var(--color-text)]">Email</label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="input w-full opacity-60 cursor-not-allowed"
        />
        <p className="text-xs text-[var(--color-text-secondary)]">Email cannot be changed.</p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-[var(--color-text)]">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="input w-full"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="monthly-income"
        label="Monthly Income"
        type="number"
        step="0.01"
        min="0"
        placeholder="5000.00"
        value={monthlyIncome}
        onChange={(e) => setMonthlyIncome(e.target.value)}
      />

      <Button type="submit" isLoading={saving}>
        Save Changes
      </Button>
    </form>
  );
}
