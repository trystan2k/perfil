import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createConfettiContainer } from '@/lib/confetti';

interface CelebrationAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function CelebrationAnimation({ trigger, onComplete }: CelebrationAnimationProps) {
  const prefersReducedMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);

  // Update the ref whenever onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!trigger || prefersReducedMotion) {
      return;
    }

    const container = document.getElementById('celebration-container');
    if (!container) return;

    const confetti = createConfettiContainer();
    container.appendChild(confetti);

    const timer = setTimeout(() => {
      // Safely remove confetti if it still exists in DOM
      if (confetti.parentNode === container) {
        confetti.remove();
      }
      // Use the ref to avoid re-running this effect
      onCompleteRef.current?.();
    }, 3000);

    return () => {
      clearTimeout(timer);
      // Clean up confetti if component unmounts before timeout completes
      if (confetti.parentNode === container) {
        confetti.remove();
      }
    };
  }, [trigger, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      id="celebration-container"
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
