import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage/mmkv';
type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeState { mode: ThemeMode; setMode: (mode: ThemeMode) => void; }
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({ mode: 'system' as ThemeMode, setMode: (mode) => set({ mode }) }),
    { name: 'theme-store', storage: zustandStorage }
  )
);
