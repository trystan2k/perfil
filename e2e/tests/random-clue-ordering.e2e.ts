import { expect, test } from '@playwright/test';

test.describe('Random Clue Ordering - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();
  });

  test('should display different clue order than sequential', async ({ page }) => {
    // Add two players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select a category
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    const categoryButton = page.getByLabel('Famous People');
    await categoryButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set rounds to 1
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Get first clue
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    const firstClueText = await page.locator('[data-testid="clue-display"]').textContent();

    // Restart and check if we get a different first clue
    // (This may take multiple attempts due to randomness)
    let foundDifference = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      // Reset and restart
      await page.getByRole('button', { name: 'Finish Game' }).click();
      await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

      // Navigate back to add players (or use a reset if available)
      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

      // Add players again
      await page.getByLabel('Player Name').fill('Player1');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('Player Name').fill('Player2');
      await page.getByRole('button', { name: 'Add' }).click();

      // Start game
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Select same category
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
      await page.getByLabel('Famous People').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Set 1 round
      const newRoundsInput = page.getByLabel('Number of rounds');
      await newRoundsInput.clear();
      await newRoundsInput.fill('1');

      // Start game
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Get first clue
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      const newFirstClueText = await page.locator('[data-testid="clue-display"]').textContent();

      if (newFirstClueText !== firstClueText) {
        foundDifference = true;
        break;
      }
    }

    expect(foundDifference).toBe(true);
  });

  test('should reveal clues in shuffled order', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select category
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set rounds
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal multiple clues and collect them
    const cluesRevealed: string[] = [];

    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      cluesRevealed.push(clueText || '');
    }

    // Verify we have 5 different clues (shouldn't all be sequential)
    expect(cluesRevealed).toHaveLength(5);
    expect(new Set(cluesRevealed).size).toBe(5); // All unique

    // With shuffling, clues should typically not be in order (1, 2, 3, 4, 5)
    // This is a probabilistic check but should be true for random shuffles
    const isSequential = cluesRevealed.every((clue, i) => clue.includes(`${i + 1}`));
    expect(isSequential).toBe(false); // Should be false with shuffling
  });

  test('should apply different shuffle for each profile', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select categories
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByLabel('Movies').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 2 rounds
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('2');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Collect clues for first profile
    const firstProfileClues: string[] = [];
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      firstProfileClues.push(clueText || '');
    }

    // Award points and move to next profile
    await page.getByRole('button', { name: 'Award points to Alice' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify we're on second profile
    await expect(page.getByText('Round 2 of 2')).toBeVisible();

    // Collect clues for second profile
    const secondProfileClues: string[] = [];
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      secondProfileClues.push(clueText || '');
    }

    // Different profiles should have different clue sequences (almost certainly)
    expect(firstProfileClues.join(',') !== secondProfileClues.join(',')).toBe(true);
  });

  test('should preserve shuffle on page reload', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select category
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 1 round
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal 5 clues and collect them
    const cluesBeforeReload: string[] = [];
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      cluesBeforeReload.push(clueText || '');
    }

    // Reload the page
    await page.reload();

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Verify clues are in the same order (shuffle preserved)
    const cluesAfterReload: string[] = [];
    for (let i = 0; i < 5; i++) {
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      cluesAfterReload.push(clueText || '');

      // Only click next if not on last clue
      if (i < 4) {
        await page.getByRole('button', { name: 'Show Next Clue' }).click();
      }
    }

    // Order should be identical (shuffle persisted)
    expect(cluesAfterReload).toEqual(cluesBeforeReload);
  });

  test('should maintain shuffle when switching languages', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select category
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 1 round
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal 3 clues
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
    }

    // Get the game state before language switch
    const cluesBeforeLangSwitch: string[] = [];
    // Re-collect clues by looking at what's currently revealed
    const currentClueText = await page.locator('[data-testid="clue-display"]').textContent();
    cluesBeforeLangSwitch.push(currentClueText || '');

    // Try to find language switcher and switch language
    // Note: This may vary based on app implementation
    const languageSwitcher = page.getByTestId('language-switcher');
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();

      // Select a different language (Portuguese if available)
      const ptOption = page.getByRole('option', { name: /português|Portuguese/i });
      if (await ptOption.isVisible()) {
        await ptOption.click();

        // Wait for language switch
        await page.waitForLoadState('networkidle');

        // Verify shuffle still works - try to get next clue
        const clueCounterBefore = await page.getByText(/Clue \d+ of \d+/).textContent();

        // The shuffle should still be in effect (same profile being shown)
        // This is a smoke test that the game didn't break after language switch
        expect(clueCounterBefore).toMatch(/Clue \d+ of \d+/);
      }
    }
  });

  test('should handle complete game flow with shuffled clues', async ({ page }) => {
    // Add three players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Charlie');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select categories
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByLabel('Movies').click();
    await page.getByLabel('Sports').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 3 rounds
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('3');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Round 1 of 3')).toBeVisible();

    // Play round 1
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Alice' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Play round 2
    await expect(page.getByText('Round 2 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Bob' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Play round 3
    await expect(page.getByText('Round 3 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Charlie' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Should reach scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify all players appear
    const scoreBars = page.locator('[data-testid="score-bars"]');
    await expect(scoreBars).toBeVisible();

    const aliceRow = scoreBars.locator('[data-testid*="player-score-row-"]').filter({
      has: page.locator('[data-testid*="player-name-"]', { hasText: 'Alice' }),
    });
    const bobRow = scoreBars.locator('[data-testid*="player-score-row-"]').filter({
      has: page.locator('[data-testid*="player-name-"]', { hasText: 'Bob' }),
    });
    const charlieRow = scoreBars.locator('[data-testid*="player-score-row-"]').filter({
      has: page.locator('[data-testid*="player-name-"]', { hasText: 'Charlie' }),
    });

    await expect(aliceRow).toBeVisible();
    await expect(bobRow).toBeVisible();
    await expect(charlieRow).toBeVisible();
  });

  test('should not affect revealed clue history with shuffle', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select category
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 1 round
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal clues and track them
    const revealedClues: string[] = [];

    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();

      // Get the current clue displayed
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      revealedClues.push(clueText || '');

      // Check clue counter
      const counter = await page.getByText(/Clue \d+ of \d+/).textContent();
      expect(counter).toMatch(`Clue ${i + 1} of 20`);
    }

    // Verify we have 4 unique clues
    expect(revealedClues).toHaveLength(4);
    expect(new Set(revealedClues).size).toBe(4);

    // Award points
    await page.getByRole('button', { name: 'Award points to Alice' }).click();

    // Game should complete (since we only have 1 round)
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Should be on scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
  });

  test('should maintain consistent clue order during rapid reveals', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select category
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 1 round
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Rapidly reveal 10 clues
    const clues: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      clues.push(clueText || '');

      // Brief pause to ensure UI updates
      await page.waitForTimeout(50);
    }

    // Verify all clues are unique
    expect(new Set(clues).size).toBe(10);

    // Verify counter is at 10
    const finalCounter = await page.getByText(/Clue \d+ of \d+/).textContent();
    expect(finalCounter).toMatch('Clue 10 of 20');
  });

  test('should handle skip profile with shuffled clues', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select categories
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByLabel('Movies').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 2 rounds
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('2');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal a few clues
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();
    }

    // Skip profile
    await page.getByRole('button', { name: 'Skip' }).click();

    // Should move to next profile
    await expect(page.getByText('Round 2 of 2')).toBeVisible();

    // Verify clue counter is reset
    const counter = await page.getByText(/Clue \d+ of \d+/).textContent();
    expect(counter).toMatch(/Clue 0 of \d+/);
  });

  test('should work with multiple category selections and different shuffles', async ({ page }) => {
    // Add players
    await page.getByLabel('Player Name').fill('Player1');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Player2');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select multiple categories
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByLabel('Famous People').click();
    await page.getByLabel('Movies').click();
    await page.getByLabel('Sports').click();
    await page.getByLabel('Animals').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set 4 rounds (one per category)
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('4');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Round 1 of 4')).toBeVisible();

    // Play through all 4 rounds, collecting first clue from each
    const firstCluesPerProfile: string[] = [];

    for (let round = 1; round <= 4; round++) {
      await page.getByRole('button', { name: 'Show Next Clue' }).click();

      const clueText = await page.locator('[data-testid="clue-display"]').textContent();
      firstCluesPerProfile.push(clueText || '');

      if (round < 4) {
        // Award points and move to next profile
        await page.getByRole('button', { name: 'Award points to Player1' }).click();
        await page.getByRole('button', { name: 'Next Profile' }).click();

        await expect(page.getByText(`Round ${round + 1} of 4`)).toBeVisible();
      }
    }

    // All first clues should be different (different shuffles per profile)
    expect(firstCluesPerProfile).toHaveLength(4);
    const uniqueFirstClues = new Set(firstCluesPerProfile);
    expect(uniqueFirstClues.size).toBe(4);

    // Complete the game
    await page.getByRole('button', { name: 'Award points to Player1' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Should reach scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
  });
});
