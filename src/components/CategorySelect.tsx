import { Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfiles } from '@/hooks/useProfiles';
import { useGameStore } from '@/stores/gameStore';

interface CategorySelectProps {
  sessionId: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function CategorySelect({ sessionId }: CategorySelectProps) {
  const { t } = useTranslation();
  const { data: profilesData, isLoading, error } = useProfiles();
  const [isStarting, setIsStarting] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const loadProfiles = useGameStore((state) => state.loadProfiles);
  const startGame = useGameStore((state) => state.startGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);

  // Load session from IndexedDB on mount
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

  // Extract unique categories from profiles
  const categories = Array.from(new Set(profiles.map((profile) => profile.category))).sort();

  const handleCategorySelect = (category: string) => {
    if (isStarting) return;

    setIsStarting(true);

    // Filter profiles by selected category
    const categoryProfiles = profiles.filter((p) => p.category === category);

    // Shuffle profiles within the category
    const shuffledProfiles = shuffleArray(categoryProfiles);

    // Load all profiles into the store
    loadProfiles(profiles);

    // Start game with selected profile IDs
    const selectedProfileIds = shuffledProfiles.map((p) => p.id);
    startGame(selectedProfileIds);

    // Navigate to game page
    window.location.href = `/game/${sessionId}`;
  };

  const handleShuffleAll = () => {
    if (isStarting) return;

    setIsStarting(true);

    // Shuffle all profiles across all categories
    const shuffledProfiles = shuffleArray(profiles);

    // Load all profiles into the store
    loadProfiles(profiles);

    // Start game with all profile IDs
    const selectedProfileIds = shuffledProfiles.map((p) => p.id);
    startGame(selectedProfileIds);

    // Navigate to game page
    window.location.href = `/game/${sessionId}`;
  };

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
          {/* Category Buttons */}
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

          {/* Divider */}
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

          {/* Shuffle All Button */}
          <Button onClick={handleShuffleAll} disabled={isStarting} className="w-full" size="lg">
            <Shuffle className="mr-2 h-5 w-5" />
            {t('categorySelect.shuffleAllButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
