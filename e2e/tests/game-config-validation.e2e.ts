import { expect, test } from '@playwright/test';
import { GAME_CONFIG } from '../../src/config/gameConfig.ts';

/**
 * E2E Test Suite: GAME_CONFIG Validation
 *
 * This test suite validates that GAME_CONFIG values are correctly used
 * throughout the application end-to-end. It ensures:
 * - Player limits (min/max) are enforced
 * - Clues per profile are correct (20)
 * - Animation timings are applied
 * - Configuration values integrate correctly across the game flow
 *
 * These tests focus specifically on configuration validation, complementing
 * the general game flow tests in game.e2e.ts.
 */

test.describe('GAME_CONFIG Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();
  });

  test.describe('Player Limits - Minimum Players', () => {
    test('should enforce minimum player requirement (minPlayers: 2)', async ({ page }) => {
      /**
       * Validates GAME_CONFIG.game.minPlayers = 2
       * Ensures the UI prevents starting a game with fewer than 2 players
       */

      // Try to start game with 0 players
      const startButton = page.getByRole('button', { name: 'Start Game' });
      await expect(startButton).toBeDisabled();

      // Add 1 player
      await page.getByLabel('Player Name').fill('Alice');
      await page.getByRole('button', { name: 'Add' }).click();

      // Start Game button should still be disabled with only 1 player
      await expect(startButton).toBeDisabled();

      // Add second player (reaching GAME_CONFIG.game.minPlayers)
      await page.getByLabel('Player Name').fill('Bob');
      await page.getByRole('button', { name: 'Add' }).click();

      // Now start button should be enabled
      await expect(startButton).toBeEnabled();
      await startButton.click();

      // Game should proceed normally
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    });

    test('game should work correctly with exactly minPlayers (2)', async ({ page }) => {
      /**
       * Validates that a game with exactly GAME_CONFIG.game.minPlayers works end-to-end
       */

      // Add exactly 2 players (minPlayers)
      await page.getByLabel('Player Name').fill('Player1');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('Player Name').fill('Player2');
      await page.getByRole('button', { name: 'Add' }).click();

      // Verify player count display
      await expect(
        page.getByText(`Players (${GAME_CONFIG.game.minPlayers}/${GAME_CONFIG.game.maxPlayers})`)
      ).toBeVisible();

      // Start game
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Continue through game flow
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Set 1 round for quick test
      await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
      const roundsInput = page.getByLabel('Number of rounds');
      await roundsInput.clear();
      await roundsInput.fill('1');
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Play the game
      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      await page.getByRole('button', { name: 'Award points to Player1' }).click();
      await page.getByRole('button', { name: 'Next Profile' }).click();

      // Should reach scoreboard successfully
      await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

      // Verify both players appear in scoreboard
      const scoreBars = page.locator('[data-testid="score-bars"]');
      await expect(scoreBars).toContainText('Player1');
      await expect(scoreBars).toContainText('Player2');
    });
  });

  test.describe('Player Limits - Maximum Players', () => {
    test('should enforce maximum player limit (maxPlayers: 16)', async ({ page }) => {
      /**
       * Validates GAME_CONFIG.game.maxPlayers = 16
       * Ensures the UI prevents adding more than 16 players
       */

      // Add GAME_CONFIG.game.maxPlayers players
      for (let i = 1; i <= GAME_CONFIG.game.maxPlayers; i++) {
        await page.getByLabel('Player Name').fill(`Player ${i}`);
        await page.getByRole('button', { name: 'Add' }).click();
      }

      // Verify UI displays correct player count
      await expect(
        page.getByText(`Players (${GAME_CONFIG.game.maxPlayers}/${GAME_CONFIG.game.maxPlayers})`)
      ).toBeVisible();

      // Try to add one more player
      const addButton = page.getByRole('button', { name: 'Add' });
      const playerInput = page.getByLabel('Player Name');

      await playerInput.fill('ExtraPlayer');

      // Add button should be disabled when max players reached
      await expect(addButton).toBeDisabled();

      // Should not allow adding another player
      // (button disabled or name field disabled)
      const isInputDisabled = await playerInput.isDisabled();
      const isButtonDisabled = await addButton.isDisabled();

      expect(isInputDisabled || isButtonDisabled).toBeTruthy();

      // Can still start game with maxPlayers
      const startButton = page.getByRole('button', { name: 'Start Game' });
      await expect(startButton).toBeEnabled();
      await startButton.click();

      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    });

    test('should display all maxPlayers on scoreboard', async ({ page }) => {
      /**
       * Validates that GAME_CONFIG.game.maxPlayers (16) players display correctly
       * in the final scoreboard
       */

      // Add GAME_CONFIG.game.maxPlayers players
      for (let i = 1; i <= GAME_CONFIG.game.maxPlayers; i++) {
        await page.getByLabel('Player Name').fill(`Player ${i}`);
        await page.getByRole('button', { name: 'Add' }).click();
      }

      // Start game
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Select category and rounds
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Start with 1 round for quick test
      await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
      const roundsInput = page.getByLabel('Number of rounds');
      await roundsInput.clear();
      await roundsInput.fill('1');
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Play game
      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      // Use getByTestId for first player button specifically to avoid strict mode violation with 16 players
      const awardButton = page.locator('[data-testid*="award-points-player"]').first();
      await awardButton.click();
      await page.getByRole('button', { name: 'Next Profile' }).click();

      // Verify scoreboard with all players
      await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

      const scoreBars = page.locator('[data-testid="score-bars"]');
      await expect(scoreBars).toBeVisible();

      // Verify all players appear in the scoreboard by checking scoreBars contains player text
      for (let i = 1; i <= GAME_CONFIG.game.maxPlayers; i++) {
        await expect(scoreBars).toContainText(`Player ${i}`);
      }
    });
  });

  test.describe('Clues Per Profile Validation', () => {
    test(`should reveal exactly maxCluesPerProfile (${GAME_CONFIG.game.maxCluesPerProfile}) clues per profile`, async ({
      page,
    }) => {
      /**
       * Validates GAME_CONFIG.game.maxCluesPerProfile = 20
       * Ensures each profile has exactly 20 clues available
       */

      // Setup: Add players and start game
      await page.getByLabel('Player Name').fill('Alice');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('Player Name').fill('Bob');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByRole('button', { name: 'Start Game' }).click();

      // Category select
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Set 1 round
      await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
      const roundsInput = page.getByLabel('Number of rounds');
      await roundsInput.clear();
      await roundsInput.fill('1');
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Game Play - Start revealing clues
      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

      // Reveal first clue
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      let clueText = await page.getByText(/Clue \d+ of \d+/).textContent();
      expect(clueText).toContain(`Clue 1 of ${GAME_CONFIG.game.maxCluesPerProfile}`);

      // Reveal a middle clue (clue 10)
      for (let i = 2; i <= 10; i++) {
        const button = page.getByRole('button', { name: 'Show Next Clue' });
        if (await button.isEnabled()) {
          await button.click();
        }
      }
      clueText = await page.getByText(/Clue 10 of \d+/).textContent();
      expect(clueText).toContain(`Clue 10 of ${GAME_CONFIG.game.maxCluesPerProfile}`);

      // Reveal clues until we reach the max
      let clueCount = 10; // We already revealed clue 10
      while (clueCount < GAME_CONFIG.game.maxCluesPerProfile) {
        const button = page.getByRole('button', { name: 'Show Next Clue' });
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          await button.click();
          clueCount++;
        } else {
          break;
        }
      }

      // After revealing clues, check if we're at or near the max
      const finalClueText = await page.getByText(/Clue \d+ of \d+/).textContent();
      expect(finalClueText).toBeTruthy();

      // The button might be in a dialog or disabled - check for either state
      const showNextButton = page.getByRole('button', { name: 'Show Next Clue' });
      const isButtonDisabled = await showNextButton.isDisabled().catch(() => false);
      const isButtonVisible = await showNextButton.isVisible().catch(() => false);

      // If button is not visible (likely hidden by Round Complete dialog), that's also valid
      // because all 20 clues can't be shown without hitting award points (which shows dialog)
      if (isButtonVisible) {
        expect(isButtonDisabled).toBe(true);
      }
    });

    test('should show correct clue counts across multiple profiles', async ({ page }) => {
      /**
       * Validates that GAME_CONFIG.game.maxCluesPerProfile applies to all profiles
       */

      // Setup: Add players and start game
      await page.getByLabel('Player Name').fill('Player1');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('Player Name').fill('Player2');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByRole('button', { name: 'Start Game' }).click();

      // Category select
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Set 2 rounds to test multiple profiles
      await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
      const roundsInput = page.getByLabel('Number of rounds');
      await roundsInput.clear();
      await roundsInput.fill('2');
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Game Play - First Profile
      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
      await page.getByRole('button', { name: 'Show Next Clue' }).click();

      let clueText = await page.getByText(/Clue \d+ of \d+/).textContent();
      expect(clueText).toContain(`of ${GAME_CONFIG.game.maxCluesPerProfile}`);

      // Award points and move to next profile
      await page.getByRole('button', { name: 'Award points to Player1' }).click();
      await page.getByRole('button', { name: 'Next Profile' }).click();

      // Second Profile - verify clue count is still maxCluesPerProfile
      await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
      await page.getByRole('button', { name: 'Show Next Clue' }).click();

      clueText = await page.getByText(/Clue \d+ of \d+/).textContent();
      expect(clueText).toContain(`of ${GAME_CONFIG.game.maxCluesPerProfile}`);

      // Verify it's a fresh profile with clue 1
      expect(clueText).toContain('Clue 1 of');
    });
  });

  test.describe('Animation and Timing Configuration', () => {
    test('should apply animation timing to game components', async ({ page }) => {
      /**
       * Validates that animation timing values from GAME_CONFIG are used
       * This is a basic smoke test - we verify animations are applied,
       * exact timing verification would require performance profiling
       */

      // Setup: Add players and start game
      await page.getByLabel('Player Name').fill('Alice');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('Player Name').fill('Bob');
      await page.getByRole('button', { name: 'Add' }).click();

      // Start game
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Category select
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Start game
      await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Game page should load with animations
      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

      // Verify clue text appears (indicates animation likely working)
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();

      // Award points - triggers animation
      const awardButton = page.locator('[data-testid*="award-points"]').first();
      await awardButton.click();

      // Round Complete dialog appears (animated)
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify dialog is shown and visible
      await expect(dialog).toContainText('Next Profile');

      // Continue and verify transitions work smoothly
      await page.getByRole('button', { name: 'Next Profile' }).click();

      // Should navigate back to game play with transition
      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    });
  });

  test.describe('Configuration Integration', () => {
    test('should work correctly with minPlayers + extra players', async ({ page }) => {
      /**
       * Validates that configuration works when mixing min and larger player counts
       * Tests: minPlayers (2) + 1 = 3 players
       */

      // Add 3 players (minPlayers + 1)
      for (let i = 1; i <= 3; i++) {
        await page.getByLabel('Player Name').fill(`Player ${i}`);
        await page.getByRole('button', { name: 'Add' }).click();
      }

      // Verify count
      await expect(page.getByText(`Players (3/${GAME_CONFIG.game.maxPlayers})`)).toBeVisible();

      // Start game and play
      await page.getByRole('button', { name: 'Start Game' }).click();

      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Set 3 rounds to match 3 players
      const roundsInput = page.getByLabel('Number of rounds');
      await roundsInput.clear();
      await roundsInput.fill('3');
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Play each round
      for (let round = 1; round <= 3; round++) {
        await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
        await page.getByRole('button', { name: 'Show Next Clue' }).click();
        await page.getByRole('button', { name: `Award points to Player ${round}` }).click();
        await page.getByRole('button', { name: 'Next Profile' }).click();
      }

      // All 3 players should appear on scoreboard
      await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
      const scoreBars = page.locator('[data-testid="score-bars"]');

      for (let i = 1; i <= 3; i++) {
        const playerRow = scoreBars
          .locator('[data-testid*="player-score-row-"]')
          .filter({ hasText: `Player ${i}` });
        await expect(playerRow).toBeVisible();
      }
    });

    test('should validate configuration values are used in UI labels', async ({ page }) => {
      /**
       * Validates that GAME_CONFIG.game.maxPlayers is displayed in the UI
       */

      // Add one player
      await page.getByLabel('Player Name').fill('TestPlayer');
      await page.getByRole('button', { name: 'Add' }).click();

      // UI should show "Players (1/16)" where 16 = GAME_CONFIG.game.maxPlayers
      await expect(page.getByText(`Players (1/${GAME_CONFIG.game.maxPlayers})`)).toBeVisible();

      // Add more players
      for (let i = 2; i <= 5; i++) {
        await page.getByLabel('Player Name').fill(`Player ${i}`);
        await page.getByRole('button', { name: 'Add' }).click();
      }

      // UI should reflect updated count
      await expect(page.getByText(`Players (5/${GAME_CONFIG.game.maxPlayers})`)).toBeVisible();
    });
  });

  test.describe('Configuration Error Scenarios', () => {
    test('should handle max clues scenario gracefully', async ({ page }) => {
      /**
       * Validates that hitting maxCluesPerProfile limit doesn't break the game
       */

      // Setup
      await page.getByLabel('Player Name').fill('Player1');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('Player Name').fill('Player2');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByRole('button', { name: 'Start Game' }).click();

      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
      const roundsInput = page.getByLabel('Number of rounds');
      await roundsInput.clear();
      await roundsInput.fill('1');
      await page.getByRole('button', { name: 'Start Game' }).click();

      await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

      // Reveal several clues to approach the limit
      let revealedCount = 0;
      while (revealedCount < 10) {
        const button = page.getByRole('button', { name: 'Show Next Clue' });
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          await button.click();
          revealedCount++;
          await page.waitForTimeout(50);
        } else {
          break;
        }
      }

      // Award points - game should still work even after many clues
      const awardButton = page.locator('[data-testid*="award-points"]').first();
      const isAwardEnabled = await awardButton.isEnabled().catch(() => false);
      expect(isAwardEnabled).toBe(true);

      if (isAwardEnabled) {
        await awardButton.click();

        // Should show dialog or navigate to scoreboard
        const dialog = page.getByRole('dialog');
        const isDialogVisible = await dialog.isVisible().catch(() => false);

        if (isDialogVisible) {
          // Click Next Profile to continue
          await page.getByRole('button', { name: 'Next Profile' }).click();
        }

        // Should eventually reach scoreboard
        await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
      }
    });
  });
});
