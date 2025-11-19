import type { ReactNode } from 'react';
import { GameStateProvider } from './GameStateProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';

export interface GameStateProviderWrapperProps {
  /**
   * Current locale for i18n
   */
  locale: string;

  /**
   * Children to render
   */
  children: ReactNode;
}

/**
 * GameStateProviderWrapper
 *
 * Combines multiple context providers in the correct order:
 * 1. ThemeProvider (theme state)
 * 2. I18nProvider (i18n state)
 * 3. GameStateProvider (loading/error state)
 *
 * This wrapper is used in the main Layout.astro to provide global state to the application.
 */
export function GameStateProviderWrapper({ locale, children }: GameStateProviderWrapperProps) {
  return (
    <ThemeProvider>
      <I18nProvider locale={locale}>
        <GameStateProvider>{children}</GameStateProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
