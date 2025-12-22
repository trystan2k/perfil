import { expect, test } from '@playwright/test';

interface ProfileRecord {
  name: string;
  category: string;
}

test.describe('Profile Loading and Randomness', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('perfil-game-db');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    });
  });

  test('should load profiles correctly with exact distribution and randomness across two games', async ({
    page,
  }) => {
    const playerNames = ['Player1', 'Player2', 'Player3', 'Player4'];
    const roundCount = 50;

    // ===== FIRST GAME =====
    // Add players
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();
    for (const name of playerNames) {
      await page.getByLabel('Player Name').fill(name);
      await page.getByRole('button', { name: 'Add' }).click();
    }

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Select all categories
    const selectAllButton = page.getByRole('button', { name: 'Select All', exact: true });
    await selectAllButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set rounds
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill(roundCount.toString());
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for game to load
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    const firstGameProfiles: ProfileRecord[] = [];

    // Play all rounds and track profiles
    for (let round = 1; round <= roundCount; round++) {
      // Wait for round to display
      await expect(page.getByText(`Round ${round} of ${roundCount}`)).toBeVisible();

      // Get profile info by clicking answer button to reveal the profile name
      const answerButton = page.getByRole('button', { name: /reveal answer/i });
      await answerButton.click();

      // Get the answer dialog which contains profile name
      const answerDialog = page.locator('[data-testid="answer-dialog"]');
      await expect(answerDialog).toBeVisible();

      const profileName = await answerDialog.locator('[data-testid="answer-text"]').textContent();
      const cleanName = profileName?.trim();

      // Get category from the page - look for the text in the game play header
      // The format is: "Category: <CategoryName> - Profile X of Y"
      const descriptionText = await page
        .locator('text=/Category:\\s*[A-Za-z\\s]+\\s*-\\s*Profile/')
        .first()
        .textContent();

      let category = 'Unknown';
      if (descriptionText) {
        // Extract text between "Category: " and the next " - "
        const categoryMatch = descriptionText.match(/Category:\s*([^-]+?)\s*-/);
        if (categoryMatch?.[1]) {
          category = categoryMatch[1].trim();
        }
      }

      if (cleanName && category !== 'Unknown') {
        firstGameProfiles.push({ name: cleanName, category });
      }

      // Close answer dialog
      await page.keyboard.press('Escape');
      await expect(answerDialog).not.toBeVisible();

      // Show clue and award points
      const showClueButton = page.getByRole('button', { name: 'Show Next Clue' });
      if (await showClueButton.isVisible()) {
        await showClueButton.click();
        await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
      }

      // Award points to first player
      await page.getByRole('button', { name: `Award points to ${playerNames[0]}` }).click();

      // Move to next profile
      if (round < roundCount) {
        await page.getByRole('button', { name: 'Next Profile' }).click();
      }
    }

    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Wait for scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify first game profile distribution
    expect(firstGameProfiles.length).toBe(roundCount);

    const categoryCount1 = new Map<string, number>();
    const categoryProfiles1 = new Map<string, Set<string>>();

    firstGameProfiles.forEach(({ name, category }) => {
      categoryCount1.set(category, (categoryCount1.get(category) ?? 0) + 1);

      if (!categoryProfiles1.has(category)) {
        categoryProfiles1.set(category, new Set());
      }
      categoryProfiles1.get(category)?.add(name);
    });

    // Verify no repetitions
    for (const profiles of categoryProfiles1.values()) {
      const categoryCountValue =
        Array.from(categoryCount1.values()).find((c) => c === profiles.size) || profiles.size;
      expect(profiles.size).toBe(categoryCountValue);
    }

    // ===== SECOND GAME =====
    // Click restart game button from scoreboard
    await page.getByRole('button', { name: /restart game/i }).click();

    // Wait for game to load
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    const secondGameProfiles: ProfileRecord[] = [];

    // Play all rounds and track profiles
    for (let round = 1; round <= roundCount; round++) {
      // Wait for round to display
      await expect(page.getByText(`Round ${round} of ${roundCount}`)).toBeVisible();

      // Get profile info by clicking answer button
      const answerButton = page.getByRole('button', { name: /reveal answer/i });
      await answerButton.click();

      // Get the answer dialog
      const answerDialog = page.locator('[data-testid="answer-dialog"]');
      await expect(answerDialog).toBeVisible();

      const profileName = await answerDialog.locator('[data-testid="answer-text"]').textContent();
      const cleanName = profileName?.trim();

      // Get category from the page - look for the text in the game play header
      const descriptionText = await page
        .locator('text=/Category:\\s*[A-Za-z\\s]+\\s*-\\s*Profile/')
        .first()
        .textContent();

      let category = 'Unknown';
      if (descriptionText) {
        const categoryMatch = descriptionText.match(/Category:\s*([^-]+?)\s*-/);
        if (categoryMatch?.[1]) {
          category = categoryMatch[1].trim();
        }
      }

      if (cleanName && category !== 'Unknown') {
        secondGameProfiles.push({ name: cleanName, category });
      }

      // Close dialog
      await page.keyboard.press('Escape');
      await expect(answerDialog).not.toBeVisible();

      // Show clue
      const showClueButton = page.getByRole('button', { name: 'Show Next Clue' });
      if (await showClueButton.isVisible()) {
        await showClueButton.click();
        await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
      }

      // Award points
      await page.getByRole('button', { name: `Award points to ${playerNames[0]}` }).click();

      // Next profile
      if (round < roundCount) {
        await page.getByRole('button', { name: 'Next Profile' }).click();
      }
    }

    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Wait for scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify second game profile distribution
    expect(secondGameProfiles.length).toBe(roundCount);

    const categoryCount2 = new Map<string, number>();
    const categoryProfiles2 = new Map<string, Set<string>>();

    secondGameProfiles.forEach(({ name, category }) => {
      categoryCount2.set(category, (categoryCount2.get(category) ?? 0) + 1);

      if (!categoryProfiles2.has(category)) {
        categoryProfiles2.set(category, new Set());
      }
      categoryProfiles2.get(category)?.add(name);
    });

    // Verify no repetitions
    for (const profiles of categoryProfiles2.values()) {
      const categoryCountValue =
        Array.from(categoryCount2.values()).find((c) => c === profiles.size) || profiles.size;
      expect(profiles.size).toBe(categoryCountValue);
    }

    // ===== VERIFY RANDOMIZATION =====
    // The complete sequences should be different
    const firstGameString = firstGameProfiles.map((p) => `${p.name}|${p.category}`).join(',');
    const secondGameString = secondGameProfiles.map((p) => `${p.name}|${p.category}`).join(',');

    expect(firstGameString).not.toBe(secondGameString);

    // Count how many positions have different profiles
    let differentPositions = 0;
    for (let i = 0; i < Math.min(firstGameProfiles.length, secondGameProfiles.length); i++) {
      if (
        firstGameProfiles[i].name !== secondGameProfiles[i].name ||
        firstGameProfiles[i].category !== secondGameProfiles[i].category
      ) {
        differentPositions++;
      }
    }

    const percentageDifferent = (differentPositions / roundCount) * 100;
    expect(percentageDifferent).toBeGreaterThan(40);
  });
});
