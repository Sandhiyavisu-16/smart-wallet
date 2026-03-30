import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Target, BarChart3, Info, CheckCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import type { Notification, NotificationType } from '../../types';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  BUDGET_WARNING: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  BUDGET_EXCEEDED: <AlertTriangle className="w-5 h-5 text-red-500" />,
  GOAL_MILESTONE: <Target className="w-5 h-5 text-green-500" />,
  WEEKLY_SUMMARY: <BarChart3 className="w-5 h-5 text-blue-500" />,
  SYSTEM: <Info className="w-5 h-5 text-[var(--color-text-secondary)]" />,
};

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  for (const n of notifications) {
    const date = new Date(n.createdAt).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  }
  return groups;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<Notification[]>('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}`, { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = groupByDate(notifications);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="card animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-border)]" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-[var(--color-border)] rounded mb-2" />
                <div className="h-3 w-64 bg-[var(--color-border)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)]">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                {date}
              </h3>
              <div className="card divide-y divide-[var(--color-border)] p-0">
                {items.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg-secondary)] ${
                      !notification.read ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                      {TYPE_ICONS[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
