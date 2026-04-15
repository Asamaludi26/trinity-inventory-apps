import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserData {
  id: number;
  uuid: string;
  fullName: string;
  email: string;
  role: string;
  division?: { id: number; name: string; code: string } | null;
  permissions?: Record<string, boolean> | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: UserData, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<UserData>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // accessToken disimpan di memory saja (tidak di localStorage) untuk mencegah XSS
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        // accessToken disimpan di memory saja (tidak di localStorage) untuk mencegah XSS
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },

      logout: () => {
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        // accessToken TIDAK dipersist — disimpan di memory saja (XSS protection)
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
