import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import type { SavingsGoal } from '../../types';

export function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.get<SavingsGoal[]>('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function handleContribute(goalId: string, amount: number) {
    await api.post(`/goals/${goalId}/contribute`, { amount });
    fetchGoals();
  }

  function handleEdit(goal: SavingsGoal) {
    setEditing(goal);
    setFormOpen(true);
  }

  async function handleDelete(goal: SavingsGoal) {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    try {
      await api.delete(`/goals/${goal.id}`);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
  }

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Savings Goals</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse flex flex-col items-center gap-4 py-8">
              <div className="w-32 h-32 rounded-full bg-[var(--color-border)]" />
              <div className="h-4 w-24 bg-[var(--color-border)] rounded" />
              <div className="h-3 w-32 bg-[var(--color-border)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Savings Goals</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)] mb-4">
            No savings goals yet. Set a goal to start saving toward something meaningful.
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Your First Goal
          </Button>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Active Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={handleContribute}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Completed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={handleContribute}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <GoalForm
        isOpen={formOpen}
        onClose={handleFormClose}
        onSaved={fetchGoals}
        goal={editing}
      />
    </div>
  );
}
