import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage/mmkv';
interface OfflineState {
  cachedDates: string[];
  lastSyncAt: string | null;
  markCached: (date: string) => void;
  isCached: (date: string) => boolean;
}
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      cachedDates: [],
      lastSyncAt: null,
      markCached: (date) => set((s) => ({ cachedDates: [...new Set([...s.cachedDates, date])], lastSyncAt: new Date().toISOString() })),
      isCached: (date) => get().cachedDates.includes(date),
    }),
    { name: 'offline-store', storage: zustandStorage }
  )
);
