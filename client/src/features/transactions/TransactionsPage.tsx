import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { TransactionForm } from './TransactionForm';
import type { Transaction, Category, PaginatedResponse, TransactionType } from '../../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | undefined>(undefined);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.get<PaginatedResponse<Transaction>>('/transactions', { params });
      setTransactions(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get<Category[]>('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingTx(undefined);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTx(undefined);
  };

  const handleSuccess = () => {
    handleFormClose();
    fetchTransactions();
  };

  const typeOptions: Array<{ label: string; value: TransactionType | '' }> = [
    { label: 'All', value: '' },
    { label: 'Income', value: 'INCOME' },
    { label: 'Expense', value: 'EXPENSE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Transaction
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input w-full pl-9"
            />
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="input min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Type Toggle */}
          <div className="inline-flex rounded-lg border border-[var(--color-border)] overflow-hidden">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTypeFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  typeFilter === opt.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="input"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="input"
            placeholder="To"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left text-sm font-medium text-[var(--color-text-secondary)] px-6 py-3">
                Date
              </th>
              <th className="text-left text-sm font-medium text-[var(--color-text-secondary)] px-6 py-3">
                Description
              </th>
              <th className="text-left text-sm font-medium text-[var(--color-text-secondary)] px-6 py-3">
                Category
              </th>
              <th className="text-right text-sm font-medium text-[var(--color-text-secondary)] px-6 py-3">
                Amount
              </th>
              <th className="text-right text-sm font-medium text-[var(--color-text-secondary)] px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-[var(--color-border)] rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-[var(--color-border)] rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-[var(--color-border)] rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-[var(--color-border)] rounded ml-auto" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-[var(--color-border)] rounded ml-auto" /></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tx.category?.color ?? '#6b7280' }}
                      />
                      {tx.category?.name ?? 'Uncategorized'}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-semibold text-right whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Page {page} of {totalPages}
          </p>
          <div className="inline-flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('ellipsis');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-[var(--color-text-secondary)]">
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setPage(item as number)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={formOpen}
        onClose={handleFormClose}
        transaction={editingTx}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
