import '@testing-library/jest-dom/vitest';
import { afterAll, beforeAll, vi } from 'vitest';

// Suppress Radix UI accessibility warnings in tests
// These warnings are about missing Description elements, but our components
// properly implement aria-describedby for accessibility
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Missing `Description`') || message.includes('aria-describedby')) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Missing `Description`') || message.includes('aria-describedby')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Translation mappings for tests
const translations: Record<string, string> = {
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.notFound': 'Not Found',
  'common.retry': 'Retry',
  'common.category': 'Category',
  'common.pts': 'pts',
  'gameSetup.title': 'Game Setup',
  'gameSetup.description': 'Add players to start a new game. You need at least 2 players.',
  'gameSetup.playerNameLabel': 'Player Name',
  'gameSetup.playerNamePlaceholder': 'Enter player name',
  'gameSetup.addButton': 'Add',
  'gameSetup.playersLabel': 'Players ({{count}}/{{max}})',
  'gameSetup.startButton': 'Start Game',
  'gameSetup.errors.duplicateName': 'Player name already exists',
  'gameSetup.removePlayerAriaLabel': 'Remove {{name}}',
  'gamePlay.title': 'Game Play',
  'gamePlay.loading.title': 'Loading Game',
  'gamePlay.loading.description': 'Loading game session...',
  'gamePlay.error.title': 'Error',
  'gamePlay.noActiveGame.title': 'No Active Game',
  'gamePlay.noActiveGame.description': 'Please start a game first.',
  'gamePlay.currentPlayer': 'Current Player',
  'gamePlay.unknownPlayer': 'Unknown Player',
  'gamePlay.clueCount': 'Clue {{current}} of {{total}}',
  'gamePlay.pressShowNextClue': 'Press "Show Next Clue" to reveal the first clue',
  'gamePlay.showNextClueButton': 'Show Next Clue',
  'gamePlay.passButton': 'Pass',
  'gamePlay.skipProfileButton': 'Skip Profile',
  'gamePlay.skipProfileConfirmTitle': 'Skip Profile?',
  'gamePlay.skipProfileConfirmMessage': 'Are you sure you want to skip this profile? No points will be awarded.',
  'gamePlay.playersAwardPoints': 'Award Points',
  'gamePlay.points': '{{points}} pts',
  'gamePlay.showClueToAwardPoints': 'Show at least one clue to award points',
  'gamePlay.finishGameButton': 'Finish Game',
  'gamePlay.category': 'Category: {{category}}',
  'gamePlay.errors.sessionNotFound': 'Game session not found. Please start a new game.',
  'gamePlay.errors.loadFailed': 'Failed to load game session. Please try again.',
  'gamePlay.profileProgress.label': 'Profile {{current}} of {{total}}',
  'gamePlay.profileProgress.ariaLabel': 'Profile progress: {{current}} of {{total}}',
  'gamePlay.clueProgress.pointsRemaining_one': '{{count}} point remaining',
  'gamePlay.clueProgress.pointsRemaining_other': '{{count}} points remaining',
  'gamePlay.clueProgress.ariaLabel': 'Clue progress: {{revealed}} of {{total}} clues revealed',
  'gamePlay.roundSummary.title': 'Round Complete!',
  'gamePlay.roundSummary.playerScored_one': '{{playerName}} scored {{count}} point!',
  'gamePlay.roundSummary.playerScored_other': '{{playerName}} scored {{count}} points!',
  'gamePlay.roundSummary.noOneScored': 'No one scored this round',
  'gamePlay.roundSummary.profileName': 'Profile: {{name}}',
  'gamePlay.roundSummary.nextProfileButton': 'Next Profile',
  'scoreboard.title': 'Scoreboard',
  'scoreboard.loading': 'Loading scoreboard...',
  'scoreboard.category': 'Category: {{category}}',
  'scoreboard.noPlayers.title': 'No Players',
  'scoreboard.noPlayers.description': 'No players found in this game session.',
  'scoreboard.table.rank': 'Rank',
  'scoreboard.table.player': 'Player',
  'scoreboard.table.score': 'Score',
  'scoreboard.errors.noSessionId': 'No session ID provided',
  'scoreboard.errors.sessionNotFound': 'Game session not found',
  'scoreboard.errors.unknown': 'An unknown error occurred',
  'categorySelect.title': 'Select Category',
  'categorySelect.description': 'Choose a category to start the game, or shuffle all profiles for a mixed experience.',
  'categorySelect.loading.title': 'Loading Categories',
  'categorySelect.loading.description': 'Loading available categories...',
  'categorySelect.error.title': 'Error',
  'categorySelect.error.description': 'Failed to load categories. Please try again.',
  'categorySelect.orLabel': 'or',
  'categorySelect.shuffleAllButton': 'Shuffle All',
};

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      let translation: string;
      
      // Handle pluralization
      if (params && 'count' in params) {
        const count = params.count as number;
        const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
        translation = translations[pluralKey] || translations[key] || key;
      } else {
        translation = translations[key] || key;
      }
      
      // Handle interpolation for dynamic values in translation strings
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
        });
      }
      
      return translation;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));
