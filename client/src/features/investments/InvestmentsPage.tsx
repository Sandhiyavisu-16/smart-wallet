import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AssetForm } from './AssetForm';
import { useAuthStore } from '../../store';
import type { Asset } from '../../types';

interface InvestmentSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  pctGainLoss: number;
}

const TYPE_COLORS: Record<string, string> = {
  STOCK: '#3b82f6',
  BOND: '#10b981',
  CRYPTO: '#f59e0b',
  MUTUAL_FUND: '#8b5cf6',
  ETF: '#06b6d4',
  REAL_ESTATE: '#ec4899',
  OTHER: '#6b7280',
};

export function InvestmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, summaryRes] = await Promise.all([
        api.get<Asset[]>('/investments'),
        api.get<InvestmentSummary>('/investments/summary'),
      ]);
      setAssets(assetsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch investments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleEdit(asset: Asset) {
    setEditing(asset);
    setFormOpen(true);
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete asset "${asset.name}"?`)) return;
    try {
      await api.delete(`/investments/${asset.id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
  }

  // Diversification data grouped by type
  const diversification = assets.reduce<Record<string, number>>((acc, a) => {
    const value = a.quantity * a.currentPrice;
    acc[a.type] = (acc[a.type] || 0) + value;
    return acc;
  }, {});

  const totalPortfolioValue = Object.values(diversification).reduce((s, v) => s + v, 0);

  if (user?.tier === 'FREE') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Investments</h1>
        <div className="card text-center py-16">
          <Lock className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upgrade to Track Investments</h2>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
            Investment portfolio tracking is available on PRO and PREMIUM plans. Upgrade to monitor your assets, view diversification, and track gains.
          </p>
          <Button size="lg">Upgrade Now</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Investments</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-24 bg-[var(--color-border)] rounded mb-2" />
              <div className="h-8 w-32 bg-[var(--color-border)] rounded" />
            </div>
          ))}
        </div>
        <div className="card animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investments</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Asset
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-[var(--color-text-secondary)]">Total Value</p>
            <p className="text-2xl font-bold">${summary.totalValue.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--color-text-secondary)]">Total Invested</p>
            <p className="text-2xl font-bold">${summary.totalInvested.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--color-text-secondary)]">Total Gain/Loss</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summary.totalGainLoss >= 0 ? '+' : ''}${summary.totalGainLoss.toFixed(2)}
              </p>
              <Badge variant={summary.totalGainLoss >= 0 ? 'success' : 'danger'}>
                {summary.pctGainLoss >= 0 ? '+' : ''}{summary.pctGainLoss.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets Table */}
        <div className="lg:col-span-2 card overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
          {assets.length === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] py-8">
              No assets yet. Add your first investment to start tracking.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Qty</th>
                  <th className="pb-3 font-medium text-right">Buy Price</th>
                  <th className="pb-3 font-medium text-right">Current</th>
                  <th className="pb-3 font-medium text-right">Gain/Loss</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const gainLoss = (asset.currentPrice - asset.purchasePrice) * asset.quantity;
                  const pct = asset.purchasePrice > 0
                    ? ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100
                    : 0;
                  return (
                    <tr key={asset.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 font-medium">{asset.name}</td>
                      <td className="py-3">
                        <Badge>{asset.type.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-3 text-right">{asset.quantity}</td>
                      <td className="py-3 text-right">${asset.purchasePrice.toFixed(2)}</td>
                      <td className="py-3 text-right">${asset.currentPrice.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center gap-1 ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {gainLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(asset)} className="text-red-500">Del</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Diversification Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Diversification</h2>
          {totalPortfolioValue === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] py-8">No data</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <svg viewBox="0 0 200 200" className="w-48 h-48">
                {(() => {
                  const entries = Object.entries(diversification);
                  let cumulativeAngle = 0;
                  return entries.map(([type, value]) => {
                    const pct = value / totalPortfolioValue;
                    const angle = pct * 360;
                    const startAngle = cumulativeAngle;
                    cumulativeAngle += angle;
                    const endAngle = cumulativeAngle;

                    const startRad = ((startAngle - 90) * Math.PI) / 180;
                    const endRad = ((endAngle - 90) * Math.PI) / 180;
                    const x1 = 100 + 80 * Math.cos(startRad);
                    const y1 = 100 + 80 * Math.sin(startRad);
                    const x2 = 100 + 80 * Math.cos(endRad);
                    const y2 = 100 + 80 * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;

                    if (entries.length === 1) {
                      return (
                        <circle
                          key={type}
                          cx="100"
                          cy="100"
                          r="80"
                          fill={TYPE_COLORS[type] || '#6b7280'}
                        />
                      );
                    }

                    return (
                      <path
                        key={type}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={TYPE_COLORS[type] || '#6b7280'}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="w-full space-y-2">
                {Object.entries(diversification).map(([type, value]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[type] || '#6b7280' }}
                      />
                      <span className="text-[var(--color-text)]">{type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">
                      {((value / totalPortfolioValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AssetForm
        isOpen={formOpen}
        onClose={handleFormClose}
        onSaved={fetchData}
        asset={editing}
      />
    </div>
  );
}
