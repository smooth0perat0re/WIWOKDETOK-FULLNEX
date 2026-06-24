import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        if (typeof document !== 'undefined') {
          document.cookie = `wiwok_auth_token=${token}; path=/; max-age=86400`;
        }
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = `wiwok_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'wiwok-auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
