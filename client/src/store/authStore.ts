import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, _token) =>
        set({
          user,
          token: null, // No longer store token in client state
          isAuthenticated: true,
        }),
      logout: () => {
        // Fire-and-forget the cookie-clearing request
        axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'enderase-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
