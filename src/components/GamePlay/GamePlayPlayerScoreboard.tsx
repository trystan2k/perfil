import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Player } from '@/types/models';

interface GamePlayPlayerScoreboardProps {
  players: Player[];
  canAwardPoints: boolean;
  playersAwardPointsTitle: string;
  getPointsText: (score: number) => string;
  showClueToAwardPointsText: string;
  awardPointsButtonAriaLabel: (playerName: string) => string;
  removePointsButtonAriaLabel: (playerName: string) => string;
  removePointsButtonTitle: string;
  onAwardPoints: (playerId: string) => void;
  onOpenRemovePoints: (player: Player) => void;
}

export function GamePlayPlayerScoreboard({
  players,
  canAwardPoints,
  playersAwardPointsTitle,
  getPointsText,
  showClueToAwardPointsText,
  awardPointsButtonAriaLabel,
  removePointsButtonAriaLabel,
  removePointsButtonTitle,
  onAwardPoints,
  onOpenRemovePoints,
}: GamePlayPlayerScoreboardProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h4 className="text-lg font-semibold text-center">{playersAwardPointsTitle}</h4>
        <div className="grid gap-2">
          {players.map((player) => (
            <div key={player.id} className="flex gap-2 items-center">
              <Button
                onClick={() => onAwardPoints(player.id)}
                disabled={!canAwardPoints}
                variant="outline"
                className="flex-1 h-auto py-4 flex justify-between items-center shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] transition-all duration-150 border-2"
                data-testid={`award-points-${player.id}`}
                aria-label={awardPointsButtonAriaLabel(player.name)}
              >
                <span className="font-medium text-base">{player.name}</span>
                <span className="text-lg font-bold">{getPointsText(player.score)}</span>
              </Button>
              <Button
                onClick={() => onOpenRemovePoints(player)}
                disabled={player.score === 0}
                variant="ghost"
                size="icon"
                className="h-auto py-4 px-3"
                aria-label={removePointsButtonAriaLabel(player.name)}
                title={removePointsButtonTitle}
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
        {!canAwardPoints && (
          <p className="text-sm text-center text-muted-foreground">{showClueToAwardPointsText}</p>
        )}
      </CardContent>
    </Card>
  );
}
