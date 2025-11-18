import { type ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfiles } from '@/hooks/useProfiles';
import { forcePersist, useGameStore } from '@/stores/gameStore';

interface CategorySelectProps {
  sessionId: string;
}

export function CategorySelect({ sessionId }: CategorySelectProps) {
  const { t } = useTranslation();
  const { data: profilesData, isLoading, error } = useProfiles();
  const [isStarting, setIsStarting] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [numberOfRounds, setNumberOfRounds] = useState<string>('5');
  const [roundsInputError, setRoundsInputError] = useState<string | null>(null);
  const [showRoundsScreen, setShowRoundsScreen] = useState(false);
  const loadProfiles = useGameStore((state) => state.loadProfiles);
  const startGame = useGameStore((state) => state.startGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const success = await loadFromStorage(sessionId);
        if (!success) {
          setSessionError(t('categorySelect.error.sessionNotFoundDescription'));
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setSessionError(t('categorySelect.error.description'));
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();
  }, [sessionId, loadFromStorage, t]);

  if (isLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('categorySelect.loading.title')}
            </CardTitle>
            <CardDescription>{t('categorySelect.loading.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl text-destructive">
              {t('categorySelect.error.sessionNotFoundTitle')}
            </CardTitle>
            <CardDescription className="text-destructive">
              {t('categorySelect.error.sessionNotFoundDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full"
            >
              {t('common.returnHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profilesData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl text-destructive">
              {t('categorySelect.error.title')}
            </CardTitle>
            <CardDescription className="text-destructive">
              {t('categorySelect.error.description')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const profiles = profilesData.profiles;
  const categories = Array.from(new Set(profiles.map((profile) => profile.category))).sort();

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
    setShowRoundsScreen(true);
  };

  const handleBackToCategories = () => {
    setShowRoundsScreen(false);
  };

  const handleStartGame = async () => {
    if (isStarting || selectedCategories.size === 0) return;

    setIsStarting(true);

    try {
      loadProfiles(profiles);
      const numRounds = Number.parseInt(numberOfRounds, 10);
      startGame(Array.from(selectedCategories), numRounds);
      await forcePersist();
      window.location.href = `/game/${sessionId}`;
    } catch (error) {
      console.error('Failed to persist game state:', error);
      setIsStarting(false);
    }
  };

  const handleRoundsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumberOfRounds(value);

    // Only validate if value is not empty
    if (value === '') {
      setRoundsInputError(null);
    } else {
      const numValue = Number.parseInt(value, 10);
      if (Number.isNaN(numValue) || numValue < 1 || numValue > 50) {
        setRoundsInputError('Invalid');
      } else {
        setRoundsInputError(null);
      }
    }
  };

  // Show rounds configuration screen if categories are selected and Continue was clicked
  if (showRoundsScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
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
                max="50"
                value={numberOfRounds}
                onChange={handleRoundsChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {roundsInputError ? (
                <p className="text-sm text-destructive">
                  {t('categorySelect.rounds.hint')} (Invalid value)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t('categorySelect.rounds.hint')}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleBackToCategories}
                disabled={isStarting}
                className="flex-1"
                variant="outline"
                size="lg"
              >
                {t('common.back')}
              </Button>
              <Button
                onClick={handleStartGame}
                disabled={isStarting || roundsInputError !== null || numberOfRounds === ''}
                className="flex-1"
                size="lg"
              >
                {t('categorySelect.rounds.startButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show category selection screen
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
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
              disabled={isStarting || selectedCategories.size === categories.length}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t('categorySelect.selectAll')}
            </Button>
            <Button
              onClick={handleDeselectAll}
              disabled={isStarting || selectedCategories.size === 0}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t('categorySelect.deselectAll')}
            </Button>
          </div>

          {/* Category Checkboxes */}
          <div className="space-y-3">
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
                    disabled={isStarting}
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
            disabled={isStarting || selectedCategories.size === 0}
            className="w-full"
            size="lg"
          >
            {t('common.continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
