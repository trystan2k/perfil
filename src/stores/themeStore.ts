import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme: ThemeMode) => {
        if (['light', 'dark', 'system'].includes(theme)) {
          set({ theme });
        } else {
          console.warn(`Invalid theme '${theme}', falling back to 'system'`);
          set({ theme: 'system' });
        }
      },
    }),
    {
      name: 'perfil-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // Validate theme during rehydration from localStorage
        if (state && !['light', 'dark', 'system'].includes(state.theme)) {
          console.warn(`Invalid theme '${state.theme}' in localStorage, resetting to 'system'`);
          useThemeStore.getState().setTheme('system');
        }
      },
    }
  )
);
