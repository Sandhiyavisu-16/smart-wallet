import { useEffect, useState } from 'react';
import { Bell, Moon, Sun, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store';
import { useDarkMode } from '../../hooks/useDarkMode';

export function TopNav() {
  const { logout } = useAuthStore();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications?unreadOnly=true');
        setUnreadCount(data.data.length);
      } catch {
        // silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    logout();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-card)]">
      <button
        onClick={toggleDarkMode}
        className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <button
        className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={handleLogout}
        className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
}
