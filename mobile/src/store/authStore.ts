import { create } from 'zustand';
interface UserProfile { uid: string; provider: string; email: string; displayName: string; photoUrl: string; }
interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}
export const useAuthStore = create<AuthState>()((set) => ({
  user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
  setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
