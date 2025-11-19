import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const VALID_THEMES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof VALID_THEMES)[number];

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
        if (state && VALID_THEMES.includes(state.theme)) {
          console.warn(`Invalid theme '${state.theme}' in localStorage, resetting to 'system'`);
          useThemeStore.getState().setTheme('system');
        }
      },
    }
  )
);
