import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'GBP', label: 'GBP - British Pound' },
  { code: 'INR', label: 'INR - Indian Rupee' },
  { code: 'CAD', label: 'CAD - Canadian Dollar' },
  { code: 'AUD', label: 'AUD - Australian Dollar' },
];

export function OnboardingPage() {
  const [currency, setCurrency] = useState('USD');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const income = parseFloat(monthlyIncome);
    if (!monthlyIncome.trim() || isNaN(income) || income < 0) {
      setError('Please enter a valid monthly income.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/onboarding', { currency, monthlyIncome: income });
      updateUser({ currency, monthlyIncome: income, onboardingDone: true });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet className="h-8 w-8 text-primary-600" />
          <span className="text-2xl font-bold text-[var(--color-text)]">SmartWallet</span>
        </div>

        {/* Card */}
        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                1
              </span>
              <span className="text-sm font-medium text-[var(--color-text)]">Setup</span>
            </div>
            <div className="h-px w-8 bg-[var(--color-border)]" />
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)]">
                2
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">Dashboard</span>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-[var(--color-text)] text-center">
            Welcome to SmartWallet
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mt-1 mb-6">
            Let&apos;s personalize your experience. This only takes a moment.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Preferred currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input w-full"
                disabled={loading}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="monthlyIncome" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Monthly income
              </label>
              <input
                id="monthlyIncome"
                type="number"
                min="0"
                step="any"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 5000"
                className="input w-full"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
