# Testing Guide

This document provides comprehensive information about running tests and test coverage in this project.

## Running Tests

### Run All Tests

To run the entire test suite:

```bash
pnpm test
```

This will run Vitest in watch mode, which automatically re-runs tests when files change. This is useful during development.

### Run Tests Once (CI Mode)

To run tests once and exit (useful for CI/CD pipelines):

```bash
pnpm vitest run
```

### Run Tests with Coverage

To run tests and generate coverage reports:

```bash
pnpm test:coverage
```

This command will:
- Execute all tests once
- Generate coverage reports in multiple formats
- Enforce minimum coverage thresholds (80%)
- Exit with an error if coverage is below thresholds

## Understanding Coverage Reports

After running `pnpm test:coverage`, coverage reports are generated in the `coverage/` directory.

### Console Output

The command displays a coverage summary directly in the terminal, showing:
- **% Stmts** (Statements): Percentage of code statements executed
- **% Branch**: Percentage of conditional branches tested
- **% Funcs** (Functions): Percentage of functions called
- **% Lines**: Percentage of code lines executed
- **Uncovered Line #s**: Specific line numbers not covered by tests

Example output:
```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |     100 |      100 |     100 |     100 |                   
 hooks           |     100 |      100 |     100 |     100 |                   
  useProfiles.ts |     100 |      100 |     100 |     100 |                   
-----------------|---------|----------|---------|---------|-------------------
```

### HTML Report

For a detailed, line-by-line coverage view:

1. Run `pnpm test:coverage`
2. Open `coverage/index.html` in your web browser
3. Navigate through files to see:
   - Highlighted code showing covered (green) and uncovered (red) lines
   - Detailed branch coverage information
   - Function execution counts

### LCOV Report

The `coverage/lcov.info` file is generated for CI/CD integration with services like:
- Codecov
- Coveralls
- SonarQube
- GitHub Actions code coverage badges

## Coverage Thresholds

This project enforces minimum coverage thresholds to maintain code quality:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

If coverage drops below these thresholds, the `test:coverage` command will fail with an error message indicating which metric failed.

## Best Practices

1. **Run coverage locally** before pushing code to ensure you meet the minimum thresholds
2. **Aim for meaningful tests** rather than just hitting coverage numbers
3. **Review the HTML report** to identify untested code paths
4. **Focus on branch coverage** to ensure all conditional logic is tested
5. **Keep coverage high** by writing tests alongside new features

## Test File Locations

- Unit tests: Located alongside source files in `__tests__/` directories
- Test files use the `.test.ts` or `.test.tsx` extension
- Example: `src/hooks/__tests__/useProfiles.test.tsx`

## Translation Files in Tests

### How Translations are Loaded

The test environment uses **actual translation files** from `public/locales/` instead of hardcoded translations. This ensures tests always reflect the real translation content used in the application.

**Implementation Details:**
- Translation files are dynamically loaded during test setup via `vitest.setup.ts`
- Files are read from `public/locales/{language}/translation.json` (default: English)
- Nested JSON structure is flattened to dot notation (e.g., `common.loading`)
- The i18next mock uses these loaded translations for all tests

**Benefits:**
- ✅ Single source of truth for translations
- ✅ Tests automatically use latest translation content
- ✅ No need to maintain duplicate hardcoded translations
- ✅ Tests catch missing or incorrect translation keys

### Adding or Updating Translations for Tests

When you add or modify translations:

1. **Update the translation JSON file:**
   ```bash
   # Edit the appropriate language file
   public/locales/en/translation.json
   public/locales/pt-BR/translation.json
   public/locales/es/translation.json
   ```

2. **Tests automatically pick up changes:**
   - No need to update test setup files
   - Translations are loaded fresh for each test run
   - Use dot notation to access nested keys: `t('common.loading')`

3. **Testing new translations:**
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { useTranslation } from 'react-i18next';
   
   function MyComponent() {
     const { t } = useTranslation();
     return <div>{t('common.newKey')}</div>;
   }
   
   it('should display new translation', () => {
     render(<MyComponent />);
     // Assert against the actual translated text
     expect(screen.getByText('Expected Translation Text')).toBeInTheDocument();
   });
   ```

4. **Important notes:**
   - Test assertions should use the **actual translated text**, not translation keys
   - ✅ Correct: `expect(screen.getByText('Loading...')).toBeInTheDocument()`
   - ❌ Wrong: `expect(screen.getByText('common.loading')).toBeInTheDocument()`
   - For pluralization, use the `_one` and `_other` suffixes in JSON files

### Translation File Structure

Example of nested translation structure:
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "gameSetup": {
    "title": "Game Setup",
    "errors": {
      "duplicateName": "Player name already exists"
    }
  }
}
```

Accessed in tests as:
- `t('common.loading')` → "Loading..."
- `t('gameSetup.title')` → "Game Setup"
- `t('gameSetup.errors.duplicateName')` → "Player name already exists"

## E2E Testing with Playwright

### Running E2E Tests Locally

To run end-to-end tests that test the entire application from a user's perspective:

```bash
pnpm test:e2e
```

This command will:
- Start the development server (`pnpm run dev`)
- Launch Chromium in headless mode
- Run all tests in `e2e/tests/` matching `*.e2e.ts`
- Generate an HTML report in `e2e/e2e-report/`
- Capture traces on first failure for debugging

### E2E Test Files

E2E tests are located in `e2e/tests/` and use the `.e2e.ts` extension. Examples:
- `e2e/tests/game.e2e.ts` - Full game flow tests
- `e2e/tests/error-handling.e2e.ts` - Error overlay and error state tests
- `e2e/tests/language-persistence.e2e.ts` - Language switching and persistence
- `e2e/tests/theme-switching.e2e.ts` - Dark mode and theme tests

### Configuration

Playwright configuration is in `e2e/playwright.config.ts`:
- **Test timeout**: 2 minutes per test
- **Action timeout**: 10 seconds per action
- **Trace on first retry**: Captures traces for debugging failed tests
- **Headless mode**: Tests run headlessly (no visible browser window)
- **baseURL**: `http://localhost:4321` (or from `BASE_URL` environment variable)

### E2E Test Artifacts

After running e2e tests, artifacts are generated in:
- `e2e/e2e-report/` - HTML report with test results and screenshots
- `test-results/` - Playwright traces for failed tests (if any)

These are excluded from git via `.gitignore`.

### Running E2E Tests in CI/CD

E2E tests run automatically in GitHub Actions on:
- Pull requests to `main`
- Pushes to `main`
- Manual workflow dispatch

The CI pipeline tests against **three browsers**:
- Chromium (primary)
- Firefox
- WebKit

Each browser runs all e2e tests independently. Artifacts are uploaded for debugging if any tests fail.

**Environment Variables in CI:**
- `CI=true` - Signals Playwright it's running in CI
- `BASE_URL=http://localhost:4321` - Server URL for tests
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false` - Ensures browsers are downloaded

See `.github/workflows/ci.yml` for the full workflow configuration.

## Complete QA Workflow

The `pnpm run complete-check` script runs all quality checks in sequence:

```bash
pnpm run complete-check
```

This executes:
1. **Linting** - `pnpm lint` (Biome)
2. **Type checking** - `pnpm typecheck` (TypeScript & Astro)
3. **Unit/Integration tests** - `pnpm test:coverage` (Vitest with coverage)
4. **E2E tests** - `pnpm test:e2e` (Playwright)
5. **Build** - `pnpm build` (Production build)

All must pass for the workflow to succeed. This same workflow runs in CI before each PR is merged.

## Related Documentation

- See [DEV_WORKFLOW.md](DEV_WORKFLOW.md) for the full development workflow
- See the project root `vitest.config.ts` for unit test configuration details
- See `e2e/playwright.config.ts` for e2e test configuration details
