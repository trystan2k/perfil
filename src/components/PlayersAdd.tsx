import { X } from 'lucide-react';
import { type KeyboardEvent, useActionState, useState } from 'react';
import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { navigateWithLocale } from '@/i18n/locales';
import { GAME_CONFIG } from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { useTranslate } from './TranslateProvider';

type StartGameState = {
  error: string | null;
};

export function PlayersAdd() {
  const { t } = useTranslate();
  const [playerName, setPlayerName] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const createGame = useGameStore((state) => state.createGame);
  const setGlobalError = useGameStore((state) => state.setError);

  // useActionState for game creation with built-in pending state
  const [_actionState, startGameAction, isPending] = useActionState<StartGameState, FormData>(
    async (_prevState: StartGameState, formData: FormData): Promise<StartGameState> => {
      try {
        // Extract player names from FormData to avoid stale closure over state
        const names = Array.from(formData.values()).map((v) => v.toString());

        // Wait for game creation and persistence to complete
        await createGame(names);

        // Access the game ID directly from the store after createGame completes
        const newGameId = useGameStore.getState().id;

        // Navigate to category selection screen
        // Persistence is guaranteed to be complete since createGame awaits it
        navigateWithLocale(`/game-setup/${newGameId}`);

        return { error: null };
      } catch (err) {
        console.error('Failed to create game:', err);
        // Use global error handler for critical failures
        setGlobalError('playersAdd.errors.failedToCreateGame');
        return { error: 'playersAdd.errors.failedToCreateGame' };
      }
    },
    { error: null }
  );

  const handleAddPlayer = () => {
    const trimmedName = playerName.trim();

    // Validate empty name
    if (!trimmedName) {
      return;
    }

    // Validate player limit
    if (playerNames.length >= GAME_CONFIG.game.maxPlayers) {
      return;
    }

    // Check for duplicate names (case-insensitive)
    if (playerNames.some((name) => name.toLowerCase() === trimmedName.toLowerCase())) {
      setGlobalError('playersAdd.errors.duplicateName', true);
      return;
    }

    setPlayerNames([...playerNames, trimmedName]);
    setPlayerName('');
  };

  const handleRemovePlayer = (index: number) => {
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const handleStartGame = () => {
    // Pass player names via FormData to avoid stale closure
    const formData = new FormData();
    for (let i = 0; i < playerNames.length; i++) {
      formData.append(`player-${i}`, playerNames[i]);
    }
    startGameAction(formData);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  return (
    <div className="min-h-main py-6">
      <AdaptiveContainer maxWidth="2xl" className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('playersAdd.title')}
            </CardTitle>
            <CardDescription>{t('playersAdd.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Player Input */}
            <div className="space-y-2">
              <Label htmlFor="playerName">{t('playersAdd.playerNameLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="playerName"
                  type="text"
                  placeholder={t('playersAdd.playerNamePlaceholder')}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={30}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddPlayer}
                  disabled={!playerName.trim() || playerNames.length >= GAME_CONFIG.game.maxPlayers}
                >
                  {t('playersAdd.addButton')}
                </Button>
              </div>
            </div>

            {/* Players List */}
            {playerNames.length > 0 && (
              <div className="space-y-2">
                <Label>
                  {t('playersAdd.playersLabel', {
                    count: playerNames.length,
                    max: GAME_CONFIG.game.maxPlayers,
                  })}
                </Label>
                <div className="space-y-2">
                  {playerNames.map((name, index) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 bg-secondary rounded-md"
                    >
                      <span className="font-medium">{name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePlayer(index)}
                        aria-label={t('playersAdd.removePlayerAriaLabel', { name })}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Game Button */}
            <Button
              onClick={handleStartGame}
              disabled={playerNames.length < 2 || isPending}
              className="w-full"
              size="lg"
            >
              {t('playersAdd.startButton')}
            </Button>
          </CardContent>
        </Card>
      </AdaptiveContainer>
    </div>
  );
}
