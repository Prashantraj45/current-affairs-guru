import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

export const storage = createMMKV({ id: 'cag-storage' });

// Raw StateStorage adapter (string-based)
const rawStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => { storage.set(name, value); },
  removeItem: (name: string): void => { storage.remove(name); },
};

// Zustand-compatible PersistStorage (wraps with JSON serialization)
export const zustandStorage = createJSONStorage(() => rawStorage);
