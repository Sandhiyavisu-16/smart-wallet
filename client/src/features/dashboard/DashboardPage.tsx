import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SummaryCards } from './SummaryCards';
import { SpendingPieChart } from '../../components/charts/SpendingPieChart';
import { RecentTransactions } from './RecentTransactions';
import type { DashboardSummary, DashboardChart, DashboardComparison } from '../../types';

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-24 bg-[var(--color-border)] rounded mb-3" />
      <div className="h-8 w-32 bg-[var(--color-border)] rounded mb-2" />
      <div className="h-3 w-20 bg-[var(--color-border)] rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="card animate-pulse h-80">
      <div className="h-4 w-40 bg-[var(--color-border)] rounded mb-4" />
      <div className="flex items-center justify-center h-60">
        <div className="w-48 h-48 rounded-full bg-[var(--color-border)]" />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-40 bg-[var(--color-border)] rounded mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-border)]" />
            <div>
              <div className="h-4 w-28 bg-[var(--color-border)] rounded mb-1" />
              <div className="h-3 w-16 bg-[var(--color-border)] rounded" />
            </div>
          </div>
          <div className="h-4 w-16 bg-[var(--color-border)] rounded" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chart, setChart] = useState<DashboardChart | null>(null);
  const [comparison, setComparison] = useState<DashboardComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [summaryRes, chartRes, comparisonRes] = await Promise.all([
          api.get<DashboardSummary>('/dashboard/summary'),
          api.get<DashboardChart>('/dashboard/chart'),
          api.get<DashboardComparison>('/dashboard/comparison'),
        ]);
        setSummary(summaryRes.data);
        setChart(chartRes.data);
        setComparison(comparisonRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonChart />
          </div>
          <SkeletonList />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {summary && comparison && (
        <SummaryCards summary={summary} comparison={comparison} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
          {chart && chart.spending.length > 0 ? (
            <SpendingPieChart data={chart.spending} />
          ) : (
            <p className="text-[var(--color-text-secondary)] text-center py-12">
              No spending data for this month.
            </p>
          )}
        </div>

        <RecentTransactions />
      </div>
    </div>
  );
}
