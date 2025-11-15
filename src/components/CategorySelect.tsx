import { Shuffle } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [numberOfRounds, setNumberOfRounds] = useState<number>(5);
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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleShuffleAll = () => {
    setSelectedCategory('shuffle-all');
  };

  const handleStartGame = async () => {
    if (isStarting || !selectedCategory) return;

    setIsStarting(true);

    try {
      let selectedCategories: string[];

      if (selectedCategory === 'shuffle-all') {
        // Pass all unique categories
        selectedCategories = Array.from(new Set(profiles.map((p) => p.category)));
      } else {
        // Pass single selected category
        selectedCategories = [selectedCategory];
      }

      loadProfiles(profiles);

      startGame(selectedCategories, numberOfRounds);

      await forcePersist();

      window.location.href = `/game/${sessionId}`;
    } catch (error) {
      console.error('Failed to persist game state:', error);
      setIsStarting(false);
    }
  };

  const handleRoundsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(value) && value >= 1 && value <= 50) {
      setNumberOfRounds(value);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  if (selectedCategory) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('categorySelect.rounds.title')}
            </CardTitle>
            <CardDescription>
              {selectedCategory === 'shuffle-all'
                ? t('categorySelect.rounds.descriptionShuffleAll')
                : t('categorySelect.rounds.descriptionCategory', { category: selectedCategory })}
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
              <p className="text-sm text-muted-foreground">{t('categorySelect.rounds.hint')}</p>
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
                disabled={isStarting || numberOfRounds < 1}
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
          <div className="space-y-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => handleCategorySelect(category)}
                disabled={isStarting}
                className="w-full"
                size="lg"
                variant="outline"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('categorySelect.orLabel')}
              </span>
            </div>
          </div>

          <Button onClick={handleShuffleAll} disabled={isStarting} className="w-full" size="lg">
            <Shuffle className="mr-2 h-5 w-5" />
            {t('categorySelect.shuffleAllButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
