# Task 25: Implement Global Loading and Error States for Game Flow

## Description
Implemented a centralized loading and error handling system to improve user experience during asynchronous operations (game creation, loading, transitions). This replaces scattered local state management with a unified global approach using the Zustand store.

## Changes Implemented

### 1. Store Updates (`src/stores/gameStore.ts`)
- Added `isLoading: boolean` state to track global loading status.
- Added `error: { message: string; recoveryPath?: string } | null` state for global error handling.
- Implemented actions: `setLoading(isLoading)`, `setError(message, recoveryPath)`, and `clearError()`.

### 2. UI Components
- **LoadingSpinner** (`src/components/ui/LoadingSpinner.tsx`):
  - Reusable spinner component with customizable size and text.
  - Supports full-page overlay mode with backdrop blur.
  - Accessible with proper ARIA roles.
- **ErrorOverlay** (`src/components/ui/ErrorOverlay.tsx`):
  - Modal-like overlay for displaying critical errors.
  - Supports custom recovery paths (navigation) and callbacks.
  - Includes "Go Home" or custom action buttons.

### 3. State Providers
- **GameStateProvider** (`src/components/GameStateProvider.tsx`):
  - Subscribes to the store's `isLoading` and `error` states.
  - Conditionally renders the `LoadingSpinner` (highest priority) or `ErrorOverlay`.
  - Renders children when no blocking state is active.
- **GameStateProviderWrapper** (`src/components/GameStateProviderWrapper.tsx`):
  - Orchestrates provider nesting: `ThemeProvider` -> `I18nProvider` -> `GameStateProvider`.
  - Integrated into `src/layouts/Layout.astro` to wrap the entire application.

### 4. Integration & Refactoring
- **GameSetup**: Updated to use global loading during game creation.
- **CategorySelect**: Refactored to use global loading/error during session loading and game start. Added proper error recovery paths.
- **GamePlay**: Updated to handle session loading errors with global states.

## Verification Results

### Automated Tests
- **Unit Tests**:
  - `gameStore`: Verified new state and actions (83 tests passing).
  - `LoadingSpinner`: Verified rendering variants (23 tests passing).
  - `ErrorOverlay`: Verified message display, actions, and accessibility (34 tests passing).
  - `GameStateProvider`: Verified rendering priority and integration (18 tests passing).
- **Integration Tests**:
  - `GameSetup`, `CategorySelect`, and `GamePlay` tests updated to mock global state actions.
  - All component tests passing with high coverage.

### QA Checks
- Linting: Passed (Biome).
- Type Check: Passed (TypeScript/Astro).
- Build: Passed (Vite/Astro).

## Lessons Learned
- **Mocking Zustand**: When testing components that use Zustand stores, it's crucial to mock all used actions (`setLoading`, `setError`, etc.) in the test setup. Using `vi.hoisted` helps ensures mocks are initialized before imports.
- **Provider Nesting**: Centralizing providers in a wrapper component simplifies `Layout.astro` and ensures consistent context availability across the app.
- **Test Stability**: Using `waitFor` is essential when asserting state changes that happen asynchronously (e.g., after `useEffect`).

## Next Steps
- Consider adding more granular loading states for specific sections if the global spinner becomes too intrusive for minor background updates.
- explore transition animations between loading/error/content states.
