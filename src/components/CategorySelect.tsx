import { type ChangeEvent, useActionState, useEffect, useState } from 'react';
import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { ProfileLoadingSkeleton } from '@/components/ProfileLoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GAME_CONFIG } from '@/config/gameConfig';
import { useCategoriesFromManifest } from '@/hooks/useCategoriesFromManifest';
import { navigateWithLocale } from '@/i18n/locales';
import { forcePersist, useGameStore } from '@/stores/gameStore';
import { useTranslate } from './TranslateProvider';

interface CategorySelectProps {
  sessionId: string;
  locale: string;
}

type StartGameState = {
  error: string | null;
};

export function CategorySelect({ sessionId, locale }: CategorySelectProps) {
  const { t } = useTranslate();

  const { data: categoriesData, isLoading, error } = useCategoriesFromManifest(locale);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [numberOfRounds, setNumberOfRounds] = useState<string>('5');
  const [roundsInputError, setRoundsInputError] = useState<string | null>(null);
  const [showRoundsScreen, setShowRoundsScreen] = useState(false);
  const startGame = useGameStore((state) => state.startGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);
  const setGlobalError = useGameStore((state) => state.setError);

  // useActionState for game start with built-in pending state
  const [_actionState, startGameAction, isPending] = useActionState<StartGameState, FormData>(
    async (_prevState: StartGameState, formData: FormData): Promise<StartGameState> => {
      // Extract values from FormData to avoid stale closures
      const categoriesStr = formData.get('categories') as string;
      const selectedCategorySlugs = JSON.parse(categoriesStr) as string[];
      const roundsStr = formData.get('rounds') as string;

      if (selectedCategorySlugs.length === 0) {
        return { error: 'categorySelect.error.noCategories' };
      }

      try {
        const numRounds = Number.parseInt(roundsStr, 10);
        // startGame will now handle loading profiles internally (async)
        await startGame(selectedCategorySlugs, numRounds, locale);
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

  if (error || !categoriesData) {
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

  // Calculate max available profiles for selected categories
  const selectedCategoryObjects = categoriesData.filter((cat) => selectedCategories.has(cat.slug));
  const maxAvailableProfiles = selectedCategoryObjects.reduce(
    (sum, cat) => sum + cat.profileAmount,
    0
  );

  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories(new Set(categoriesData.map((cat) => cat.slug)));
  };

  const handleDeselectAll = () => {
    setSelectedCategories(new Set());
  };

  const handleContinueToRounds = () => {
    if (selectedCategories.size === 0) return;

    // Calculate max available profiles for selected categories
    const maxProfiles = categoriesData
      .filter((cat) => selectedCategories.has(cat.slug))
      .reduce((sum, cat) => sum + cat.profileAmount, 0);

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
      const maxAllowed =
        maxAvailableProfiles > 0 ? maxAvailableProfiles : GAME_CONFIG.game.defaultMaxProfiles;
      if (Number.isNaN(numValue) || numValue < 1 || numValue > maxAllowed) {
        setRoundsInputError(t('categorySelect.rounds.invalidInput'));
      } else {
        setRoundsInputError(null);
      }
    }
  };

  // Get selected category names for display
  const selectedCategoryNames = categoriesData
    .filter((cat) => selectedCategories.has(cat.slug))
    .map((cat) => cat.name)
    .join(', ');

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
                  category: selectedCategoryNames,
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
                disabled={isPending || selectedCategories.size === categoriesData.length}
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
              {categoriesData.map((category) => (
                <div key={category.slug}>
                  <label
                    htmlFor={`category-${category.slug}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
                  >
                    <input
                      id={`category-${category.slug}`}
                      type="checkbox"
                      checked={selectedCategories.has(category.slug)}
                      onChange={() => handleCategoryToggle(category.slug)}
                      disabled={isPending}
                      className="w-5 h-5 rounded border-2 border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-medium">{category.name}</span>
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
