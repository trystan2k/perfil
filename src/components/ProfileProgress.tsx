import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { GAME_CONFIG } from '@/config/gameConfig';
import { useReducedMotionContext } from './ReducedMotionProvider';
import { useTranslate } from './TranslateProvider';

export interface ProfileProgressProps {
  currentProfileIndex: number;
  totalProfiles: number;
}

export function ProfileProgress({ currentProfileIndex, totalProfiles }: ProfileProgressProps) {
  const { t } = useTranslate();
  const { prefersReducedMotion } = useReducedMotionContext();
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const displayPercentageRef = useRef(0);

  // Calculate progress percentage
  const progressPercentage = (currentProfileIndex / totalProfiles) * 100;

  // Animate the percentage counter
  useEffect(() => {
    if (prefersReducedMotion) {
      displayPercentageRef.current = Math.round(progressPercentage);
      setDisplayPercentage(displayPercentageRef.current);
      return;
    }

    let animationFrame: number;
    const startValue = displayPercentageRef.current;
    const endValue = Math.round(progressPercentage);
    const duration = GAME_CONFIG.animation.counterNumber * 1000; // Convert to ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOut
      const easeProgress = 1 - (1 - progress) ** 3;
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

      displayPercentageRef.current = currentValue;
      setDisplayPercentage(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [progressPercentage, prefersReducedMotion]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {t('gamePlay.profileProgress.label', {
            current: currentProfileIndex,
            total: totalProfiles,
          })}
        </p>
        <motion.p
          className="text-sm text-muted-foreground"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: GAME_CONFIG.animation.fast, ease: 'easeOut' }
          }
        >
          {displayPercentage}%
        </motion.p>
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
