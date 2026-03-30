import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  TrendingUp,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../store';
import { useAuthStore } from '../../store';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/investments', label: 'Investments', icon: TrendingUp },
  { to: '/advisor', label: 'AI Advisor', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
        <Wallet className="w-8 h-8 text-primary-600 shrink-0" />
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-primary-600">SmartWallet</span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]'
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-[var(--color-border)]">
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase">{user.tier} plan</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
