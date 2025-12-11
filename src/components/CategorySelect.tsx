import { type ChangeEvent, useActionState, useEffect, useState } from 'react';
import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { ProfileLoadingSkeleton } from '@/components/ProfileLoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrefetchProfiles } from '@/hooks/usePrefetchProfiles';
import { useProfiles } from '@/hooks/useProfiles';
import { navigateWithLocale } from '@/i18n/locales';
import { getPopularCategoriesForLocale, PREFETCH_CONFIG } from '@/lib/prefetch-config';
import { forcePersist, useGameStore } from '@/stores/gameStore';
import { useTranslate } from './TranslateProvider';

interface CategorySelectProps {
  sessionId: string;
}

type StartGameState = {
  error: string | null;
};

export function CategorySelect({ sessionId }: CategorySelectProps) {
  const { t } = useTranslate();
  const { data: profilesData, isLoading, error } = useProfiles();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [numberOfRounds, setNumberOfRounds] = useState<string>('5');
  const [roundsInputError, setRoundsInputError] = useState<string | null>(null);
  const [showRoundsScreen, setShowRoundsScreen] = useState(false);
  const loadProfiles = useGameStore((state) => state.loadProfiles);
  const startGame = useGameStore((state) => state.startGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);
  const setGlobalError = useGameStore((state) => state.setError);

  // useActionState for game start with built-in pending state
  const [_actionState, startGameAction, isPending] = useActionState<StartGameState, FormData>(
    async (_prevState: StartGameState, formData: FormData): Promise<StartGameState> => {
      // Extract values from FormData to avoid stale closures
      const categoriesStr = formData.get('categories') as string;
      const categories = JSON.parse(categoriesStr) as string[];
      const roundsStr = formData.get('rounds') as string;

      if (categories.length === 0) {
        return { error: 'categorySelect.error.noCategories' };
      }

      try {
        loadProfiles(profiles);
        const numRounds = Number.parseInt(roundsStr, 10);
        startGame(categories, numRounds);
        await forcePersist();
        navigateWithLocale(`/game/${sessionId}`);
        return { error: null };
      } catch (error) {
        console.error('Failed to start game:', error);
        setGlobalError('categorySelect.error.description');
        return { error: 'categorySelect.error.description' };
      }
    },
    { error: null }
  );

  // Get current locale for prefetch configuration
  // Use getCurrentLocale utility which is test-safe
  const currentLocale =
    (typeof window !== 'undefined' && window.location?.pathname?.split('/')[1]) || 'en';

  // Prefetch popular categories in the background
  usePrefetchProfiles({
    categories: getPopularCategoriesForLocale(currentLocale),
    enabled: PREFETCH_CONFIG.enabled && !isLoading && !error,
  });

  useEffect(() => {
    const loadSession = async () => {
      // loadFromStorage now handles errors via global state
      await loadFromStorage(sessionId);
      setSessionLoading(false);
    };

    loadSession();
  }, [sessionId, loadFromStorage]);

  if (isLoading || sessionLoading) {
    return <ProfileLoadingSkeleton />;
  }

  // Session errors are now handled by global ErrorStateProvider

  if (error || !profilesData) {
    return (
      <div className="min-h-main py-6">
        <AdaptiveContainer maxWidth="2xl" className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full">
            <CardHeader>
              <CardTitle as="h3" className="text-2xl text-destructive">
                {t('categorySelect.error.title')}
              </CardTitle>
              <CardDescription className="text-destructive">
                {t('categorySelect.error.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </AdaptiveContainer>
      </div>
    );
  }

  const profiles = profilesData.profiles;
  const categories = Array.from(new Set(profiles.map((profile) => profile.category))).sort();

  // Calculate max available profiles for selected categories
  const maxAvailableProfiles = profiles.filter((p) =>
    Array.from(selectedCategories).includes(p.category)
  ).length;

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories(new Set(categories));
  };

  const handleDeselectAll = () => {
    setSelectedCategories(new Set());
  };

  const handleContinueToRounds = () => {
    if (selectedCategories.size === 0) return;

    // Calculate max available profiles for selected categories
    const maxProfiles = profiles.filter((p) =>
      Array.from(selectedCategories).includes(p.category)
    ).length;

    // Set initial value to min(5, maxProfiles)
    const initialRounds = Math.min(5, maxProfiles);
    setNumberOfRounds(String(initialRounds));
    setRoundsInputError(null);

    setShowRoundsScreen(true);
  };

  const handleBackToCategories = () => {
    setShowRoundsScreen(false);
  };

  const handleStartGame = () => {
    // Pass categories and rounds via FormData to avoid stale closure
    const formData = new FormData();
    formData.append('categories', JSON.stringify(Array.from(selectedCategories)));
    formData.append('rounds', numberOfRounds);
    startGameAction(formData);
  };

  const handleRoundsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumberOfRounds(value);

    // Only validate if value is not empty
    if (value === '') {
      setRoundsInputError(null);
    } else {
      const numValue = Number.parseInt(value, 10);
      const maxAllowed = maxAvailableProfiles > 0 ? maxAvailableProfiles : 50;
      if (Number.isNaN(numValue) || numValue < 1 || numValue > maxAllowed) {
        setRoundsInputError(t('categorySelect.rounds.invalidInput'));
      } else {
        setRoundsInputError(null);
      }
    }
  };

  // Show rounds configuration screen if categories are selected and Continue was clicked
  if (showRoundsScreen) {
    return (
      <div className="min-h-main py-6">
        <AdaptiveContainer maxWidth="2xl" className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full">
            <CardHeader>
              <CardTitle as="h3" className="text-2xl">
                {t('categorySelect.rounds.title')}
              </CardTitle>
              <CardDescription>
                {t('categorySelect.rounds.descriptionCategory', {
                  category: Array.from(selectedCategories).join(', '),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="rounds-input"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('categorySelect.rounds.label')}
                </label>
                <input
                  id="rounds-input"
                  type="number"
                  min="1"
                  max={maxAvailableProfiles > 0 ? maxAvailableProfiles : 50}
                  value={numberOfRounds}
                  onChange={handleRoundsChange}
                  aria-invalid={roundsInputError !== null}
                  aria-describedby="rounds-hint"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p
                  id="rounds-hint"
                  className={`text-sm ${roundsInputError ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {t('categorySelect.rounds.hint', {
                    min: 1,
                    max: maxAvailableProfiles > 0 ? maxAvailableProfiles : 50,
                  })}
                  {roundsInputError && ` (${roundsInputError})`}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBackToCategories}
                  disabled={isPending}
                  className="flex-1"
                  variant="outline"
                  size="lg"
                >
                  {t('common.back')}
                </Button>
                <Button
                  onClick={handleStartGame}
                  disabled={isPending || roundsInputError !== null || numberOfRounds === ''}
                  className="flex-1"
                  size="lg"
                >
                  {t('categorySelect.rounds.startButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </AdaptiveContainer>
      </div>
    );
  }

  // Show category selection screen
  return (
    <div className="min-h-main py-6">
      <AdaptiveContainer maxWidth="2xl" className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('categorySelect.title')}
            </CardTitle>
            <CardDescription>{t('categorySelect.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select All / Deselect All Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handleSelectAll}
                disabled={isPending || selectedCategories.size === categories.length}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {t('categorySelect.selectAll')}
              </Button>
              <Button
                onClick={handleDeselectAll}
                disabled={isPending || selectedCategories.size === 0}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {t('categorySelect.deselectAll')}
              </Button>
            </div>

            {/* Category Checkboxes - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((category) => (
                <div key={category}>
                  <label
                    htmlFor={`category-${category}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
                  >
                    <input
                      id={`category-${category}`}
                      type="checkbox"
                      checked={selectedCategories.has(category)}
                      onChange={() => handleCategoryToggle(category)}
                      disabled={isPending}
                      className="w-5 h-5 rounded border-2 border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-medium">{category}</span>
                  </label>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinueToRounds}
              disabled={isPending || selectedCategories.size === 0}
              className="w-full"
              size="lg"
            >
              {t('common.continue')}
            </Button>
          </CardContent>
        </Card>
      </AdaptiveContainer>
    </div>
  );
}
