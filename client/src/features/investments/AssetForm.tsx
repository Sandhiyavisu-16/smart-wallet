import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Asset, AssetType } from '../../types';

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  asset?: Asset | null;
}

const ASSET_TYPES: AssetType[] = ['STOCK', 'BOND', 'CRYPTO', 'MUTUAL_FUND', 'ETF', 'REAL_ESTATE', 'OTHER'];

export function AssetForm({ isOpen, onClose, onSaved, asset }: AssetFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('STOCK');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setType(asset.type);
      setQuantity(asset.quantity.toString());
      setPurchasePrice(asset.purchasePrice.toString());
      setCurrentPrice(asset.currentPrice.toString());
      setPurchaseDate(asset.purchaseDate.split('T')[0]);
      setNotes(asset.notes || '');
    } else {
      setName('');
      setType('STOCK');
      setQuantity('');
      setPurchasePrice('');
      setCurrentPrice('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setError('');
  }, [asset, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !quantity || !purchasePrice || !currentPrice) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        currentPrice: parseFloat(currentPrice),
        purchaseDate,
        notes: notes.trim() || null,
      };

      if (asset) {
        await api.put(`/investments/${asset.id}`, payload);
      } else {
        await api.post('/investments', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save asset.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'Edit Asset' : 'Add Asset'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <Input
          id="asset-name"
          label="Asset Name"
          placeholder="e.g., Apple Inc."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--color-text)]">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AssetType)}
            className="input w-full"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="asset-qty"
          label="Quantity"
          type="number"
          step="any"
          min="0"
          placeholder="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="asset-purchase-price"
            label="Purchase Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="150.00"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
          <Input
            id="asset-current-price"
            label="Current Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="175.00"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
          />
        </div>

        <Input
          id="asset-date"
          label="Purchase Date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />

        <div className="space-y-1">
          <label htmlFor="asset-notes" className="block text-sm font-medium text-[var(--color-text)]">
            Notes (optional)
          </label>
          <textarea
            id="asset-notes"
            rows={3}
            className="input w-full resize-none"
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {asset ? 'Update Asset' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
