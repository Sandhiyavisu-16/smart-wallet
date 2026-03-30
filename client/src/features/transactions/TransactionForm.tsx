import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Transaction, Category, TransactionType } from '../../types';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
  onSuccess: () => void;
}

interface FormErrors {
  amount?: string;
  description?: string;
}

export function TransactionForm({ isOpen, onClose, transaction, onSuccess }: TransactionFormProps) {
  const isEditing = !!transaction;

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setType(transaction.type);
        setAmount(String(transaction.amount));
        setDescription(transaction.description);
        setDate(transaction.date.split('T')[0]);
        setCategoryId(transaction.categoryId);
        setNotes(transaction.notes ?? '');
      } else {
        setType('EXPENSE');
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategoryId('');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, transaction]);

  // Fetch categories
  useEffect(() => {
    if (!isOpen) return;
    async function fetchCategories() {
      try {
        const res = await api.get<Category[]>('/categories');
        setCategories(res.data);
        if (!transaction && res.data.length > 0) {
          setCategoryId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, [isOpen, transaction]);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        categoryId,
        notes: notes.trim() || null,
      };

      if (isEditing) {
        await api.put(`/transactions/${transaction!.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Type
          </label>
          <div className="inline-flex rounded-lg border border-[var(--color-border)] overflow-hidden w-full">
            {(['INCOME', 'EXPENSE'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? t === 'INCOME'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {t === 'INCOME' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <Input
          id="amount"
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />

        {/* Description */}
        <Input
          id="description"
          label="Description"
          type="text"
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />

        {/* Date */}
        <Input
          id="date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Category */}
        <div className="space-y-1">
          <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text)]">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input w-full"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label htmlFor="notes" className="block text-sm font-medium text-[var(--color-text)]">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" isLoading={submitting} className="flex-1">
            {isEditing ? 'Update' : 'Add'} Transaction
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
