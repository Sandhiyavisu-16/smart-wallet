import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import { useAuthStore } from '../store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const { data } = await api.post('/auth/login', { firebaseToken: token });
          login(data.user, data.token);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    });

    return unsubscribe;
  }, [login, logout, setLoading]);

  return { user, isAuthenticated, isLoading };
}
