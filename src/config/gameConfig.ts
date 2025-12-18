/**
 * Central Game Configuration
 *
 * This module contains all game-related constants and configuration values.
 * Using `as const` for type safety and to avoid duplication.
 */

export const GAME_CONFIG = {
  // Game Limits and Constraints
  game: {
    maxPlayers: 16,
    minPlayers: 2,
    maxCluesPerProfile: 20,
    defaultMaxProfiles: 50,
  },

  // Debounce Values (in milliseconds)
  debounce: {
    stateSave: 300,
    headerAutoHide: 150,
  },

  // Animation Durations (in seconds for Framer Motion)
  animation: {
    fast: 0.2, // 200ms - Profile progress bar, fast transitions
    normal: 0.3, // 300ms - Clue progress, clue section, player cards
    medium: 0.4, // 400ms - Round summary, score numbers
    slow: 0.5, // 500ms - Delayed round text
    counterNumber: 0.6, // 600ms - Number counter animation
  },

  // Tailwind CSS Duration Classes (in milliseconds)
  tailwindDuration: {
    fast: 150, // duration-150
    normal: 200, // duration-200
    medium: 300, // duration-300
    slow: 500, // duration-500
  },

  // Query and Cache Configuration (in milliseconds)
  cache: {
    staleTime: 10 * 60 * 1000, // 10 minutes - Query data freshness
    gcTime: 60 * 60 * 1000, // 60 minutes - Query garbage collection
  },

  // Cache Headers (in seconds)
  cacheHeaders: {
    profileDataStaleTime: 6 * 60 * 60, // 6 hours - Profile data cache
    profileDataGcTime: 24 * 60 * 60, // 24 hours - Profile data GC
    manifestStaleTime: 6 * 60 * 60, // 6 hours - Manifest cache
    manifestGcTime: 24 * 60 * 60, // 24 hours - Manifest GC
    immutableAssets: 365 * 24 * 60 * 60, // 1 year - Immutable assets
    mediaFiles: 30 * 24 * 60 * 60, // 30 days - Media files
  },

  // Stagger Patterns (in seconds)
  stagger: {
    itemDelay: 0.05, // 50ms per item - Used in ClueProgress and GamePlayPlayerScoreboard
  },

  // Special Effects and UI
  effects: {
    celebrationTimeout: 5000, // 5 seconds - Celebration confetti timeout
    confettiPieceCount: 50, // Number of confetti pieces
  },

  // UI Measurements and Thresholds
  ui: {
    touchTargetSize: 48, // pixels - WCAG AAA minimum touch target
    headerScrollThreshold: 50, // pixels - Scroll distance before hiding header
  },

  // Query Configuration
  query: {
    retryAttempts: 2,
    maxBackoffCap: 30000, // 30 seconds - Maximum exponential backoff cap
  },
} as const;

// Export types for convenience
export type GameConfig = typeof GAME_CONFIG;
