import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '@/config/gameConfig';
import {
  advanceClue,
  canAdvanceClue,
  createTurn,
  getCurrentClueIndex,
  hasReadAllClues,
  hasReadClues,
  revealTurn,
  validateTurn,
} from '../Turn.ts';
import type { Turn } from '../Turn.ts';

describe('Turn Entity', () => {
  const createMockTurn = (overrides?: Partial<Turn>): Turn => ({
    profileId: 'profile-1',
    cluesRead: 0,
    revealed: false,
    ...overrides,
  });

  describe('createTurn', () => {
    it('should create a turn with valid profile ID', () => {
      const turn = createTurn('profile-1');

      expect(turn.profileId).toBe('profile-1');
      expect(turn.cluesRead).toBe(0);
      expect(turn.revealed).toBe(false);
    });

    it('should initialize with zero clues read', () => {
      const turn = createTurn('profile-123');

      expect(turn.cluesRead).toBe(0);
      expect(hasReadClues(turn)).toBe(false);
    });

    it('should initialize with not revealed', () => {
      const turn = createTurn('profile-456');

      expect(turn.revealed).toBe(false);
    });

    it('should throw for empty profile ID', () => {
      expect(() => createTurn('')).toThrow();
    });

    it('should throw for null profile ID', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid types
      expect(() => createTurn(null as any)).toThrow();
    });

    it('should create turns for different profiles', () => {
      const turn1 = createTurn('profile-1');
      const turn2 = createTurn('profile-2');

      expect(turn1.profileId).not.toBe(turn2.profileId);
      expect(turn1).not.toBe(turn2);
    });

    it('should create independent turn instances', () => {
      const turn1 = createTurn('profile-1');
      const turn2 = createTurn('profile-1');

      expect(turn1).not.toBe(turn2);
      expect(turn1.profileId).toBe(turn2.profileId);
    });
  });

  describe('advanceClue', () => {
    it('should increment clues read from 0 to 1', () => {
      const turn = createTurn('profile-1');

      const advanced = advanceClue(turn);

      expect(advanced.cluesRead).toBe(1);
    });

    it('should increment clues read multiple times', () => {
      let turn = createTurn('profile-1');

      for (let i = 1; i <= 5; i++) {
        turn = advanceClue(turn);
        expect(turn.cluesRead).toBe(i);
      }
    });

    it('should advance to maximum clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      expect(turn.cluesRead).toBe(GAME_CONFIG.game.maxCluesPerProfile);
    });

    it('should throw when already at maximum clues', () => {
      const turn = createMockTurn({ cluesRead: GAME_CONFIG.game.maxCluesPerProfile });

      expect(() => advanceClue(turn)).toThrow('Maximum clues reached');
    });

    it('should throw when exceeding maximum clues', () => {
      let turn = createMockTurn({ cluesRead: GAME_CONFIG.game.maxCluesPerProfile - 1 });

      turn = advanceClue(turn);
      expect(() => advanceClue(turn)).toThrow('Maximum clues reached');
    });

    it('should not modify original turn', () => {
      const turn = createTurn('profile-1');
      const originalCluesRead = turn.cluesRead;

      advanceClue(turn);

      expect(turn.cluesRead).toBe(originalCluesRead);
    });

    it('should return new turn instance', () => {
      const turn = createTurn('profile-1');

      const advanced = advanceClue(turn);

      expect(turn).not.toBe(advanced);
    });

    it('should maintain profile ID', () => {
      const turn = createTurn('profile-123');

      const advanced = advanceClue(turn);

      expect(advanced.profileId).toBe(turn.profileId);
    });

    it('should maintain revealed status', () => {
      const turn = createMockTurn({ revealed: true });

      const advanced = advanceClue(turn);

      expect(advanced.revealed).toBe(true);
    });
  });

  describe('revealTurn', () => {
    it('should mark turn as revealed', () => {
      const turn = createTurn('profile-1');

      const revealed = revealTurn(turn);

      expect(revealed.revealed).toBe(true);
    });

    it('should reveal turn with clues read', () => {
      let turn = createTurn('profile-1');
      turn = advanceClue(turn);
      turn = advanceClue(turn);

      const revealed = revealTurn(turn);

      expect(revealed.revealed).toBe(true);
      expect(revealed.cluesRead).toBe(2);
    });

    it('should reveal turn at maximum clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      const revealed = revealTurn(turn);

      expect(revealed.revealed).toBe(true);
      expect(revealed.cluesRead).toBe(GAME_CONFIG.game.maxCluesPerProfile);
    });

    it('should not modify original turn', () => {
      const turn = createTurn('profile-1');
      const originalRevealed = turn.revealed;

      revealTurn(turn);

      expect(turn.revealed).toBe(originalRevealed);
    });

    it('should return new turn instance', () => {
      const turn = createTurn('profile-1');

      const revealed = revealTurn(turn);

      expect(turn).not.toBe(revealed);
    });

    it('should maintain profile ID', () => {
      const turn = createTurn('profile-abc-123');

      const revealed = revealTurn(turn);

      expect(revealed.profileId).toBe('profile-abc-123');
    });

    it('should maintain clues read', () => {
      let turn = createTurn('profile-1');
      turn = advanceClue(turn);
      turn = advanceClue(turn);
      const originalCluesRead = turn.cluesRead;

      const revealed = revealTurn(turn);

      expect(revealed.cluesRead).toBe(originalCluesRead);
    });

    it('should reveal already revealed turn', () => {
      const turn = createMockTurn({ revealed: true });

      const revealed = revealTurn(turn);

      expect(revealed.revealed).toBe(true);
    });
  });

  describe('hasReadClues', () => {
    it('should return false for new turn', () => {
      const turn = createTurn('profile-1');

      expect(hasReadClues(turn)).toBe(false);
    });

    it('should return true after reading one clue', () => {
      let turn = createTurn('profile-1');
      turn = advanceClue(turn);

      expect(hasReadClues(turn)).toBe(true);
    });

    it('should return true with multiple clues read', () => {
      let turn = createTurn('profile-1');
      turn = advanceClue(turn);
      turn = advanceClue(turn);

      expect(hasReadClues(turn)).toBe(true);
    });

    it('should return true at maximum clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      expect(hasReadClues(turn)).toBe(true);
    });

    it('should not modify turn', () => {
      const turn = createTurn('profile-1');
      const originalCluesRead = turn.cluesRead;

      hasReadClues(turn);

      expect(turn.cluesRead).toBe(originalCluesRead);
    });
  });

  describe('hasReadAllClues', () => {
    it('should return false for new turn', () => {
      const turn = createTurn('profile-1');

      expect(hasReadAllClues(turn)).toBe(false);
    });

    it('should return false with partial clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile - 1; i++) {
        turn = advanceClue(turn);
      }

      expect(hasReadAllClues(turn)).toBe(false);
    });

    it('should return true when all clues read', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      expect(hasReadAllClues(turn)).toBe(true);
    });

    it('should not modify turn', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      const originalCluesRead = turn.cluesRead;
      hasReadAllClues(turn);

      expect(turn.cluesRead).toBe(originalCluesRead);
    });
  });

  describe('canAdvanceClue', () => {
    it('should return true for new turn', () => {
      const turn = createTurn('profile-1');

      expect(canAdvanceClue(turn)).toBe(true);
    });

    it('should return true with partial clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile - 1; i++) {
        turn = advanceClue(turn);
      }

      expect(canAdvanceClue(turn)).toBe(true);
    });

    it('should return false at maximum clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      expect(canAdvanceClue(turn)).toBe(false);
    });

    it('should return false when all clues read', () => {
      const turn = createMockTurn({ cluesRead: GAME_CONFIG.game.maxCluesPerProfile });

      expect(canAdvanceClue(turn)).toBe(false);
    });

    it('should not modify turn', () => {
      const turn = createTurn('profile-1');
      const originalCluesRead = turn.cluesRead;

      canAdvanceClue(turn);

      expect(turn.cluesRead).toBe(originalCluesRead);
    });

    it('should sync with advanceClue behavior', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        expect(canAdvanceClue(turn)).toBe(true);
        turn = advanceClue(turn);
      }

      expect(canAdvanceClue(turn)).toBe(false);
      expect(() => advanceClue(turn)).toThrow();
    });
  });

  describe('getCurrentClueIndex', () => {
    it('should return -1 for new turn', () => {
      const turn = createTurn('profile-1');

      expect(getCurrentClueIndex(turn)).toBe(-1);
    });

    it('should return 0 after reading first clue', () => {
      let turn = createTurn('profile-1');
      turn = advanceClue(turn);

      expect(getCurrentClueIndex(turn)).toBe(0);
    });

    it('should return correct index after reading multiple clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < 5; i++) {
        turn = advanceClue(turn);
        expect(getCurrentClueIndex(turn)).toBe(i);
      }
    });

    it('should return last valid index at maximum clues', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      expect(getCurrentClueIndex(turn)).toBe(GAME_CONFIG.game.maxCluesPerProfile - 1);
    });

    it('should return index equal to clues read minus 1', () => {
      let turn = createTurn('profile-1');

      for (let i = 1; i <= 10; i++) {
        turn = advanceClue(turn);
        expect(getCurrentClueIndex(turn)).toBe(turn.cluesRead - 1);
      }
    });

    it('should not modify turn', () => {
      let turn = createTurn('profile-1');
      turn = advanceClue(turn);
      const originalCluesRead = turn.cluesRead;

      getCurrentClueIndex(turn);

      expect(turn.cluesRead).toBe(originalCluesRead);
    });
  });

  describe('validateTurn', () => {
    it('should validate correct turn', () => {
      const turn = createTurn('profile-1');

      expect(validateTurn(turn)).toBe(true);
    });

    it('should validate turn with clues read', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < 5; i++) {
        turn = advanceClue(turn);
      }

      expect(validateTurn(turn)).toBe(true);
    });

    it('should validate turn with all clues read', () => {
      let turn = createTurn('profile-1');

      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }

      expect(validateTurn(turn)).toBe(true);
    });

    it('should validate revealed turn', () => {
      let turn = createTurn('profile-1');
      turn = revealTurn(turn);

      expect(validateTurn(turn)).toBe(true);
    });

    it('should return false for turn with negative clues read', () => {
      const turn = createMockTurn({ cluesRead: -1 });

      expect(validateTurn(turn)).toBe(false);
    });

    it('should return false for turn with clues exceeding maximum', () => {
      const turn = createMockTurn({ cluesRead: GAME_CONFIG.game.maxCluesPerProfile + 1 });

      expect(validateTurn(turn)).toBe(false);
    });

    it('should return false for turn with empty profile ID', () => {
      const turn = createMockTurn({ profileId: '' });

      expect(validateTurn(turn)).toBe(false);
    });

    it('should return false for turn with missing fields', () => {
      const incompleteTurn = {
        profileId: 'profile-1',
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing validation with incomplete data
      expect(validateTurn(incompleteTurn as any)).toBe(false);
    });

    it('should accept turn with exact maximum clues', () => {
      const turn = createMockTurn({ cluesRead: GAME_CONFIG.game.maxCluesPerProfile });

      expect(validateTurn(turn)).toBe(true);
    });

    it('should accept turn with zero clues read', () => {
      const turn = createMockTurn({ cluesRead: 0 });

      expect(validateTurn(turn)).toBe(true);
    });
  });

  describe('Turn Immutability', () => {
    it('turn operations return new instances', () => {
      const turn1 = createTurn('profile-1');
      const turn2 = advanceClue(turn1);
      const turn3 = revealTurn(turn2);

      expect(turn1).not.toBe(turn2);
      expect(turn2).not.toBe(turn3);
      expect(turn1).not.toBe(turn3);
    });

    it('original turn is not modified by operations', () => {
      const turn = createTurn('profile-1');

      advanceClue(turn);
      advanceClue(turn);
      revealTurn(turn);

      expect(turn.cluesRead).toBe(0);
      expect(turn.revealed).toBe(false);
    });
  });

  describe('Turn State Transitions', () => {
    it('should follow proper clue progression', () => {
      let turn = createTurn('profile-1');

      // Initial state
      expect(hasReadClues(turn)).toBe(false);
      expect(hasReadAllClues(turn)).toBe(false);
      expect(getCurrentClueIndex(turn)).toBe(-1);

      // First clue
      turn = advanceClue(turn);
      expect(hasReadClues(turn)).toBe(true);
      expect(hasReadAllClues(turn)).toBe(false);
      expect(getCurrentClueIndex(turn)).toBe(0);

      // Middle clue
      for (let i = 1; i < GAME_CONFIG.game.maxCluesPerProfile - 1; i++) {
        turn = advanceClue(turn);
      }
      expect(hasReadClues(turn)).toBe(true);
      expect(hasReadAllClues(turn)).toBe(false);

      // Last clue
      turn = advanceClue(turn);
      expect(hasReadClues(turn)).toBe(true);
      expect(hasReadAllClues(turn)).toBe(true);
      expect(getCurrentClueIndex(turn)).toBe(GAME_CONFIG.game.maxCluesPerProfile - 1);

      // Cannot advance further
      expect(canAdvanceClue(turn)).toBe(false);
    });

    it('should handle reveal at any point', () => {
      let turn = createTurn('profile-1');

      // Reveal before any clues
      let revealed = revealTurn(turn);
      expect(revealed.revealed).toBe(true);
      expect(revealed.cluesRead).toBe(0);

      // Reveal after some clues
      turn = createTurn('profile-1');
      turn = advanceClue(turn);
      turn = advanceClue(turn);
      revealed = revealTurn(turn);
      expect(revealed.revealed).toBe(true);
      expect(revealed.cluesRead).toBe(2);

      // Reveal after all clues
      turn = createTurn('profile-1');
      for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
        turn = advanceClue(turn);
      }
      revealed = revealTurn(turn);
      expect(revealed.revealed).toBe(true);
      expect(revealed.cluesRead).toBe(GAME_CONFIG.game.maxCluesPerProfile);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete turn flow', () => {
      let turn = createTurn('profile-1');

      // Read clues progressively
      while (canAdvanceClue(turn)) {
        expect(validateTurn(turn)).toBe(true);
        turn = advanceClue(turn);
      }

      expect(hasReadAllClues(turn)).toBe(true);
      expect(getCurrentClueIndex(turn)).toBe(GAME_CONFIG.game.maxCluesPerProfile - 1);

      // Reveal answer
      turn = revealTurn(turn);
      expect(turn.revealed).toBe(true);

      expect(validateTurn(turn)).toBe(true);
    });

    it('should handle turn workflow with state queries', () => {
      let turn = createTurn('profile-1');

      // Initial state queries
      expect(hasReadClues(turn)).toBe(false);
      expect(hasReadAllClues(turn)).toBe(false);
      expect(canAdvanceClue(turn)).toBe(true);
      expect(getCurrentClueIndex(turn)).toBe(-1);

      // Progress through some clues
      for (let i = 0; i < 5; i++) {
        turn = advanceClue(turn);
        expect(hasReadClues(turn)).toBe(true);
        expect(hasReadAllClues(turn)).toBe(false);
        expect(canAdvanceClue(turn)).toBe(true);
      }

      // Advance to end
      while (canAdvanceClue(turn)) {
        turn = advanceClue(turn);
      }

      expect(hasReadAllClues(turn)).toBe(true);
      expect(canAdvanceClue(turn)).toBe(false);

      // Reveal
      turn = revealTurn(turn);
      expect(turn.revealed).toBe(true);

      // All validations pass
      expect(validateTurn(turn)).toBe(true);
    });
  });
});
