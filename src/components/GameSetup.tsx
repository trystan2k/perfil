import { X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameStore } from '@/stores/gameStore';

export function GameSetup() {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const createGame = useGameStore((state) => state.createGame);
  const setGlobalError = useGameStore((state) => state.setError);

  const handleAddPlayer = () => {
    const trimmedName = playerName.trim();

    // Validate empty name
    if (!trimmedName) {
      return;
    }

    // Validate player limit
    if (playerNames.length >= 8) {
      return;
    }

    // Check for duplicate names (case-insensitive)
    if (playerNames.some((name) => name.toLowerCase() === trimmedName.toLowerCase())) {
      setGlobalError('gameSetup.errors.duplicateName', true);
      return;
    }

    setPlayerNames([...playerNames, trimmedName]);
    setPlayerName('');
  };

  const handleRemovePlayer = (index: number) => {
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const handleStartGame = async () => {
    try {
      // Wait for game creation and persistence to complete
      await createGame(playerNames);

      // Access the game ID directly from the store after createGame completes
      const newGameId = useGameStore.getState().id;

      // Navigate to category selection screen
      // Persistence is guaranteed to be complete since createGame awaits it
      window.location.href = `/game-setup/${newGameId}`;
    } catch (err) {
      console.error('Failed to create game:', err);
      // Use global error handler for critical failures
      setGlobalError('gameSetup.errors.failedToCreateGame');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-main p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle as="h3" className="text-2xl">
            {t('gameSetup.title')}
          </CardTitle>
          <CardDescription>{t('gameSetup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Player Input */}
          <div className="space-y-2">
            <Label htmlFor="playerName">{t('gameSetup.playerNameLabel')}</Label>
            <div className="flex gap-2">
              <Input
                id="playerName"
                type="text"
                placeholder={t('gameSetup.playerNamePlaceholder')}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={30}
                className="flex-1"
              />
              <Button
                onClick={handleAddPlayer}
                disabled={!playerName.trim() || playerNames.length >= 8}
              >
                {t('gameSetup.addButton')}
              </Button>
            </div>
          </div>

          {/* Players List */}
          {playerNames.length > 0 && (
            <div className="space-y-2">
              <Label>{t('gameSetup.playersLabel', { count: playerNames.length, max: 8 })}</Label>
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
                      aria-label={t('gameSetup.removePlayerAriaLabel', { name })}
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
            disabled={playerNames.length < 2}
            className="w-full"
            size="lg"
          >
            {t('gameSetup.startButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
