import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameStore } from '@/stores/gameStore';

export function GameSetup() {
  const [playerName, setPlayerName] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const createGame = useGameStore((state) => state.createGame);

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
      setError('Player name already exists');
      return;
    }

    setPlayerNames([...playerNames, trimmedName]);
    setPlayerName('');
    setError(null);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayerNames(playerNames.filter((_, i) => i !== index));
    setError(null);
  };

  const handleStartGame = () => {
    createGame(playerNames);
    // Navigate to game screen - will be handled by parent component/router
    window.location.href = '/game';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle as="h3" className="text-2xl">
            Game Setup
          </CardTitle>
          <CardDescription>
            Add players to start a new game. You need at least 2 players.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Player Input */}
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <div className="flex gap-2">
              <Input
                id="playerName"
                type="text"
                placeholder="Enter player name"
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
                Add
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          {/* Players List */}
          {playerNames.length > 0 && (
            <div className="space-y-2">
              <Label>Players ({playerNames.length}/8)</Label>
              <div className="space-y-2">
                {playerNames.map((name, index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-secondary rounded-md"
                  >
                    <span className="font-medium">{name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlayer(index)}
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-4 w-4" />
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
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
