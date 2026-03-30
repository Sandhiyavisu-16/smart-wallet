import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PageWrapper } from './components/layout/PageWrapper';

// Lazy load all pages
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('./features/auth/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TransactionsPage = lazy(() => import('./features/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const BudgetsPage = lazy(() => import('./features/budgets/BudgetsPage').then(m => ({ default: m.BudgetsPage })));
const GoalsPage = lazy(() => import('./features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })));
const InvestmentsPage = lazy(() => import('./features/investments/InvestmentsPage').then(m => ({ default: m.InvestmentsPage })));
const AdvisorPage = lazy(() => import('./features/advisor/AdvisorPage').then(m => ({ default: m.AdvisorPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    path: '/register',
    element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper>,
  },
  {
    path: '/onboarding',
    element: <SuspenseWrapper><OnboardingPage /></SuspenseWrapper>,
  },
  {
    path: '/',
    element: <PageWrapper />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
      { path: 'transactions', element: <SuspenseWrapper><TransactionsPage /></SuspenseWrapper> },
      { path: 'budgets', element: <SuspenseWrapper><BudgetsPage /></SuspenseWrapper> },
      { path: 'goals', element: <SuspenseWrapper><GoalsPage /></SuspenseWrapper> },
      { path: 'investments', element: <SuspenseWrapper><InvestmentsPage /></SuspenseWrapper> },
      { path: 'advisor', element: <SuspenseWrapper><AdvisorPage /></SuspenseWrapper> },
      { path: 'notifications', element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
    ],
  },
]);
