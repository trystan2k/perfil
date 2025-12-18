import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import translations from '../../public/locales/en/translation.json';
import { ReducedMotionProvider } from '../components/ReducedMotionProvider';
import { TranslateProvider } from '../components/TranslateProvider';
import { GAME_CONFIG } from '../config/gameConfig';

const locale = 'en';

export const customRender = (
  ui: React.ReactNode,
  {
    withQueryProvider = false,
    ...restOptions
  }: RenderOptions & { withQueryProvider?: boolean } = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = withQueryProvider
      ? new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        })
      : null;

    return (
      <TranslateProvider locale={locale} translations={translations}>
        <ReducedMotionProvider>
          {withQueryProvider && queryClient ? (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          ) : (
            children
          )}
        </ReducedMotionProvider>
      </TranslateProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...restOptions });
};

/**
 * Generates an array of clues with exactly GAME_CONFIG.game.maxCluesPerProfile (20) items.
 *
 * @param customClues - Optional array of custom clues to include
 *   - If provided with < 20 items: fills remaining slots with generated clues
 *   - If provided with >= 20 items: uses first 20 items
 *   - If not provided: generates 20 default clues
 * @param label - Optional label prefix for clues (e.g., 'Clue')
 * @returns Array of exactly 20 clues
 *
 * @example
 * // Use default generated clues
 * const clues = generateClues();
 *
 * // Use custom clues with auto-fill
 * const clues = generateClues(['My custom clue']);
 *
 * // Use custom clues with auto-trim
 * const clues = generateClues(['Clue 1', 'Clue 2', ..., 'Clue 30']);
 *
 * // Use custom clues with auto-fill
 * const clues = generateClues(['My custom clue'], 'Custom Clue');
 */
export function generateClues(customClues?: string[], label?: string): string[] {
  if (!customClues || customClues.length === 0) {
    // Generate default clues
    return Array.from(
      { length: GAME_CONFIG.game.maxCluesPerProfile },
      (_, i) => `${label || 'Clue'} ${i + 1}`
    );
  }

  if (customClues.length >= GAME_CONFIG.game.maxCluesPerProfile) {
    // Trim to exact count if more than needed
    return customClues.slice(0, GAME_CONFIG.game.maxCluesPerProfile);
  }

  // Fill remaining slots with generated clues
  const result = [...customClues];
  const customCount = customClues.length;
  for (let i = customCount; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
    result.push(`Clue ${i + 1}`);
  }
  return result;
}
