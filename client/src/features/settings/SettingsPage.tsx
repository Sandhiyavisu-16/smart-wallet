import { useState } from 'react';
import { User, Bell, CreditCard, Shield } from 'lucide-react';
import { ProfileForm } from './ProfileForm';
import { SubscriptionPanel } from './SubscriptionPanel';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'privacy', label: 'Data & Privacy', icon: Shield },
] as const;

type TabId = (typeof TABS)[number]['id'];

function NotificationSettings() {
  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Manage how and when you receive notifications.
      </p>

      <div className="space-y-3">
        {[
          { label: 'Budget warnings', description: 'When spending reaches 70% or 90% of budget' },
          { label: 'Budget exceeded', description: 'When a budget limit is exceeded' },
          { label: 'Goal milestones', description: 'When you hit 25%, 50%, 75%, or 100% of a goal' },
          { label: 'Weekly summary', description: 'A weekly digest of your financial activity' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-[var(--color-border)] rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div className="space-y-6 max-w-lg">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Manage your data and privacy settings.
      </p>

      <div className="card">
        <h3 className="font-semibold mb-2">Export Data</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Download all your transactions, budgets, goals, and settings as a JSON file.
        </p>
        <button className="btn-secondary text-sm">Export All Data</button>
      </div>

      <div className="card border-red-500 border">
        <h3 className="font-semibold text-red-500 mb-2">Danger Zone</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'profile' && <ProfileForm />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'subscription' && <SubscriptionPanel />}
        {activeTab === 'privacy' && <PrivacySettings />}
      </div>
    </div>
  );
}
