import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import type { Transaction } from '../../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await api.get('/transactions', { params: { limit: 5 } });
        const data = res.data;
        setTransactions(Array.isArray(data) ? data : data.data ?? []);
      } catch (err) {
        console.error('Failed to fetch recent transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecent();
  }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-border)]" />
                <div>
                  <div className="h-4 w-24 bg-[var(--color-border)] rounded mb-1" />
                  <div className="h-3 w-16 bg-[var(--color-border)] rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-[var(--color-border)] rounded" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-[var(--color-text-secondary)] text-center py-8">
          No transactions yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tx.category?.color ?? '#6b7280' }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {tx.category?.name ?? 'Uncategorized'} &middot; {formatDate(tx.date)}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold whitespace-nowrap ${
                  tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
