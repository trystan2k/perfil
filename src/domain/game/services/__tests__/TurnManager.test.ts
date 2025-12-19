import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '@/config/gameConfig';
import { createTurn, advanceClue as advanceClueInTurn } from '@/domain/game/entities/Turn';
import type { Profile } from '@/types/models';
import {
  advanceToNextClue,
  getCurrentClue,
  getRevealedClues,
  getRevealedClueIndices,
  isFirstClue,
  isLastClue,
} from '../TurnManager.ts';

describe('TurnManager', () => {
  // Helper to create mock profile
  const createMockProfile = (id: string = 'profile-1', clueCount: number = 5): Profile => ({
    id,
    name: `Test Profile ${id}`,
    category: 'Test',
    clues: Array.from({ length: clueCount }, (_, i) => `Clue ${i + 1}`),
    metadata: undefined,
  });

  describe('advanceToNextClue()', () => {
    describe('happy path - normal advancement', () => {
      it('should advance from initial state to first clue', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');
        expect(turn.cluesRead).toBe(0);

        const result = advanceToNextClue(turn, profile);

        expect(result.turn.cluesRead).toBe(1);
        expect(result.clueIndex).toBe(0);
        expect(result.clueText).toBe('Clue 1');
      });

      it('should advance from first to second clue', () => {
        const profile = createMockProfile();
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const result = advanceToNextClue(turn, profile);

        expect(result.turn.cluesRead).toBe(2);
        expect(result.clueIndex).toBe(1);
        expect(result.clueText).toBe('Clue 2');
      });

      it('should progress through all clues sequentially', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 1; i < 5; i++) {
          const result = advanceToNextClue(turn, profile);
          expect(result.clueIndex).toBe(i - 1);
          expect(result.clueText).toBe(`Clue ${i}`);
          turn = result.turn;
        }
      });

      it('should return updated turn with incremented cluesRead', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');

        const result = advanceToNextClue(turn, profile);

        expect(result.turn.cluesRead).toBe(turn.cluesRead + 1);
        expect(result.turn.profileId).toBe(turn.profileId);
        expect(result.turn.revealed).toBe(false);
      });
    });

    describe('edge cases - boundary conditions', () => {
      it('should advance to last clue', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        // Advance to 4th clue (index 3)
        for (let i = 0; i < 4; i++) {
          turn = advanceToNextClue(turn, profile).turn;
        }

        // Advance to 5th clue (last)
        const result = advanceToNextClue(turn, profile);
        expect(result.turn.cluesRead).toBe(5);
        expect(result.clueIndex).toBe(4);
        expect(result.clueText).toBe('Clue 5');
      });

      it('should work with profiles having different clue counts', () => {
        const profile10 = createMockProfile('p1', 10);
        const profile3 = createMockProfile('p2', 3);

        const turn10 = advanceToNextClue(createTurn('p1'), profile10);
        expect(turn10.clueText).toBe('Clue 1');
        expect(turn10.clueIndex).toBe(0);

        const turn3 = advanceToNextClue(createTurn('p2'), profile3);
        expect(turn3.clueText).toBe('Clue 1');
        expect(turn3.clueIndex).toBe(0);
      });

      it('should work with minimum clue count profile', () => {
        const profile = createMockProfile('profile-1', 1);
        const turn = createTurn('profile-1');

        const result = advanceToNextClue(turn, profile);
        expect(result.clueText).toBe('Clue 1');
        expect(result.clueIndex).toBe(0);
      });
    });

    describe('error conditions', () => {
      it('should throw error when advancing beyond maximum clues', () => {
        const profile = createMockProfile('profile-1', GAME_CONFIG.game.maxCluesPerProfile);
        let turn = createTurn('profile-1');

        // Advance to max (20 clues)
        for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
          turn = advanceClueInTurn(turn);
        }

        expect(() => advanceToNextClue(turn, profile)).toThrow();
      });

      it('should provide meaningful error when at max capacity', () => {
        const profile = createMockProfile('profile-1', GAME_CONFIG.game.maxCluesPerProfile);
        let turn = createTurn('profile-1');

        // Advance to max
        for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
          turn = advanceClueInTurn(turn);
        }

        expect(() => advanceToNextClue(turn, profile)).toThrow('Maximum clues reached');
      });
    });

    describe('return value structure', () => {
      it('should return object with turn, clueText, and clueIndex properties', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');

        const result = advanceToNextClue(turn, profile);

        expect(result).toHaveProperty('turn');
        expect(result).toHaveProperty('clueText');
        expect(result).toHaveProperty('clueIndex');
      });

      it('should not mutate original turn', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');
        const originalCluesRead = turn.cluesRead;

        advanceToNextClue(turn, profile);

        expect(turn.cluesRead).toBe(originalCluesRead);
      });

      it('should return new turn object', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');

        const result = advanceToNextClue(turn, profile);

        expect(result.turn).not.toBe(turn);
      });
    });
  });

  describe('getCurrentClue()', () => {
    describe('happy path - retrieving current clue', () => {
      it('should return null when no clues have been read', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');

        const clue = getCurrentClue(turn, profile);

        expect(clue).toBeNull();
      });

      it('should return first clue after reading one', () => {
        const profile = createMockProfile();
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const clue = getCurrentClue(turn, profile);

        expect(clue).toBe('Clue 1');
      });

      it('should return current clue at any position', () => {
        const profile = createMockProfile();
        let turn = createTurn('profile-1');

        for (let i = 0; i < 3; i++) {
          turn = advanceClueInTurn(turn);
          const clue = getCurrentClue(turn, profile);
          expect(clue).toBe(`Clue ${turn.cluesRead}`);
        }
      });

      it('should return the last clue when all clues read', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
        }

        const clue = getCurrentClue(turn, profile);
        expect(clue).toBe('Clue 5');
      });
    });

    describe('edge cases', () => {
      it('should return null for initial turn state', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');

        expect(getCurrentClue(turn, profile)).toBeNull();
      });

      it('should work with profiles having variable clue counts', () => {
        const profile = createMockProfile('profile-1', 10);
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const clue = getCurrentClue(turn, profile);
        expect(clue).toBe('Clue 1');
      });
    });

    describe('consistency with turn state', () => {
      it('should match clue at position indicated by cluesRead - 1', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 1; i <= 5; i++) {
          turn = advanceClueInTurn(turn);
          const clue = getCurrentClue(turn, profile);
          expect(clue).toBe(profile.clues[turn.cluesRead - 1]);
        }
      });
    });
  });

  describe('getRevealedClues()', () => {
    describe('happy path - retrieving revealed clues', () => {
      it('should return empty array when no clues have been read', () => {
        const profile = createMockProfile();
        const turn = createTurn('profile-1');

        const clues = getRevealedClues(turn, profile);

        expect(clues).toEqual([]);
        expect(clues).toHaveLength(0);
      });

      it('should return array with one clue when one has been read', () => {
        const profile = createMockProfile();
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const clues = getRevealedClues(turn, profile);

        expect(clues).toEqual(['Clue 1']);
        expect(clues).toHaveLength(1);
      });

      it('should return all revealed clues in reverse order (most recent first)', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 0; i < 3; i++) {
          turn = advanceClueInTurn(turn);
        }

        const clues = getRevealedClues(turn, profile);

        expect(clues).toEqual(['Clue 3', 'Clue 2', 'Clue 1']);
      });

      it('should maintain reverse order for all clues', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
        }

        const clues = getRevealedClues(turn, profile);

        expect(clues).toEqual(['Clue 5', 'Clue 4', 'Clue 3', 'Clue 2', 'Clue 1']);
      });

      it('should handle progressive reading of clues', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        // After 1st clue
        turn = advanceClueInTurn(turn);
        expect(getRevealedClues(turn, profile)).toEqual(['Clue 1']);

        // After 2nd clue
        turn = advanceClueInTurn(turn);
        expect(getRevealedClues(turn, profile)).toEqual(['Clue 2', 'Clue 1']);

        // After 3rd clue
        turn = advanceClueInTurn(turn);
        expect(getRevealedClues(turn, profile)).toEqual(['Clue 3', 'Clue 2', 'Clue 1']);
      });
    });

    describe('edge cases', () => {
      it('should work with profile having minimum clues', () => {
        const profile = createMockProfile('profile-1', 1);
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const clues = getRevealedClues(turn, profile);
        expect(clues).toEqual(['Clue 1']);
      });

      it('should work with profile having many clues', () => {
        const profile = createMockProfile('profile-1', 20);
        let turn = createTurn('profile-1');

        for (let i = 0; i < 10; i++) {
          turn = advanceClueInTurn(turn);
        }

        const clues = getRevealedClues(turn, profile);
        expect(clues).toHaveLength(10);
        expect(clues[0]).toBe('Clue 10');
        expect(clues[9]).toBe('Clue 1');
      });
    });

    describe('consistency with getCurrentClue', () => {
      it('should have current clue as first element when clues are revealed', () => {
        const profile = createMockProfile();
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const revealedClues = getRevealedClues(turn, profile);
        const currentClue = getCurrentClue(turn, profile);

        if (revealedClues.length > 0) {
          expect(revealedClues[0]).toBe(currentClue);
        }
      });
    });

    describe('immutability', () => {
      it('should return new array each time', () => {
        const profile = createMockProfile();
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const clues1 = getRevealedClues(turn, profile);
        const clues2 = getRevealedClues(turn, profile);

        expect(clues1).not.toBe(clues2);
        expect(clues1).toEqual(clues2);
      });
    });
  });

  describe('getRevealedClueIndices()', () => {
    describe('happy path - retrieving revealed clue indices', () => {
      it('should return empty array when no clues have been read', () => {
        const turn = createTurn('profile-1');

        const indices = getRevealedClueIndices(turn);

        expect(indices).toEqual([]);
      });

      it('should return [0] when one clue has been read', () => {
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const indices = getRevealedClueIndices(turn);

        expect(indices).toEqual([0]);
      });

      it('should return indices in descending order (most recent first)', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 3; i++) {
          turn = advanceClueInTurn(turn);
        }

        const indices = getRevealedClueIndices(turn);

        expect(indices).toEqual([2, 1, 0]);
      });

      it('should return all indices from 0 to current in descending order', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
        }

        const indices = getRevealedClueIndices(turn);

        expect(indices).toEqual([4, 3, 2, 1, 0]);
      });

      it('should track progression of indices', () => {
        let turn = createTurn('profile-1');

        // After 1st clue
        turn = advanceClueInTurn(turn);
        expect(getRevealedClueIndices(turn)).toEqual([0]);

        // After 2nd clue
        turn = advanceClueInTurn(turn);
        expect(getRevealedClueIndices(turn)).toEqual([1, 0]);

        // After 3rd clue
        turn = advanceClueInTurn(turn);
        expect(getRevealedClueIndices(turn)).toEqual([2, 1, 0]);
      });
    });

    describe('edge cases', () => {
      it('should handle single clue read', () => {
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const indices = getRevealedClueIndices(turn);
        expect(indices).toHaveLength(1);
        expect(indices[0]).toBe(0);
      });

      it('should handle many clues read', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 20; i++) {
          turn = advanceClueInTurn(turn);
        }

        const indices = getRevealedClueIndices(turn);
        expect(indices).toHaveLength(20);
        expect(indices[0]).toBe(19);
        expect(indices[19]).toBe(0);
      });
    });

    describe('consistency checks', () => {
      it('should have length equal to turn.cluesRead', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
          const indices = getRevealedClueIndices(turn);
          expect(indices).toHaveLength(turn.cluesRead);
        }
      });

      it('should have first element equal to turn.cluesRead - 1', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
          const indices = getRevealedClueIndices(turn);
          if (indices.length > 0) {
            expect(indices[0]).toBe(turn.cluesRead - 1);
          }
        }
      });

      it('should have indices in strictly descending order', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
        }

        const indices = getRevealedClueIndices(turn);

        for (let i = 0; i < indices.length - 1; i++) {
          expect(indices[i]).toBeGreaterThan(indices[i + 1]);
        }
      });
    });

    describe('immutability', () => {
      it('should return new array each time', () => {
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        const indices1 = getRevealedClueIndices(turn);
        const indices2 = getRevealedClueIndices(turn);

        expect(indices1).not.toBe(indices2);
        expect(indices1).toEqual(indices2);
      });
    });
  });

  describe('isFirstClue()', () => {
    describe('happy path', () => {
      it('should return true when exactly one clue has been read', () => {
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);

        expect(isFirstClue(turn)).toBe(true);
      });

      it('should return false when no clues have been read', () => {
        const turn = createTurn('profile-1');

        expect(isFirstClue(turn)).toBe(false);
      });

      it('should return false when multiple clues have been read', () => {
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);
        turn = advanceClueInTurn(turn);

        expect(isFirstClue(turn)).toBe(false);
      });

      it('should return false when all clues have been read', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
        }

        expect(isFirstClue(turn)).toBe(false);
      });
    });

    describe('consistency', () => {
      it('should only be true when cluesRead equals 1', () => {
        let turn = createTurn('profile-1');

        // Start: 0 clues
        expect(isFirstClue(turn)).toBe(false);

        // After 1st clue
        turn = advanceClueInTurn(turn);
        expect(isFirstClue(turn)).toBe(true);
        expect(turn.cluesRead).toBe(1);

        // After 2nd clue
        turn = advanceClueInTurn(turn);
        expect(isFirstClue(turn)).toBe(false);
        expect(turn.cluesRead).toBe(2);
      });
    });
  });

  describe('isLastClue()', () => {
    describe('happy path', () => {
      it('should return true when all clues have been read', () => {
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
        }

        expect(isLastClue(turn, 5)).toBe(true);
      });

      it('should return false when no clues have been read', () => {
        const turn = createTurn('profile-1');

        expect(isLastClue(turn, 5)).toBe(false);
      });

      it('should return false when clues remain to be read', () => {
        let turn = createTurn('profile-1');
        turn = advanceClueInTurn(turn);
        turn = advanceClueInTurn(turn);

        expect(isLastClue(turn, 5)).toBe(false);
      });

      it('should work with different totalClues values', () => {
        // Test with 3 total clues
        let turn = createTurn('profile-1');
        for (let i = 0; i < 3; i++) {
          turn = advanceClueInTurn(turn);
        }
        expect(isLastClue(turn, 3)).toBe(true);
        expect(isLastClue(turn, 5)).toBe(false);

        // Test with 10 total clues
        turn = createTurn('profile-1');
        for (let i = 0; i < 10; i++) {
          turn = advanceClueInTurn(turn);
        }
        expect(isLastClue(turn, 10)).toBe(true);
        expect(isLastClue(turn, 5)).toBe(false);
      });
    });

    describe('consistency', () => {
      it('should only be true when cluesRead equals totalClues', () => {
        let turn = createTurn('profile-1');

        // Progress through clues
        for (let i = 1; i <= 5; i++) {
          turn = advanceClueInTurn(turn);

          if (i === 5) {
            expect(isLastClue(turn, 5)).toBe(true);
          } else {
            expect(isLastClue(turn, 5)).toBe(false);
          }
        }
      });

      it('should respect the totalClues parameter', () => {
        let turn = createTurn('profile-1');
        for (let i = 0; i < 3; i++) {
          turn = advanceClueInTurn(turn);
        }

        // cluesRead = 3
        expect(isLastClue(turn, 3)).toBe(true);
        expect(isLastClue(turn, 5)).toBe(false);
        expect(isLastClue(turn, 2)).toBe(false);
      });
    });

    describe('boundary conditions', () => {
      it('should return true at exactly totalClues', () => {
        let turn = createTurn('profile-1');
        const total = 7;

        for (let i = 0; i < total; i++) {
          turn = advanceClueInTurn(turn);
        }

        expect(isLastClue(turn, total)).toBe(true);
      });

      it('should return false one clue before totalClues', () => {
        let turn = createTurn('profile-1');
        const total = 7;

        for (let i = 0; i < total - 1; i++) {
          turn = advanceClueInTurn(turn);
        }

        expect(isLastClue(turn, total)).toBe(false);
      });
    });
  });

  describe('cross-function consistency', () => {
    describe('integration between all TurnManager functions', () => {
      it('should maintain consistent state through progression', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        // Initial state
        expect(isFirstClue(turn)).toBe(false);
        expect(isLastClue(turn, 5)).toBe(false);
        expect(getCurrentClue(turn, profile)).toBeNull();
        expect(getRevealedClues(turn, profile)).toEqual([]);
        expect(getRevealedClueIndices(turn)).toEqual([]);

        // After first clue
        turn = advanceToNextClue(turn, profile).turn;
        expect(isFirstClue(turn)).toBe(true);
        expect(isLastClue(turn, 5)).toBe(false);
        expect(getCurrentClue(turn, profile)).toBe('Clue 1');
        expect(getRevealedClues(turn, profile)).toEqual(['Clue 1']);
        expect(getRevealedClueIndices(turn)).toEqual([0]);

        // Progress to middle
        turn = advanceToNextClue(turn, profile).turn;
        turn = advanceToNextClue(turn, profile).turn;
        expect(isFirstClue(turn)).toBe(false);
        expect(isLastClue(turn, 5)).toBe(false);
        expect(getCurrentClue(turn, profile)).toBe('Clue 3');
        expect(getRevealedClues(turn, profile)).toEqual(['Clue 3', 'Clue 2', 'Clue 1']);
        expect(getRevealedClueIndices(turn)).toEqual([2, 1, 0]);

        // Advance to last
        turn = advanceToNextClue(turn, profile).turn;
        turn = advanceToNextClue(turn, profile).turn;
        expect(isFirstClue(turn)).toBe(false);
        expect(isLastClue(turn, 5)).toBe(true);
        expect(getCurrentClue(turn, profile)).toBe('Clue 5');
        expect(getRevealedClues(turn, profile)).toEqual([
          'Clue 5',
          'Clue 4',
          'Clue 3',
          'Clue 2',
          'Clue 1',
        ]);
        expect(getRevealedClueIndices(turn)).toEqual([4, 3, 2, 1, 0]);
      });
    });

    describe('consistency between revealed clues and indices', () => {
      it('should have matching counts between getRevealedClues and getRevealedClueIndices', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 0; i < 5; i++) {
          turn = advanceClueInTurn(turn);
          const clues = getRevealedClues(turn, profile);
          const indices = getRevealedClueIndices(turn);
          expect(clues).toHaveLength(indices.length);
        }
      });

      it('should maintain correspondence between clues and their indices', () => {
        const profile = createMockProfile('profile-1', 5);
        let turn = createTurn('profile-1');

        for (let i = 0; i < 3; i++) {
          turn = advanceClueInTurn(turn);
        }

        const clues = getRevealedClues(turn, profile);
        const indices = getRevealedClueIndices(turn);

        for (let i = 0; i < clues.length; i++) {
          expect(clues[i]).toBe(profile.clues[indices[i]]);
        }
      });
    });
  });
});
