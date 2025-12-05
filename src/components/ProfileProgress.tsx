import { Progress } from '@/components/ui/progress';
import { useTranslate } from './TranslateProvider';

export interface ProfileProgressProps {
  currentProfileIndex: number;
  totalProfiles: number;
}

export function ProfileProgress({ currentProfileIndex, totalProfiles }: ProfileProgressProps) {
  const { t } = useTranslate();

  // Calculate progress percentage
  const progressPercentage = (currentProfileIndex / totalProfiles) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {t('gamePlay.profileProgress.label', {
            current: currentProfileIndex,
            total: totalProfiles,
          })}
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</p>
      </div>
      <Progress
        value={progressPercentage}
        aria-label={t('gamePlay.profileProgress.ariaLabel', {
          current: currentProfileIndex,
          total: totalProfiles,
        })}
      />
    </div>
  );
}
