import { useEffect, useRef, useState } from 'react';

interface CelebrationAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

let styleInjected = false;

function injectConfettiStyles() {
  if (styleInjected) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fall-confetti {
      to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

export function CelebrationAnimation({ trigger, onComplete }: CelebrationAnimationProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Update the ref whenever onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Inject styles only once on mount
  useEffect(() => {
    injectConfettiStyles();
  }, []);

  useEffect(() => {
    if (!trigger || prefersReducedMotion) {
      return;
    }

    const container = document.getElementById('celebration-container');
    if (!container) return;

    const confetti = createConfetti();
    container.appendChild(confetti);

    const timer = setTimeout(() => {
      confetti.remove();
      // Use the ref to avoid re-running this effect
      onCompleteRef.current?.();
    }, 3000);

    return () => clearTimeout(timer);
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

function createConfetti() {
  const container = document.createElement('div');
  container.className = 'fixed inset-0 pointer-events-none';

  const confettiPieces = 50;
  for (let i = 0; i < confettiPieces; i++) {
    const piece = document.createElement('div');
    const size = Math.random() * 10 + 5;
    const duration = Math.random() * 2 + 1.5;
    const xPos = Math.random() * 100;
    const rotation = Math.random() * 360;
    const colors = ['#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#92400E'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    piece.style.cssText = `
      position: fixed;
      left: ${xPos}%;
      top: -10px;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 2px;
      pointer-events: none;
      animation: fall-confetti ${duration}s linear forwards;
      transform: rotate(${rotation}deg);
    `;

    container.appendChild(piece);
  }

  return container;
}
