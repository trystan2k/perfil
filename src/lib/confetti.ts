/**
 * Confetti utilities for creating animated confetti pieces
 */

import { GAME_CONFIG } from '@/config/gameConfig';

interface ConfettiConfig {
  count?: number;
  colors?: string[];
}

interface ConfettiPieceConfig {
  size: number;
  duration: number;
  xPos: number;
  rotation: number;
  color: string;
}

const DEFAULT_COLORS = ['#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#92400E'];

/**
 * Generates a random confetti piece configuration
 */
export function generateConfettiPieceConfig(
  colors: string[] = DEFAULT_COLORS
): ConfettiPieceConfig {
  return {
    size: Math.random() * 10 + 5,
    duration: Math.random() * 2 + 1.5,
    xPos: Math.random() * 100,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

/**
 * Creates a single confetti piece element with CSS custom properties
 */
export function createConfettiPieceElement(config: ConfettiPieceConfig): HTMLDivElement {
  const piece = document.createElement('div');
  piece.className = 'confetti-piece';

  // Use CSS custom properties for dynamic values
  piece.style.setProperty('--confetti-size', `${config.size}px`);
  piece.style.setProperty('--confetti-x', `${config.xPos}%`);
  piece.style.setProperty('--confetti-duration', `${config.duration}s`);
  piece.style.setProperty('--confetti-rotation', `${config.rotation}deg`);
  piece.style.setProperty('--confetti-color', config.color);

  return piece;
}

/**
 * Creates a container with multiple confetti pieces
 */
export function createConfettiContainer(config: ConfettiConfig = {}): HTMLDivElement {
  const { count = GAME_CONFIG.effects.confettiPieceCount, colors = DEFAULT_COLORS } = config;

  const container = document.createElement('div');
  container.className = 'fixed inset-0 pointer-events-none';

  for (let i = 0; i < count; i++) {
    const pieceConfig = generateConfettiPieceConfig(colors);
    const piece = createConfettiPieceElement(pieceConfig);
    container.appendChild(piece);
  }

  return container;
}
