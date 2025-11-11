import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/stores/gameStore';

interface GamePlayProps {
  sessionId?: string;
}

export function GamePlay({ sessionId }: GamePlayProps) {
  const [isLoading, setIsLoading] = useState(!!sessionId);
  const [loadError, setLoadError] = useState<string | null>(null);

  const id = useGameStore((state) => state.id);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const players = useGameStore((state) => state.players);
  const status = useGameStore((state) => state.status);
  const category = useGameStore((state) => state.category);
  const totalCluesPerProfile = useGameStore((state) => state.totalCluesPerProfile);
  const nextClue = useGameStore((state) => state.nextClue);
  const passTurn = useGameStore((state) => state.passTurn);
  const awardPoints = useGameStore((state) => state.awardPoints);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);

  // Attempt to load game from storage on mount
  useEffect(() => {
    let isMounted = true;

    const loadGame = async () => {
      // If there's already a game loaded in the store, don't reload
      if (id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      // If a sessionId is provided, try to load it
      if (sessionId) {
        try {
          const loaded = await loadFromStorage(sessionId);

          // Check if the effect was cancelled (component unmounted or sessionId changed)
          if (!isMounted) {
            return;
          }

          if (!loaded) {
            if (isMounted) {
              setLoadError('Game session not found. Please start a new game.');
            }
          }
        } catch (error) {
          if (!isMounted) {
            return;
          }

          console.error('Failed to load game session:', error);
          if (isMounted) {
            setLoadError('Failed to load game session. Please try again.');
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadGame();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [sessionId, id, loadFromStorage]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              Loading...
            </CardTitle>
            <CardDescription>Loading game session...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error if loading failed
  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              Error
            </CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Early return if no active game
  if (status !== 'active' || !currentTurn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              No Active Game
            </CardTitle>
            <CardDescription>Please start a game first.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Find the active player
  const activePlayer = players.find((p) => p.id === currentTurn.activePlayerId);

  // Mock clue data (will be replaced with actual profile data later)
  const mockClues = Array.from({ length: totalCluesPerProfile }, (_, i) => `Clue ${i + 1} text...`);
  const currentClueText = currentTurn.cluesRead > 0 ? mockClues[currentTurn.cluesRead - 1] : null;

  // Check if max clues reached
  const isMaxCluesReached = currentTurn.cluesRead >= totalCluesPerProfile;

  // Check if points can be awarded (at least one clue has been read)
  const canAwardPoints = currentTurn.cluesRead > 0;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle as="h3" className="text-2xl">
            Game Play
          </CardTitle>
          <CardDescription>Category: {category}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Player Section */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-center">
              {activePlayer ? activePlayer.name : 'Unknown Player'}
            </div>
            <p className="text-center text-muted-foreground">Current Player</p>
          </div>

          {/* Clue Section */}
          <div className="space-y-4 p-6 bg-secondary rounded-lg">
            {currentTurn.cluesRead > 0 ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Clue {currentTurn.cluesRead} of {totalCluesPerProfile}
                </p>
                <p className="text-lg font-medium">{currentClueText}</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Press "Show Next Clue" to reveal the first clue
              </p>
            )}
          </div>

          {/* MC Controls */}
          <div className="flex gap-4 justify-center">
            <Button onClick={nextClue} disabled={isMaxCluesReached}>
              Show Next Clue
            </Button>
            <Button onClick={passTurn} variant="outline">
              Pass
            </Button>
          </div>

          {/* Player Scoreboard */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-center">Players - Tap to Award Points</h4>
            <div className="grid gap-2">
              {players.map((player) => (
                <Button
                  key={player.id}
                  onClick={() => awardPoints(player.id)}
                  disabled={!canAwardPoints}
                  variant={player.id === currentTurn.activePlayerId ? 'default' : 'outline'}
                  className="w-full h-auto py-3 flex justify-between items-center"
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="text-lg font-bold">{player.score} pts</span>
                </Button>
              ))}
            </div>
            {!canAwardPoints && (
              <p className="text-sm text-center text-muted-foreground">
                Show at least one clue to award points
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
