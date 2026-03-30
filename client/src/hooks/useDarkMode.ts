import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { api } from '../lib/api';

export function useDarkMode() {
  const { user, updateUser } = useAuthStore();
  const isDark = user?.darkMode ?? false;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = async () => {
    const newValue = !isDark;
    updateUser({ darkMode: newValue });
    try {
      await api.put('/settings/profile', { darkMode: newValue });
    } catch {
      updateUser({ darkMode: isDark });
    }
  };

  return { isDark, toggleDarkMode };
}
