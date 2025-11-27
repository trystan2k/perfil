import { ProfileProgress } from '@/components/ProfileProgress';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GamePlayHeaderProps {
  title: string;
  numberOfRounds: number;
  roundInfoText: string;
  categoryText: string;
  currentProfileIndex: number;
  totalProfiles: number;
  profileProgressionText: string;
}

export function GamePlayHeader({
  title,
  numberOfRounds,
  roundInfoText,
  categoryText,
  currentProfileIndex,
  totalProfiles,
  profileProgressionText,
}: GamePlayHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3" className="text-2xl">
          {title}
        </CardTitle>
        <CardDescription>
          {numberOfRounds > 1 && <>{roundInfoText} - </>}
          {categoryText} - {profileProgressionText}
        </CardDescription>

        {/* Profile Progress Indicator */}
        <div className="pt-4">
          <ProfileProgress
            currentProfileIndex={currentProfileIndex}
            totalProfiles={totalProfiles}
          />
        </div>
      </CardHeader>
    </Card>
  );
}
