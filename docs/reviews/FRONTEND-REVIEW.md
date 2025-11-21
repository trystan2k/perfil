# Frontend Comprehensive Review - Perfil PWA Application

**Review Date**: 2025-11-21  
**Application**: Perfil - Trivia Game PWA  
**Stack**: Astro + React 19 + TypeScript + Zustand + TanStack Query  
**Reviewers**: Frontend Developer, JavaScript/TypeScript Pro, React Specialist, Architecture Reviewer, Astro Specialist

---

## Executive Summary

This comprehensive review evaluates the Perfil application across five specialist dimensions: frontend development practices, JavaScript/TypeScript code quality, React patterns and performance, overall architecture, and Astro framework implementation. The application demonstrates solid fundamentals with modern tooling and React 19 compatibility, but requires focused improvements in performance optimization, architectural boundaries, Astro-specific patterns, and adherence to established project standards.

**Overall Assessment**: **B+ (Solid Foundation with Required Improvements)**

### Key Strengths
- ✅ Modern React 19 implementation with TypeScript
- ✅ Excellent use of TanStack Query for data management
- ✅ Comprehensive testing strategy (Vitest + Playwright)
- ✅ PWA architecture with offline support
- ✅ Strong accessibility foundations
- ✅ Modern tooling (Biome, pnpm, Astro islands)

### Critical Issues Requiring Immediate Attention
- ❌ Wildcard import violations throughout UI components
- ❌ Excessive `client:only` usage defeating Astro's zero-JS philosophy
- ❌ No View Transitions API for smooth navigation
- ❌ No Astro middleware for cross-cutting concerns
- ❌ Missing responsive desktop optimization
- ❌ State management coupled with persistence logic
- ❌ Race conditions in state persistence and i18n initialization
- ❌ Missing architectural layer boundaries
- ❌ Excessive re-renders due to selector optimization issues
- ❌ Memory leak risks in store persistence timers

**Note**: This project uses **Tailwind CSS** as its styling approach. All styling should be done using Tailwind utility classes, design tokens from `tailwind.config.mjs`, and CSS variables. The `cn()` utility from `lib/utils.ts` should be used for conditional class combinations.

---

## Priority Matrix

### 🔴 CRITICAL (Must Fix Before Production Scale)
1. Fix wildcard imports in UI components
2. Replace client:only with strategic Astro hydration
3. Implement View Transitions API
4. Implement Astro middleware
5. Fix race conditions in state persistence
6. Fix i18n initialization race conditions
7. Resolve memory leak risks in store timers
8. Implement proper error boundaries
9. Optimize Zustand store selectors

### 🟡 HIGH (Should Fix in Next Sprint)
7. Clarify SSG rendering strategy
8. Implement error pages (404, 500)
9. Implement SEO & metadata
10. Implement responsive desktop layouts
11. Increase touch target sizes (accessibility)
12. Fix PWA theme color mismatch
13. Implement lazy loading for components
14. Refactor state persistence to repository pattern
15. Consolidate provider pattern
16. Implement domain-driven design structure
17. Migrate to progressive data loading
18. Add integration testing layer
19. Fix window.location navigation anti-pattern

### 🟢 MEDIUM (Plan for Future Iterations)
18. Generate sitemap & robots.txt
19. Optimize icon file sizes
20. Add loading states for async operations
21. Standardize provider composition
22. Implement keyboard navigation enhancements
23. Add visual feedback animations
24. Optimize header layout for mobile
25. Migrate to centralized async state management
26. Implement state machine for game flow
27. Multiple architecture and code quality improvements

### 🔵 LOW (Nice to Have / Technical Debt)
27. Bundle size optimizations
28. Component documentation
29. Custom hook extractions
30. Various code quality and maintainability improvements

---

## 1. Frontend Development Issues

### 1.1 Code Quality & Standards Compliance

#### **Task FR-001: Remove Wildcard Import Violations**
- **Priority**: Critical
- **Category**: Frontend Development - Code Quality
- **Problem**: Multiple UI components violate project standards by using `import * as React` and `import * as DialogPrimitive`, harming bundle size and tree-shaking
- **Location**: `src/components/ui/dialog.tsx`, `src/components/ui/label.tsx`, `src/components/ui/popover.tsx`, `src/components/ui/progress.tsx`
- **Solution**: 
  ```typescript
  // ❌ Wrong
  import * as DialogPrimitive from '@radix-ui/react-dialog';
  
  // ✅ Correct
  import { Root, Trigger, Portal, Close, Overlay, Content } from '@radix-ui/react-dialog';
  ```
- **Impact**: Better tree-shaking, ~15-20KB bundle size reduction, clearer dependencies
- **Acceptance Criteria**:
  - [ ] All UI components use explicit named imports
  - [ ] No `import *` statements remain in codebase
  - [ ] Bundle size reduced by >15KB
  - [ ] Build warnings eliminated

### 1.2 Responsive Design

#### **Task FR-002: Implement Progressive Responsive Layouts**
- **Priority**: High
- **Category**: Frontend Development - Responsive Design
- **Problem**: Application uses minimal responsive breakpoints, showing cramped mobile layouts on desktop/tablet with wasted whitespace. Only 1 responsive breakpoint found (`md:text-sm`)
- **Location**: All page components
- **Issues**:
  - Game cards max at 672px (`max-w-2xl`) on 1920px screens
  - Header controls cramped without desktop labels
  - Scoreboard table doesn't expand for additional information
  - Category selection checkboxes remain cramped on tablet/desktop
- **Solution**: 
  ```typescript
  // Responsive card sizing
  <Card className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
  
  // Responsive grid layouts
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  
  // Adaptive font sizing
  <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
  
  // Show labels on desktop
  <span className="sr-only md:not-sr-only">Settings</span>
  ```
- **Impact**: Better desktop/tablet experience, professional appearance, efficient space utilization
- **Acceptance Criteria**:
  - [ ] Minimum 4 breakpoints implemented (sm, md, lg, xl)
  - [ ] All major components responsive tested
  - [ ] Desktop utilizes 80%+ screen width effectively
  - [ ] No horizontal scrolling on any viewport size

#### **Task FR-003: Increase Touch Target Sizes**
- **Priority**: High
- **Category**: Frontend Development - Accessibility
- **Problem**: Multiple interactive elements fall below WCAG AAA (44px) and platform guidelines (48px) for touch targets
- **Location**: Theme switcher, language switcher, remove player buttons, FAB answer reveal button
- **Solution**: 
  ```css
  /* globals.css updates */
  .theme-button, .locale-link {
    min-width: 48px;
    min-height: 48px;
    padding: 12px;
  }
  
  /* Button component variant */
  icon: 'h-12 w-12 min-w-12 min-h-12', /* Was h-10 w-10 */
  ```
- **Impact**: WCAG AAA compliance, better mobile UX, reduced misclicks
- **Acceptance Criteria**:
  - [ ] All interactive elements meet 48×48px minimum
  - [ ] Adequate spacing (8px+) between touch targets
  - [ ] Automated accessibility tests pass
  - [ ] Manual touch testing on mobile devices confirms usability

### 1.3 Performance Optimization

#### **Task FR-003: Implement Lazy Loading for Components**
- **Priority**: High
- **Category**: Frontend Development - Performance
- **Problem**: Zero usage of `React.lazy()` or `Suspense`. All components load immediately even if not needed
- **Location**: All page-level components and heavy features
- **Solution**: 
  ```typescript
  // src/pages/game/[sessionId].astro
  import { lazy, Suspense } from 'react';
  
  const GamePlay = lazy(() => import('../../components/GamePlay'));
  const Scoreboard = lazy(() => import('../../components/Scoreboard'));
  const RoundSummary = lazy(() => import('../../components/RoundSummary'));
  
  <Suspense fallback={<LoadingSpinner />}>
    <GamePlay sessionId={sessionId} client:only="react" />
  </Suspense>
  ```
- **Target Components**: Scoreboard, RoundSummary, CategorySelect, Dialog, Popover
- **Impact**: 30-40% reduction in Time to Interactive (TTI), faster initial page load
- **Acceptance Criteria**:
  - [ ] 4-6 components lazy loaded
  - [ ] Suspense boundaries with loading states
  - [ ] TTI improved by 30%+
  - [ ] No waterfall loading issues

#### **Task FR-003: Optimize Astro Hydration Strategy**
- **Priority**: High
- **Category**: Frontend Development - Performance
- **Problem**: Excessive `client:only="react"` usage forces full client-side rendering even for static content
- **Location**: `Layout.astro`, all page files
- **Solution**: 
  ```astro
  <!-- Static until interaction -->
  <ThemeSwitcher client:idle />
  <LanguageSwitcher client:idle />
  
  <!-- Visible components load eagerly -->
  <GamePlay client:load />
  
  <!-- Only when needed -->
  <RoundSummary client:visible />
  
  <!-- Keep client:only for state-heavy components -->
  <ErrorStateProviderWrapper client:only="react">
  ```
- **Impact**: 30-40% TTI reduction, better Lighthouse scores, reduced JavaScript execution time
- **Acceptance Criteria**:
  - [ ] Document hydration strategy in ARCHITECTURE.md
  - [ ] No more than 2-3 `client:only` directives per page
  - [ ] Idle and visible directives used appropriately
  - [ ] Performance tests confirm improvement

#### **Task FR-003: Add Component Memoization**
- **Priority**: High
- **Category**: Frontend Development - Performance
- **Problem**: Only 1 `useMemo` usage found. Components re-render unnecessarily on state changes
- **Location**: `GamePlay.tsx`, `CategorySelect.tsx`, `ClueProgress.tsx`
- **Solution**: 
  ```typescript
  // GamePlay.tsx
  const currentClueText = useMemo(
    () => currentTurn.cluesRead > 0 ? currentProfile.clues[currentTurn.cluesRead - 1] : null,
    [currentTurn.cluesRead, currentProfile.clues]
  );
  
  const handleAwardPoints = useCallback((playerId: string) => {
    // ... existing logic
  }, [players, currentTurn, totalCluesPerProfile, currentProfile.name]);
  
  // ClueProgress.tsx
  const clueDots = useMemo(
    () => Array.from({ length: totalClues }, (_, index) => ({
      id: `clue-${index}`,
      isRevealed: index < cluesRevealed,
    })),
    [totalClues, cluesRevealed]
  );
  ```
- **Impact**: Reduced re-renders, smoother UI, better perceived performance
- **Acceptance Criteria**:
  - [ ] 8-10 strategic `useMemo` implementations
  - [ ] All event handlers wrapped with `useCallback`
  - [ ] React DevTools Profiler shows reduced re-renders
  - [ ] No performance regressions

### 1.4 PWA & Assets

#### **Task FR-003: Fix PWA Theme Color Mismatch**
- **Priority**: High
- **Category**: Frontend Development - PWA Configuration
- **Problem**: PWA manifest specifies `theme_color: '#0d1322'` (dark blue) but app's primary color is yellow. `background_color: '#ffffff'` doesn't match dark mode
- **Location**: `astro.config.mjs` lines 24-25
- **Solution**: 
  ```javascript
  manifest: {
    name: 'Perfil - Trivia Game',
    theme_color: '#F7CF2E', // Matches --primary yellow
    background_color: '#F5F5F5', // Matches light mode --background
    // Consider: dynamic theme color based on user preference
  }
  ```
- **Impact**: Consistent branding, better user experience, professional appearance
- **Acceptance Criteria**:
  - [ ] Theme color matches design system primary
  - [ ] Background color appropriate for both themes
  - [ ] PWA install splash screen looks correct
  - [ ] Browser address bar matches theme

#### **Task FR-003: Optimize Icon Assets**
- **Priority**: Medium
- **Category**: Frontend Development - Performance
- **Problem**: PWA icons are unoptimized PNGs (223KB each for 512×512), totaling ~670KB
- **Location**: `public/icons/` directory
- **Solution**: 
  - Compress with imagemin or sharp
  - Target: <50KB for 512×512 icons
  - Consider WebP format with PNG fallback
  - Add to build process
- **Impact**: ~350KB savings (70% reduction), faster PWA install
- **Acceptance Criteria**:
  - [ ] All icons under 50KB each
  - [ ] Visual quality maintained
  - [ ] PWA install size reduced
  - [ ] Automated optimization in build

### 1.5 UX Improvements

#### **Task FR-003: Add Loading States for Async Operations**
- **Priority**: Medium
- **Category**: Frontend Development - UX
- **Problem**: Several async operations lack proper loading states (category selection, game start)
- **Location**: `CategorySelect.tsx`, `GameSetup.tsx`
- **Solution**: 
  ```typescript
  // CategorySelect.tsx
  {isStarting && (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <Card className="p-6 flex items-center gap-4">
        <Loader2 className="animate-spin" />
        <p>{t('game.starting')}</p>
      </Card>
    </div>
  )}
  
  // GameSetup.tsx
  <Button disabled={isCreatingGame} onClick={handleCreate}>
    {isCreatingGame && <Loader2 className="animate-spin mr-2" />}
    {t('setup.create')}
  </Button>
  ```
- **Impact**: Better perceived performance, reduced user confusion
- **Acceptance Criteria**:
  - [ ] All async operations have loading indicators
  - [ ] Loading states accessible (aria-busy, aria-live)
  - [ ] Spinners/skeletons appropriate for duration
  - [ ] No layout shift during loading

#### **Task FR-003: Implement Keyboard Navigation Enhancements**
- **Priority**: Medium
- **Category**: Frontend Development - Accessibility
- **Problem**: Basic keyboard nav works, but advanced patterns missing (arrow keys, shortcuts)
- **Location**: `CategorySelect.tsx` (checkboxes), `GamePlay.tsx` (player selection), `Scoreboard.tsx`
- **Solution**: 
  ```typescript
  // Keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl+N: Next clue
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        nextClue();
      }
      // Ctrl+R: Reveal answer
      if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        setShowAnswerDialog(true);
      }
      // Arrow keys: Navigate players
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Focus next/previous player button
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [nextClue]);
  ```
- **Impact**: Better accessibility, power user productivity, WCAG AAA compliance
- **Acceptance Criteria**:
  - [ ] Arrow key navigation implemented
  - [ ] Keyboard shortcuts documented
  - [ ] Focus management correct throughout
  - [ ] Screen reader friendly

#### **Task FR-003: Add Visual Feedback Animations**
- **Priority**: Medium
- **Category**: Frontend Development - UX
- **Problem**: State changes (points awarded, clue revealed) lack visual feedback. Framer Motion installed but unused
- **Location**: `GamePlay.tsx`, `RoundSummary.tsx`, `ClueProgress.tsx`
- **Solution**: 
  ```typescript
  import { motion } from 'framer-motion';
  
  // Animate clue reveal
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {currentClueText}
  </motion.div>
  
  // Animate progress dots
  {clueDots.map((dot) => (
    <motion.div
      key={dot.id}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
      className={dotClasses}
    />
  ))}
  
  // Points awarded animation
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="text-2xl font-bold text-primary"
  >
    +{pointsAwarded}
  </motion.div>
  ```
- **Impact**: Better user feedback, professional polish, improved perceived responsiveness
- **Acceptance Criteria**:
  - [ ] Animations for key state transitions
  - [ ] Respects prefers-reduced-motion
  - [ ] Performance not degraded (60fps)
  - [ ] Animations enhance, not distract

#### **Task FR-003: Optimize Mobile Header Layout**
- **Priority**: Medium
- **Category**: Frontend Development - Mobile UX
- **Problem**: Sticky header consumes 87px of vertical space on mobile with theme/language switchers always visible
- **Location**: `Layout.astro` lines 61-78
- **Solution**: 
  ```astro
  <!-- Option 1: Auto-hide header -->
  <header class="sticky top-0 transition-transform duration-300" data-header>
    <!-- Hide on scroll down, show on scroll up -->
  </header>
  
  <!-- Option 2: Settings menu -->
  <header class="h-14"> <!-- Reduced from 87px -->
    <button aria-label="Settings">
      <Settings size={24} />
    </button>
  </header>
  
  <Sheet> <!-- Settings drawer -->
    <ThemeSwitcher />
    <LanguageSwitcher />
  </Sheet>
  ```
- **Impact**: +15% more vertical space for game content on mobile
- **Acceptance Criteria**:
  - [ ] Header height reduced to 56-64px
  - [ ] Settings accessible within 2 taps
  - [ ] Scroll behavior smooth
  - [ ] Works with safe area insets

---

## 2. JavaScript/TypeScript Issues

### 2.1 Memory Management & Performance

#### **Task TS-001: Fix Memory Leak in Store Persistence Timers**
- **Priority**: Critical
- **Category**: JavaScript/TypeScript - Memory Management
- **Problem**: `gameStore.ts` maintains `Map<string, ReturnType<typeof setTimeout>>` for persistence timers that may leak if components unmount during state updates
- **Location**: `src/stores/gameStore.ts`
- **Solution**: 
  ```typescript
  // Implement proper cleanup mechanism
  const cleanupTimer = (sessionId: string) => {
    const timer = persistTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      persistTimers.delete(sessionId);
    }
  };
  
  // Export cleanup function for unmount hooks
  export const cleanupPersistence = (sessionId: string) => {
    cleanupTimer(sessionId);
  };
  
  // Or use WeakMap if possible
  ```
- **Impact**: Prevents memory leaks, better resource management
- **Acceptance Criteria**:
  - [ ] All timers properly cleaned up
  - [ ] Memory profiling shows no leaks
  - [ ] Cleanup called in component unmount
  - [ ] Tests verify cleanup

#### **Task TS-002: Fix Race Condition in i18n Initialization**
- **Priority**: Critical
- **Category**: JavaScript/TypeScript - Async Patterns
- **Problem**: `I18nProvider.tsx` uses multiple `useEffect` hooks with shared refs that can race during rapid language switches or component remounts
- **Location**: `src/components/I18nProvider.tsx`
- **Solution**: 
  ```typescript
  // Consolidate into single effect with state machine
  const [initState, dispatch] = useReducer(i18nReducer, {
    status: 'idle',
    locale: null,
    error: null
  });
  
  useEffect(() => {
    let cancelled = false;
    
    const initialize = async () => {
      dispatch({ type: 'INIT_START' });
      try {
        await initI18n();
        if (!cancelled) {
          await i18n.changeLanguage(locale);
          dispatch({ type: 'INIT_SUCCESS', locale });
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({ type: 'INIT_ERROR', error });
        }
      }
    };
    
    initialize();
    return () => { cancelled = true; };
  }, [locale]);
  ```
- **Impact**: Eliminates race conditions, predictable behavior
- **Acceptance Criteria**:
  - [ ] No race conditions during rapid language switches
  - [ ] State transitions are predictable
  - [ ] Tests verify concurrent scenarios
  - [ ] No memory leaks

#### **Task TS-003: Implement AbortController for Async Operations**
- **Priority**: High
- **Category**: JavaScript/TypeScript - Async Patterns
- **Problem**: `useGameSession.ts` and `useProfiles.ts` don't implement cancellation for in-flight requests when components unmount
- **Location**: `src/hooks/useGameSession.ts`, `src/hooks/useProfiles.ts`
- **Solution**: 
  ```typescript
  // TanStack Query supports this natively
  const { data, error } = useQuery({
    queryKey: ['profiles', locale],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/data/${locale}/profiles.json`, { signal });
      return response.json();
    },
  });
  
  // For custom async operations
  useEffect(() => {
    const controller = new AbortController();
    
    fetchData(controller.signal).catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });
    
    return () => controller.abort();
  }, []);
  ```
- **Impact**: Prevents "Can't perform state update on unmounted component" warnings
- **Acceptance Criteria**:
  - [ ] All async operations support cancellation
  - [ ] No unmounted component warnings
  - [ ] Tests verify cleanup
  - [ ] Network requests properly aborted

### 2.2 Type Safety

#### **Task TS-004: Strengthen Zod Schema Type Definitions**
- **Priority**: Medium
- **Category**: JavaScript/TypeScript - Type Safety
- **Problem**: `models.ts` defines Zod schemas but doesn't export helpers. `catchall(z.unknown())` in `profileMetadataSchema` bypasses type safety
- **Location**: `src/types/models.ts`
- **Solution**: 
  ```typescript
  // Export validation helpers
  export const validateProfile = (data: unknown): Profile => {
    return profileSchema.parse(data);
  };
  
  export const isValidProfile = (data: unknown): data is Profile => {
    return profileSchema.safeParse(data).success;
  };
  
  // Replace catchall with explicit properties
  const profileMetadataSchema = z.object({
    source: z.string().optional(),
    verified: z.boolean().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    // Define all expected metadata properties
  });
  ```
- **Impact**: Better type safety, clearer contracts, easier validation
- **Acceptance Criteria**:
  - [ ] Validation helpers exported
  - [ ] No catchall schemas
  - [ ] Type inference works correctly
  - [ ] Tests for validation edge cases

#### **Task TS-005: Eliminate `any` and `unknown` in Error Handling**
- **Priority**: Medium
- **Category**: JavaScript/TypeScript - Type Safety
- **Problem**: Multiple catch blocks use `error instanceof Error ? error.message : String(error)` pattern losing type information
- **Location**: Throughout codebase
- **Solution**: 
  ```typescript
  // Create typed error classes
  class GameError extends Error {
    constructor(
      message: string,
      public code: string,
      public context?: Record<string, unknown>
    ) {
      super(message);
      this.name = 'GameError';
    }
  }
  
  class PersistenceError extends GameError {
    constructor(message: string, context?: Record<string, unknown>) {
      super(message, 'PERSISTENCE_ERROR', context);
      this.name = 'PersistenceError';
    }
  }
  
  // Type guard
  function isGameError(error: unknown): error is GameError {
    return error instanceof GameError;
  }
  
  // Usage
  try {
    await persistState();
  } catch (error) {
    if (isGameError(error)) {
      console.error(`[${error.code}] ${error.message}`, error.context);
    } else {
      console.error('Unknown error:', error);
    }
  }
  ```
- **Impact**: Better error tracking, clearer error handling, easier debugging
- **Acceptance Criteria**:
  - [ ] Typed error classes for domain errors
  - [ ] Type guards for narrowing
  - [ ] No loss of error context
  - [ ] Error logging improved

#### **Task TS-006: Standardize Null vs Undefined Usage**
- **Priority**: Low
- **Category**: JavaScript/TypeScript - Type Safety
- **Problem**: Mixed usage of `null` and `undefined` makes type narrowing inconsistent
- **Location**: Throughout codebase
- **Solution**: 
  - Establish convention: `undefined` for optional properties, `null` for explicit "no value" states
  - Document in style guide
  - Apply consistently:
    ```typescript
    interface GameState {
      // Optional property
      category?: string; // Use undefined
      
      // Explicit nullable state
      currentTurn: Turn | null; // Use null
    }
    ```
- **Impact**: Consistent API, easier type narrowing, clearer semantics
- **Acceptance Criteria**:
  - [ ] Convention documented in AGENTS.md
  - [ ] Existing code refactored for consistency
  - [ ] Lint rule to enforce convention
  - [ ] Tests updated

### 2.3 Code Organization

#### **Task TS-007: Extract Magic Numbers to Configuration**
- **Priority**: Low
- **Category**: JavaScript/TypeScript - Code Quality
- **Problem**: Hardcoded values like `300` (debounce), `20` (clues), `8` (max players) scattered throughout codebase
- **Location**: Various files
- **Solution**: 
  ```typescript
  // src/config/gameConfig.ts
  export const GAME_CONFIG = {
    persistence: {
      debounceMs: 300,
    },
    gameplay: {
      maxCluesPerProfile: 20,
      maxPlayers: 8,
      minPlayers: 2,
    },
    ui: {
      animationDurationMs: 300,
      toastDurationMs: 3000,
    },
  } as const;
  
  // Usage
  import { GAME_CONFIG } from '@/config/gameConfig';
  setTimeout(callback, GAME_CONFIG.persistence.debounceMs);
  ```
- **Impact**: Centralized configuration, easier to adjust, self-documenting
- **Acceptance Criteria**:
  - [ ] All magic numbers extracted
  - [ ] Config typed with `as const`
  - [ ] Single source of truth
  - [ ] Tests use config values

#### **Task TS-008: Implement ESM Import Best Practices**
- **Priority**: Low
- **Category**: JavaScript/TypeScript - Module Organization
- **Problem**: Package.json specifies `"type": "module"` but some imports don't use file extensions
- **Location**: Various imports
- **Solution**: 
  - Review ESM best practices
  - Ensure all relative imports include extensions where needed
  - Update tsconfig: `"moduleResolution": "bundler"`
  - Configure Biome to enforce
- **Impact**: Better ESM compatibility, clearer module boundaries
- **Acceptance Criteria**:
  - [ ] All imports follow ESM standards
  - [ ] Build works in pure ESM environments
  - [ ] Lint rules enforce conventions
  - [ ] No resolution warnings

---

## 3. React Patterns & Performance Issues

### 3.1 React 19 Features

#### **Task REACT-001: Migrate to useActionState for Async Mutations**
- **Priority**: High
- **Category**: React 19 Features
- **Problem**: Components use manual async state management instead of React 19's `useActionState` hook
- **Location**: `GameSetup.tsx`, `CategorySelect.tsx`, `Scoreboard.tsx`
- **Solution**: 
  ```typescript
  import { useActionState } from 'react';
  
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        await startGame(formData);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    { success: false }
  );
  
  <form action={formAction}>
    <Button type="submit" disabled={isPending}>
      {isPending ? 'Starting...' : 'Start Game'}
    </Button>
    {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
  </form>
  ```
- **Impact**: Simplified code, automatic loading states, better error handling
- **Acceptance Criteria**:
  - [ ] All async mutations use `useActionState`
  - [ ] Manual loading flags removed
  - [ ] Error handling automatic
  - [ ] Optimistic updates where appropriate

#### **Task REACT-002: Implement useOptimistic for Score Updates**
- **Priority**: Medium
- **Category**: React 19 Features / UX
- **Problem**: Score updates wait for persistence, creating perceived lag
- **Location**: `GamePlay.tsx`
- **Solution**: 
  ```typescript
  import { useOptimistic } from 'react';
  
  const [optimisticPlayers, updateOptimisticPlayers] = useOptimistic(
    players,
    (state, { playerId, points }) => 
      state.map(p => p.id === playerId 
        ? { ...p, score: p.score + points } 
        : p
      )
  );
  
  const handleAwardPoints = async (playerId: string, points: number) => {
    updateOptimisticPlayers({ playerId, points });
    await awardPoints(playerId, points);
  };
  ```
- **Impact**: Instant UI feedback, better perceived performance
- **Acceptance Criteria**:
  - [ ] Score updates appear instant
  - [ ] Rollback on error
  - [ ] No visual glitches
  - [ ] Tests verify optimistic behavior

#### **Task REACT-003: Add useTransition for Non-Urgent Updates**
- **Priority**: Medium
- **Category**: React 18+ Features
- **Problem**: Every keystroke causes synchronous state updates, potentially janking the UI
- **Location**: `GameSetup.tsx`, `CategorySelect.tsx`
- **Solution**: 
  ```typescript
  import { useTransition } from 'react';
  
  const [isPending, startTransition] = useTransition();
  
  const handleChange = (e) => {
    startTransition(() => {
      setPlayerName(e.target.value);
    });
  };
  
  <Input 
    value={playerName} 
    onChange={handleChange}
    className={isPending ? 'opacity-50' : ''}
  />
  ```
- **Impact**: Smoother typing experience, better responsiveness
- **Acceptance Criteria**:
  - [ ] Input fields remain responsive
  - [ ] No jank during typing
  - [ ] Visual feedback for pending state
  - [ ] 60fps maintained

### 3.2 Performance Optimization

#### **Task REACT-004: Optimize Zustand Store Selectors**
- **Priority**: Critical
- **Category**: State Management / Performance
- **Problem**: Components select store values without memoization, causing re-renders on any store change
- **Location**: `GamePlay.tsx` (16+ selectors), `CategorySelect.tsx`, `Scoreboard.tsx`
- **Solution**: 
  ```typescript
  import { useShallow } from 'zustand/react/shallow';
  
  // Instead of multiple selectors
  const { players, status, currentProfile, nextClue, awardPoints } = useGameStore(
    useShallow((state) => ({
      players: state.players,
      status: state.status,
      currentProfile: state.currentProfile,
      nextClue: state.nextClue,
      awardPoints: state.awardPoints,
    }))
  );
  
  // Or create custom selector hooks
  const useGamePlayState = () => useGameStore(
    useShallow((state) => ({
      players: state.players,
      status: state.status,
      currentProfile: state.currentProfile,
    }))
  );
  ```
- **Impact**: Significantly reduced re-renders, better performance
- **Acceptance Criteria**:
  - [ ] Use `useShallow` for multi-value selection
  - [ ] Custom selector hooks for common patterns
  - [ ] React DevTools shows reduced renders
  - [ ] Performance benchmarks improved

#### **Task REACT-005: Add React.memo to Pure Components**
- **Priority**: High
- **Category**: Performance
- **Problem**: Presentational components re-render unnecessarily when parent state changes
- **Location**: `ClueProgress`, `ProfileProgress`, `PreviousCluesDisplay`, `RoundSummary`
- **Solution**: 
  ```typescript
  import { memo } from 'react';
  
  export const ClueProgress = memo(({ cluesRevealed, totalClues, pointsRemaining }) => {
    // ... component logic
  }, (prevProps, nextProps) => {
    // Custom comparison if needed
    return prevProps.cluesRevealed === nextProps.cluesRevealed &&
           prevProps.totalClues === nextProps.totalClues &&
           prevProps.pointsRemaining === nextProps.pointsRemaining;
  });
  
  ClueProgress.displayName = 'ClueProgress';
  ```
- **Impact**: Fewer re-renders, smoother UI
- **Acceptance Criteria**:
  - [ ] All pure components wrapped with memo
  - [ ] Custom comparisons where appropriate
  - [ ] Display names set for debugging
  - [ ] Performance improved in Profiler

#### **Task REACT-006: Eliminate Inline Arrow Functions in JSX**
- **Priority**: Medium
- **Category**: Performance
- **Problem**: Arrow functions created inline in JSX cause child components to re-render
- **Location**: `GamePlay.tsx`, `CategorySelect.tsx`, `Scoreboard.tsx`
- **Solution**: 
  ```typescript
  // ❌ Wrong
  <Button onClick={() => handleClick(id)}>Click</Button>
  
  // ✅ Correct
  const handleButtonClick = useCallback((id: string) => {
    return () => handleClick(id);
  }, [handleClick]);
  
  <Button onClick={handleButtonClick(id)}>Click</Button>
  
  // Or use curried functions
  const handleClick = useCallback((id: string) => {
    return (event: MouseEvent) => {
      // handle click
    };
  }, []);
  ```
- **Impact**: Reduced re-renders, better memoization effectiveness
- **Acceptance Criteria**:
  - [ ] No inline arrow functions in JSX
  - [ ] All event handlers use useCallback
  - [ ] Child components memo properly
  - [ ] Profiler shows improvement

### 3.3 Error Handling & Boundaries

#### **Task REACT-007: Implement Component Error Boundaries**
- **Priority**: Critical
- **Category**: Error Handling
- **Problem**: Only global error handling exists. No granular error boundaries for component failures
- **Location**: Missing throughout application
- **Solution**: 
  ```typescript
  // src/components/ErrorBoundary.tsx
  class ErrorBoundary extends React.Component<
    PropsWithChildren<{ fallback: ReactNode }>,
    { hasError: boolean; error: Error | null }
  > {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error('ErrorBoundary caught:', error, errorInfo);
      // Log to error tracking service
    }
    
    render() {
      if (this.state.hasError) {
        return this.props.fallback;
      }
      return this.props.children;
    }
  }
  
  // Usage
  <ErrorBoundary fallback={<GameErrorFallback />}>
    <GamePlay sessionId={sessionId} />
  </ErrorBoundary>
  ```
- **Impact**: Better error UX, graceful degradation, easier debugging
- **Acceptance Criteria**:
  - [ ] Error boundaries for major sections
  - [ ] Contextual error messages
  - [ ] Error reporting integration
  - [ ] Tests for error scenarios

#### **Task REACT-008: Add Suspense Boundaries**
- **Priority**: High
- **Category**: React 18+ Features
- **Problem**: No Suspense boundaries despite using async data loading
- **Location**: Components using `useProfiles`, `useGameSession`
- **Solution**: 
  ```typescript
  import { Suspense } from 'react';
  
  // Configure React Query for Suspense
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        suspense: true,
      },
    },
  });
  
  // Add boundaries
  <Suspense fallback={<LoadingSpinner />}>
    <GamePlay sessionId={sessionId} />
  </Suspense>
  
  <Suspense fallback={<ProfilesSkeleton />}>
    <CategorySelect />
  </Suspense>
  ```
- **Impact**: Better loading UX, cleaner component code
- **Acceptance Criteria**:
  - [ ] Suspense boundaries for async components
  - [ ] Loading fallbacks appropriate
  - [ ] React Query configured for Suspense
  - [ ] Error boundaries work with Suspense

### 3.4 Navigation & Architecture

#### **Task REACT-009: Replace Window.location with Proper Navigation**
- **Priority**: High
- **Category**: Architecture / Performance
- **Problem**: Direct `window.location.href` assignments cause full page reloads, losing React state
- **Location**: `GamePlay.tsx`, `GameSetup.tsx`, `CategorySelect.tsx`, `Scoreboard.tsx`
- **Solution**: 
  ```typescript
  // Option 1: Astro View Transitions
  // In Layout.astro
  <ViewTransitions />
  
  // In components
  import { navigate } from 'astro:transitions/client';
  
  const handleNavigate = async () => {
    await forcePersist();
    navigate(`/game/${sessionId}`);
  };
  
  // Option 2: Custom navigation hook
  const useNavigation = () => {
    const navigate = useCallback(async (path: string) => {
      await forcePersist();
      // Use History API or View Transitions
      window.history.pushState({}, '', path);
      // Dispatch navigation event
    }, [forcePersist]);
    
    return { navigate };
  };
  ```
- **Impact**: SPA experience, faster navigation, preserved state
- **Acceptance Criteria**:
  - [ ] No full page reloads
  - [ ] State preserved during navigation
  - [ ] Smooth transitions
  - [ ] Back button works correctly

---

## 4. Architecture Issues

### 4.1 State Management Architecture

#### **Task ARCH-001: Refactor State Persistence to Repository Pattern**
- **Priority**: Critical
- **Category**: Architecture - Separation of Concerns
- **Problem**: `gameStore.ts` mixes business logic with persistence concerns. Persistence logic, debouncing, and IndexedDB calls tightly coupled within store
- **Location**: `src/stores/gameStore.ts`
- **Solution**: 
  ```typescript
  // src/repositories/GameSessionRepository.ts
  export class GameSessionRepository {
    constructor(private db: IDBPDatabase) {}
    
    async save(session: GameSession): Promise<void> {
      await this.db.put('sessions', session);
    }
    
    async load(sessionId: string): Promise<GameSession | null> {
      return await this.db.get('sessions', sessionId) ?? null;
    }
    
    async delete(sessionId: string): Promise<void> {
      await this.db.delete('sessions', sessionId);
    }
  }
  
  // src/services/GamePersistenceService.ts
  export class GamePersistenceService {
    private timers = new Map<string, NodeJS.Timeout>();
    
    constructor(
      private repository: GameSessionRepository,
      private debounceMs = 300
    ) {}
    
    debouncedSave(session: GameSession): void {
      this.clearTimer(session.id);
      
      const timer = setTimeout(() => {
        this.repository.save(session);
        this.timers.delete(session.id);
      }, this.debounceMs);
      
      this.timers.set(session.id, timer);
    }
    
    async forceSave(session: GameSession): Promise<void> {
      this.clearTimer(session.id);
      await this.repository.save(session);
    }
    
    private clearTimer(sessionId: string): void {
      const timer = this.timers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(sessionId);
      }
    }
  }
  
  // src/stores/gameStore.ts - simplified
  const persistenceService = new GamePersistenceService(repository);
  
  export const useGameStore = create<GameState>((set, get) => ({
    // ... state
    awardPoints: (playerId: string, points: number) => {
      set((state) => {
        // ... update state
        const newState = { ...state, /* updates */ };
        persistenceService.debouncedSave(newState);
        return newState;
      });
    },
  }));
  ```
- **Impact**: Clear separation of concerns, better testability, maintainability
- **Acceptance Criteria**:
  - [ ] Repository pattern implemented
  - [ ] Persistence service extracted
  - [ ] Store focused on state only
  - [ ] Unit tests for each layer
  - [ ] No regression in functionality

#### **Task ARCH-002: Implement Domain-Driven Design Structure**
- **Priority**: Critical
- **Category**: Architecture - Code Organization
- **Problem**: `gameStore.ts` is 597 lines with mixed concerns: state, business rules, persistence, algorithms, turn management
- **Location**: `src/stores/gameStore.ts`
- **Solution**: 
  ```
  src/domain/game/
    entities/
      Game.ts
      Round.ts
      Turn.ts
      Player.ts
      Profile.ts
    services/
      ScoringService.ts
      TurnManager.ts
      ProfileSelector.ts
      RoundPlanner.ts
    value-objects/
      Score.ts
      ClueIndex.ts
      SessionId.ts
  
  // Example: ScoringService
  export class ScoringService {
    calculatePoints(
      cluesRevealed: number,
      totalClues: number,
      basePoints: number = 20
    ): number {
      return Math.max(1, basePoints - (cluesRevealed - 1));
    }
    
    awardPoints(
      players: Player[],
      winnerId: string,
      points: number
    ): Player[] {
      return players.map(p => 
        p.id === winnerId 
          ? { ...p, score: p.score + points }
          : p
      );
    }
  }
  
  // Store becomes thin orchestration layer
  export const useGameStore = create<GameState>((set, get) => ({
    awardPoints: (playerId: string) => {
      const state = get();
      const points = scoringService.calculatePoints(
        state.currentTurn.cluesRead,
        state.currentProfile.clues.length
      );
      const updatedPlayers = scoringService.awardPoints(
        state.players,
        playerId,
        points
      );
      set({ players: updatedPlayers });
      persistenceService.debouncedSave(get());
    },
  }));
  ```
- **Impact**: Clear business logic, better testability, easier evolution
- **Acceptance Criteria**:
  - [ ] Domain layer with zero external dependencies
  - [ ] Business rules in services
  - [ ] Store delegates to domain services
  - [ ] Comprehensive unit tests for domain logic
  - [ ] Documentation of domain model

#### **Task ARCH-003: Fix Race Condition in State Rehydration**
- **Priority**: Critical
- **Category**: Architecture - Data Integrity
- **Problem**: `rehydratingSessionIds` Set and synchronous delete creates race condition. `persistState` can be called between `set()` and `delete()`
- **Location**: `src/stores/gameStore.ts`
- **Solution**: 
  ```typescript
  // Option 1: State flag approach
  interface GameState {
    isRehydrating: boolean;
    // ... other state
  }
  
  const loadFromStorage = async (sessionId: string) => {
    set({ isRehydrating: true });
    
    try {
      const loaded = await gameSessionDB.loadGame(sessionId);
      if (loaded) {
        set({ ...loaded, isRehydrating: false });
      }
    } catch (error) {
      console.error('Failed to load:', error);
      set({ isRehydrating: false });
    }
  };
  
  const persistState = (sessionId: string) => {
    const state = get();
    
    // Check rehydration flag in state
    if (state.isRehydrating) {
      return;
    }
    
    // ... persist logic
  };
  
  // Option 2: XState for lifecycle management
  const gameStateMachine = createMachine({
    initial: 'idle',
    states: {
      idle: {
        on: { LOAD: 'loading' }
      },
      loading: {
        invoke: {
          src: 'loadFromStorage',
          onDone: 'ready',
          onError: 'error'
        }
      },
      ready: {
        on: { 
          UPDATE: { actions: 'persist' }
        }
      }
    }
  });
  ```
- **Impact**: Eliminates data corruption risk, predictable state transitions
- **Acceptance Criteria**:
  - [ ] No race conditions in rapid operations
  - [ ] Integration test specifically for race condition
  - [ ] State transitions atomic
  - [ ] No data loss scenarios

#### **Task ARCH-004: Consolidate Provider Pattern**
- **Priority**: Critical
- **Category**: Architecture - Code Organization
- **Problem**: 5+ separate `*WithProvider` wrapper components create duplication and inconsistent provider hierarchy
- **Location**: `CategorySelectWithProvider.tsx`, `ScoreboardWithProvider.tsx`, `NoGamePromptWithProvider.tsx`
- **Solution**: 
  ```typescript
  // src/components/AppProviders.tsx
  export function AppProviders({ 
    children, 
    locale 
  }: PropsWithChildren<{ locale: string }>) {
    return (
      <ThemeProvider>
        <I18nProvider locale={locale}>
          <QueryProvider>
            <ErrorStateProvider>
              {children}
            </ErrorStateProvider>
          </QueryProvider>
        </I18nProvider>
      </ThemeProvider>
    );
  }
  
  // src/layouts/Layout.astro
  <AppProviders client:only="react" locale={currentLocale}>
    <slot />
  </AppProviders>
  
  // Remove all *WithProvider components
  // Components now just import and use directly
  import { CategorySelect } from '@/components/CategorySelect';
  <CategorySelect />
  ```
- **Impact**: Single source of truth, easier provider management, cleaner code
- **Acceptance Criteria**:
  - [ ] Single `AppProviders` component
  - [ ] Clear provider hierarchy documented
  - [ ] All `*WithProvider` components removed
  - [ ] No multiple QueryClient instances
  - [ ] Performance maintained or improved

#### **Task ARCH-005: Implement State Machine for Game Flow**
- **Priority**: Medium
- **Category**: Architecture - State Management
- **Problem**: Game status is simple enum but transitions scattered across actions. No visualization of valid state transitions
- **Location**: `src/stores/gameStore.ts`
- **Solution**: 
  ```typescript
  import { createMachine, interpret } from 'xstate';
  
  const gameFlowMachine = createMachine({
    id: 'gameFlow',
    initial: 'idle',
    states: {
      idle: {
        on: { 
          START_SETUP: 'playerSetup' 
        }
      },
      playerSetup: {
        on: { 
          PLAYERS_READY: 'categorySelection' 
        }
      },
      categorySelection: {
        on: { 
          CATEGORIES_SELECTED: 'playing' 
        }
      },
      playing: {
        on: {
          END_ROUND: 'roundEnd',
          END_GAME: 'gameEnd'
        }
      },
      roundEnd: {
        on: {
          NEXT_ROUND: 'playing',
          END_GAME: 'gameEnd'
        }
      },
      gameEnd: {
        type: 'final'
      }
    }
  });
  
  // Integrate with Zustand
  export const useGameStore = create<GameState>((set, get) => {
    const service = interpret(gameFlowMachine);
    service.start();
    
    return {
      // ... state
      currentState: service.state,
      
      startGame: () => {
        if (service.state.matches('categorySelection')) {
          service.send('CATEGORIES_SELECTED');
          // ... initialize game
        } else {
          throw new Error('Invalid state transition');
        }
      },
    };
  });
  ```
- **Impact**: Self-documenting, prevents invalid transitions, easier testing
- **Acceptance Criteria**:
  - [ ] State machine visualizable
  - [ ] Impossible states prevented
  - [ ] Guards for transition validation
  - [ ] Tests for all state transitions
  - [ ] Documentation of flow

### 4.2 Data Loading & Performance

#### **Task ARCH-006: Implement Progressive Data Loading**
- **Priority**: Critical
- **Category**: Architecture - Performance & Scalability
- **Problem**: All profiles for all languages loaded at once (~100+ profiles × 20 clues each). Slow on poor connections
- **Location**: `src/hooks/useProfiles.ts`, `public/data/` structure
- **Solution**: 
  ```typescript
  // 1. Split data files by category
  // public/data/{locale}/{category}.json instead of profiles.json
  
  // 2. Load on demand
  const useCategoryProfiles = (locale: string, category: string) => {
    return useQuery({
      queryKey: ['profiles', locale, category],
      queryFn: async () => {
        const response = await fetch(`/data/${locale}/${category}.json`);
        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
  
  // 3. Predictive loading
  const usePrefetchCategories = (locale: string, categories: string[]) => {
    const queryClient = useQueryClient();
    
    useEffect(() => {
      categories.forEach(category => {
        queryClient.prefetchQuery({
          queryKey: ['profiles', locale, category],
          queryFn: () => fetchCategoryProfiles(locale, category),
        });
      });
    }, [locale, categories, queryClient]);
  };
  
  // 4. Service worker background sync
  // sw.js - Cache category data on install
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('profiles-v1').then((cache) => {
        return cache.addAll([
          '/data/en/sports.json',
          '/data/en/history.json',
          // ... popular categories
        ]);
      })
    );
  });
  ```
- **Impact**: Faster initial load, lower bandwidth, better scalability
- **Acceptance Criteria**:
  - [ ] Data split by category
  - [ ] On-demand loading implemented
  - [ ] Prefetching for likely categories
  - [ ] Service worker caching strategy
  - [ ] 50%+ reduction in initial data load

#### **Task ARCH-007: Optimize Bundle Splitting**
- **Priority**: Medium
- **Category**: Architecture - Performance
- **Problem**: No explicit code splitting configuration. All React components bundled together
- **Location**: Build configuration
- **Solution**: 
  ```javascript
  // astro.config.mjs
  export default defineConfig({
    vite: {
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': [
                '@radix-ui/react-dialog',
                '@radix-ui/react-popover',
                '@radix-ui/react-label',
              ],
              'vendor-state': ['zustand', '@tanstack/react-query'],
              'vendor-utils': ['clsx', 'class-variance-authority'],
            },
          },
        },
        chunkSizeWarningLimit: 600,
      },
      plugins: [
        visualizer({ filename: './dist/stats.html' }),
      ],
    },
  });
  
  // Set budget limits
  // - Main bundle: <150KB
  // - Each island: <50KB
  // - Vendor chunks: <100KB each
  ```
- **Impact**: Faster page loads, better caching, smaller bundles
- **Acceptance Criteria**:
  - [ ] Manual chunk splitting configured
  - [ ] Bundle visualizer reports generated
  - [ ] Budget limits set and enforced
  - [ ] Documentation in BUILD.md
  - [ ] CI fails on budget violations

### 4.3 Testing Strategy

#### **Task ARCH-008: Implement Integration Testing Layer**
- **Priority**: Critical
- **Category**: Architecture - Testing
- **Problem**: Testing pyramid inverted: 21 unit tests, ~7 E2E tests, zero integration tests. Layer boundaries untested
- **Location**: Missing test directory
- **Solution**: 
  ```typescript
  // src/**/__integration__/*.test.ts structure
  
  // Store + IndexedDB integration
  describe('GameStore + IndexedDB Integration', () => {
    let db: IDBPDatabase;
    
    beforeEach(async () => {
      db = await openDB('test-db', 1, {
        upgrade(db) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        },
      });
    });
    
    it('should persist game state to real IndexedDB', async () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.createGame(/* ... */);
      });
      
      // Wait for debounced persistence
      await waitFor(() => {
        expect(db.get('sessions', result.current.id)).resolves.toBeDefined();
      });
      
      const saved = await db.get('sessions', result.current.id);
      expect(saved.players).toEqual(result.current.players);
    });
  });
  
  // Component + Store integration
  describe('GamePlay + Store Integration', () => {
    it('should update store when awarding points', async () => {
      const { getByText } = render(<GamePlay sessionId="test" />);
      
      const playerButton = getByText('Player 1');
      await userEvent.click(playerButton);
      
      // Verify store updated
      expect(useGameStore.getState().players[0].score).toBe(20);
    });
  });
  
  // Query + Store integration
  describe('Profile Loading + Game Creation', () => {
    it('should load profiles and create game', async () => {
      const { result: profilesResult } = renderHook(() => useProfiles('en'));
      await waitFor(() => expect(profilesResult.current.data).toBeDefined());
      
      const { result: storeResult } = renderHook(() => useGameStore());
      act(() => {
        storeResult.current.createGame({
          players: [/* ... */],
          categories: ['sports'],
          profiles: profilesResult.current.data,
        });
      });
      
      expect(storeResult.current.status).toBe('active');
    });
  });
  ```
- **Impact**: Catch integration bugs, confidence in layer boundaries
- **Acceptance Criteria**:
  - [ ] 50+ integration tests added
  - [ ] Store + persistence tested with real DB
  - [ ] Component + store integration tested
  - [ ] Query + store integration tested
  - [ ] 15% of overall test suite

#### **Task ARCH-009: Implement Architectural Fitness Functions**
- **Priority**: Medium
- **Category**: Architecture - Quality Assurance
- **Problem**: No automated checks for architectural rules. Architecture degrades over time
- **Location**: Missing lint rules and tests
- **Solution**: 
  ```javascript
  // .eslintrc.cjs or biome.json
  {
    "plugins": ["boundaries"],
    "settings": {
      "boundaries/elements": [
        {
          "type": "domain",
          "pattern": "src/domain/**",
          "mode": "full"
        },
        {
          "type": "infrastructure",
          "pattern": "src/{lib,repositories}/**"
        },
        {
          "type": "application",
          "pattern": "src/{stores,hooks}/**"
        },
        {
          "type": "presentation",
          "pattern": "src/components/**"
        }
      ],
      "boundaries/ignore": ["**/*.test.ts"]
    },
    "rules": {
      "boundaries/element-types": [
        "error",
        {
          "default": "disallow",
          "rules": [
            {
              "from": "domain",
              "disallow": ["infrastructure", "application", "presentation"]
            },
            {
              "from": "presentation",
              "disallow": ["infrastructure"]
            }
          ]
        }
      ]
    }
  }
  
  // tests/architecture.test.ts
  import { Project } from 'ts-morph';
  
  describe('Architecture Rules', () => {
    let project: Project;
    
    beforeAll(() => {
      project = new Project({ tsConfigFilePath: './tsconfig.json' });
    });
    
    it('domain layer should not import from infrastructure', () => {
      const domainFiles = project.getSourceFiles('src/domain/**/*.ts');
      
      domainFiles.forEach(file => {
        const imports = file.getImportDeclarations();
        imports.forEach(imp => {
          const path = imp.getModuleSpecifierValue();
          expect(path).not.toMatch(/^(@\/)?lib/);
          expect(path).not.toMatch(/^(@\/)?repositories/);
        });
      });
    });
    
    it('should not have circular dependencies', () => {
      // Use madge or similar to detect cycles
    });
  });
  ```
- **Impact**: Prevent architecture drift, faster code reviews, self-documenting
- **Acceptance Criteria**:
  - [ ] Eslint-plugin-boundaries configured
  - [ ] Architectural tests passing
  - [ ] CI enforces rules
  - [ ] Documentation in ADRs

### 4.4 Configuration & Deployment

#### **Task ARCH-010: Clarify SSR vs SSG Strategy**
- **Priority**: Medium
- **Category**: Architecture - Configuration
- **Problem**: Configuration mismatch: `output: 'server'` with Cloudflare adapter but pages use `prerender: true`. PRD states "SSG"
- **Location**: `astro.config.mjs`
- **Solution**: 
  ```javascript
  // Option 1: Pure SSG (recommended if no SSR needed)
  export default defineConfig({
    output: 'static',
    adapter: cloudflare(), // Remove if pure SSG
    // ... rest of config
  });
  
  // Option 2: Hybrid (if future SSR features planned)
  export default defineConfig({
    output: 'hybrid',
    adapter: cloudflare(),
    // ... rest of config
  });
  // Mark SSR routes explicitly:
  // export const prerender = false;
  
  // Document decision in ARCHITECTURE.md
  ```
- **Impact**: Simpler deployment, better performance, clearer architecture
- **Acceptance Criteria**:
  - [ ] Audit actual SSR requirements
  - [ ] Choose appropriate output mode
  - [ ] Update deployment strategy
  - [ ] Document decision in ADR
  - [ ] Remove unused adapter if not needed

#### **Task ARCH-011: Implement Build-Time Configuration Management**
- **Priority**: Low
- **Category**: Architecture - Configuration
- **Problem**: No environment-specific configuration strategy. Values hardcoded in astro.config.mjs
- **Location**: Various config files
- **Solution**: 
  ```typescript
  // src/config/index.ts
  import { z } from 'zod';
  
  const configSchema = z.object({
    env: z.enum(['development', 'staging', 'production']),
    pwa: z.object({
      name: z.string(),
      themeColor: z.string(),
      backgroundColor: z.string(),
    }),
    indexedDB: z.object({
      name: z.string(),
      version: z.number(),
    }),
    features: z.object({
      enableAnalytics: z.boolean(),
      enableErrorTracking: z.boolean(),
    }),
  });
  
  export const config = configSchema.parse({
    env: import.meta.env.MODE,
    pwa: {
      name: import.meta.env.PUBLIC_APP_NAME ?? 'Perfil',
      themeColor: import.meta.env.PUBLIC_THEME_COLOR ?? '#F7CF2E',
      backgroundColor: import.meta.env.PUBLIC_BG_COLOR ?? '#F5F5F5',
    },
    indexedDB: {
      name: import.meta.env.PUBLIC_DB_NAME ?? 'perfil-db',
      version: 1,
    },
    features: {
      enableAnalytics: import.meta.env.PUBLIC_ANALYTICS === 'true',
      enableErrorTracking: import.meta.env.PUBLIC_ERROR_TRACKING === 'true',
    },
  });
  
  // astro.config.mjs
  import { config } from './src/config';
  
  export default defineConfig({
    // ... other config
    integrations: [
      AstroPWA({
        manifest: {
          name: config.pwa.name,
          theme_color: config.pwa.themeColor,
          background_color: config.pwa.backgroundColor,
        },
      }),
    ],
  });
  
  // .env.example, .env.production, etc.
  ```
- **Impact**: Multi-environment support, easier testing, deployment flexibility
- **Acceptance Criteria**:
  - [ ] Centralized config with Zod validation
  - [ ] Environment variables documented
  - [ ] .env.example provided
  - [ ] IndexedDB name configurable for testing
  - [ ] Documentation in CONFIGURATION.md

### 4.5 Cross-Cutting Concerns

#### **Task ARCH-012: Implement Centralized Error Architecture**
- **Priority**: Medium
- **Category**: Architecture - Error Handling
- **Problem**: Error handling fragmented: ErrorStateProvider, store error state, component throws. No clear strategy
- **Location**: Throughout codebase
- **Solution**: 
  ```typescript
  // src/errors/index.ts
  export class GameError extends Error {
    constructor(
      message: string,
      public code: string,
      public severity: 'fatal' | 'recoverable',
      public context?: Record<string, unknown>
    ) {
      super(message);
      this.name = 'GameError';
    }
  }
  
  export class PersistenceError extends GameError {
    constructor(message: string, context?: Record<string, unknown>) {
      super(message, 'PERSISTENCE_ERROR', 'recoverable', context);
    }
  }
  
  export class ProfileLoadError extends GameError {
    constructor(message: string, context?: Record<string, unknown>) {
      super(message, 'PROFILE_LOAD_ERROR', 'fatal', context);
    }
  }
  
  // src/services/ErrorService.ts
  export class ErrorService {
    private static instance: ErrorService;
    
    private constructor() {}
    
    static getInstance(): ErrorService {
      if (!ErrorService.instance) {
        ErrorService.instance = new ErrorService();
      }
      return ErrorService.instance;
    }
    
    logError(error: GameError): void {
      console.error(`[${error.code}] ${error.message}`, error.context);
      
      // Send to error tracking service
      if (config.features.enableErrorTracking) {
        // Sentry.captureException(error);
      }
    }
    
    handleError(error: GameError): void {
      this.logError(error);
      
      if (error.severity === 'fatal') {
        // Show error page
        window.location.href = '/error';
      } else {
        // Show toast notification
        // toast.error(error.message);
      }
    }
  }
  
  // Hierarchical error boundaries
  // Global: catches app crashes
  <GlobalErrorBoundary>
    {/* Route: catches route errors */}
    <RouteErrorBoundary>
      {/* Component: catches component errors */}
      <ComponentErrorBoundary>
        <GamePlay />
      </ComponentErrorBoundary>
    </RouteErrorBoundary>
  </GlobalErrorBoundary>
  ```
- **Impact**: Better error UX, easier debugging, error analytics
- **Acceptance Criteria**:
  - [ ] Typed error classes for domain errors
  - [ ] Centralized error service
  - [ ] Hierarchical error boundaries
  - [ ] Error reporting integration (optional)
  - [ ] Documentation in ERROR_HANDLING.md

#### **Task ARCH-013: Implement Observability Architecture**
- **Priority**: Medium
- **Category**: Architecture - Monitoring
- **Problem**: No observability in production: no performance monitoring, error tracking, or analytics
- **Location**: Missing infrastructure
- **Solution**: 
  ```typescript
  // src/services/TelemetryService.ts
  export class TelemetryService {
    trackEvent(event: string, properties?: Record<string, unknown>): void {
      if (!config.features.enableAnalytics) return;
      
      // Use navigator.sendBeacon for reliability
      const data = JSON.stringify({
        event,
        properties,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
      });
      
      navigator.sendBeacon('/api/analytics', data);
    }
    
    trackPerformance(metric: string, value: number): void {
      console.log(`[Performance] ${metric}: ${value}ms`);
      
      // Send to monitoring service
      this.trackEvent('performance', { metric, value });
    }
  }
  
  // src/hooks/useWebVitals.ts
  import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
  
  export const useWebVitals = () => {
    const telemetry = useTelemetry();
    
    useEffect(() => {
      onCLS((metric) => telemetry.trackPerformance('CLS', metric.value));
      onFID((metric) => telemetry.trackPerformance('FID', metric.value));
      onFCP((metric) => telemetry.trackPerformance('FCP', metric.value));
      onLCP((metric) => telemetry.trackPerformance('LCP', metric.value));
      onTTFB((metric) => telemetry.trackPerformance('TTFB', metric.value));
    }, [telemetry]);
  };
  
  // Track game events
  const telemetry = useTelemetry();
  
  const handleStartGame = () => {
    telemetry.trackEvent('game_started', {
      players: players.length,
      categories: selectedCategories,
      rounds: roundsPerCategory,
    });
  };
  
  // Structured logging
  import pino from 'pino';
  
  const logger = pino({
    level: config.env === 'production' ? 'info' : 'debug',
  });
  
  logger.info({ event: 'game_created', sessionId }, 'Game session created');
  ```
- **Impact**: Production debugging, performance insights, data-driven decisions
- **Acceptance Criteria**:
  - [ ] Web Vitals tracking implemented
  - [ ] Custom event tracking for game actions
  - [ ] Structured logging in place
  - [ ] Error tracking integrated
  - [ ] Documentation in OBSERVABILITY.md

---

## 5. Astro Framework Issues

### 5.1 Hydration & Performance

#### **Task ASTRO-001: Replace Excessive client:only with Strategic Hydration**
- **Priority**: Critical  
- **Category**: Astro - Hydration Strategy
- **Problem**: Every React component uses `client:only="react"`, forcing full client-side rendering, defeating Astro's zero-JS philosophy
- **Location**: `Layout.astro`, all page files
- **Solution**:
  ```astro
  <!-- Use strategic hydration directives -->
  <ThemeSwitcher client:idle />         <!-- Load when idle -->
  <LanguageSwitcher client:idle />      <!-- Load when idle -->
  <GamePlay client:load sessionId={id} /> <!-- Critical path -->
  <PwaUpdater client:idle />             <!-- Background -->
  ```
- **Impact**: 30-40% reduction in initial JavaScript, better TTI, progressive enhancement
- **Acceptance Criteria**:
  - [ ] Maximum 2-3 `client:only` directives per page
  - [ ] Switchers use `client:idle`
  - [ ] Core game uses `client:load`
  - [ ] Lighthouse JavaScript metric improves by 25%+

#### **Task ASTRO-002: Implement View Transitions API**
- **Priority**: Critical
- **Category**: Astro - Navigation & UX  
- **Problem**: `window.location.href` navigation causes full page reloads, losing React state
- **Location**: `Layout.astro`, navigation in components
- **Solution**:
  ```astro
  <!-- Layout.astro -->
  import { ViewTransitions } from 'astro:transitions';
  <head>
    <ViewTransitions />
  </head>
  ```
  ```typescript
  // Components
  import { navigate } from 'astro:transitions/client';
  await forcePersist();
  navigate(`/game/${sessionId}`);
  ```
- **Impact**: SPA-like experience, smooth transitions, no flicker, state preservation
- **Acceptance Criteria**:
  - [ ] View Transitions added to layout
  - [ ] All `window.location` replaced with `navigate()`
  - [ ] Smooth transitions between routes
  - [ ] No visual flicker

### 5.2 Server Architecture

#### **Task ASTRO-003: Implement Astro Middleware**
- **Priority**: Critical
- **Category**: Astro - Middleware & Operations
- **Problem**: No middleware for logging, security headers, or error handling
- **Location**: Missing `src/middleware.ts`
- **Solution**:
  ```typescript
  // src/middleware.ts
  import { defineMiddleware } from 'astro:middleware';
  
  export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'"
    );
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[${new Date().toISOString()}] ${context.request.method} ${context.url.pathname}`);
    }
    
    // Track error pages
    if (response.status === 404 || response.status === 500) {
      console.warn(`Error ${response.status}: ${context.url.pathname}`);
    }
    
    return response;
  });
  ```
- **Advanced Patterns**:
  ```typescript
  // Conditional middleware for specific routes
  export const onRequest = defineMiddleware(async (context, next) => {
    // Admin route protection
    if (context.url.pathname.startsWith('/admin')) {
      const auth = context.request.headers.get('authorization');
      if (!auth) {
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
    // CORS headers for API routes
    if (context.url.pathname.startsWith('/api')) {
      const response = await next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    
    return next();
  });
  ```
- **Impact**: Security headers, request logging, centralized error handling
- **Acceptance Criteria**:
  - [ ] Middleware file created and registered
  - [ ] Security headers added to all responses
  - [ ] Request logging implemented
  - [ ] Error pages routed through middleware
  - [ ] No performance regression

#### **Task ASTRO-004: Implement Astro Actions for Server Operations**
- **Priority**: Critical
- **Category**: Astro - Server Operations
- **Problem**: No type-safe server operations. All data loading is client-side fetch
- **Location**: Missing `src/actions/` directory
- **Solution**:
  ```typescript
  // src/actions/game.ts
  import { defineAction } from 'astro:actions';
  import { z } from 'astro:schema';
  import { gameSessionDB } from '@/lib/gameSessionDB';
  
  export const server = {
    // Type-safe server function
    loadGameSession: defineAction({
      input: z.object({
        sessionId: z.string().uuid(),
      }),
      handler: async ({ sessionId }) => {
        try {
          // This runs only on server - never sent to client
          const session = await gameSessionDB.loadGame(sessionId);
          
          if (!session) {
            throw new Error('Session not found');
          }
          
          return session;
        } catch (error) {
          throw new Error(`Failed to load session: ${error}`);
        }
      },
    }),
    
    // Save game state
    saveGameSession: defineAction({
      input: z.object({
        sessionId: z.string().uuid(),
        state: z.record(z.unknown()),
      }),
      handler: async ({ sessionId, state }) => {
        try {
          await gameSessionDB.saveGame(sessionId, state);
          return { success: true };
        } catch (error) {
          throw new Error(`Failed to save session: ${error}`);
        }
      },
    }),
  };
  ```
  ```typescript
  // React component using actions
  import { server } from '@/actions/game';
  
  export function GamePlay({ sessionId }) {
    const [gameState, setGameState] = useState(null);
    
    useEffect(() => {
      // Type-safe server call
      const loadGame = async () => {
        try {
          const result = await server.loadGameSession.orThrow({ sessionId });
          setGameState(result);
        } catch (error) {
          console.error('Failed to load game:', error);
        }
      };
      
      loadGame();
    }, [sessionId]);
    
    // Persist changes
    const handleSave = async () => {
      try {
        await server.saveGameSession.orThrow({
          sessionId,
          state: gameState,
        });
      } catch (error) {
        console.error('Failed to save:', error);
      }
    };
  }
  ```
- **Benefits**:
  - Type-safe client-server communication
  - Server secrets never sent to client
  - Validation at request boundary
  - Simplified error handling
  - Built-in caching support
- **Acceptance Criteria**:
  - [ ] Actions directory created
  - [ ] Load and save operations defined
  - [ ] Type safety verified in components
  - [ ] Error handling working
  - [ ] Secrets protected (no exposure)
  - [ ] Performance acceptable

#### **Task ASTRO-005: Implement Error Pages (404, 500)**
- **Priority**: High
- **Category**: Astro - Error Handling
- **Problem**: No custom error pages. Default Astro error pages shown
- **Location**: Missing `src/pages/404.astro`, `src/pages/500.astro`
- **Solution**:
  ```astro
  <!-- src/pages/404.astro -->
  ---
  import Layout from '@/layouts/Layout.astro';
  
  Astro.response.status = 404;
  ---
  
  <Layout title="Page Not Found - Perfil">
    <div class="min-h-main flex items-center justify-center p-4">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">404</h1>
        <p class="text-xl text-muted-foreground mb-6">
          The page you're looking for doesn't exist
        </p>
        <a href="/" class="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Return Home
        </a>
      </div>
    </div>
  </Layout>
  ```
  ```astro
  <!-- src/pages/500.astro -->
  ---
  import Layout from '@/layouts/Layout.astro';
  
  Astro.response.status = 500;
  ---
  
  <Layout title="Server Error - Perfil">
    <div class="min-h-main flex items-center justify-center p-4">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">500</h1>
        <p class="text-xl text-muted-foreground mb-6">
          Something went wrong on our end. Please try again later.
        </p>
        <a href="/" class="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Return Home
        </a>
      </div>
    </div>
  </Layout>
  ```
- **Acceptance Criteria**:
  - [ ] 404 page created and styled
  - [ ] 500 error page created
  - [ ] Proper HTTP status codes set
  - [ ] User can navigate back to game
  - [ ] Responsive on mobile/desktop

#### **Task ASTRO-006: Implement Astro Error Boundary for Islands**
- **Priority**: High
- **Category**: Astro - Error Handling
- **Problem**: Islands can crash individually; no isolation
- **Location**: Pages with interactive islands
- **Solution**:
  ```astro
  <!-- src/components/IslandErrorBoundary.astro -->
  ---
  import type { HTMLAttributes } from 'astro/types';
  
  interface Props extends HTMLAttributes<'div'> {
    fallback?: string;
  }
  
  const { fallback = 'Failed to load component' } = Astro.props;
  ---
  
  <div
    data-component-boundary
    data-fallback={fallback}
  >
    <slot />
    <script>
      // Client-side error boundary for this island
      const boundary = document.currentScript?.previousElementSibling;
      if (!boundary) return;
      
      const handleError = (event: ErrorEvent) => {
        console.error('Island error:', event.error);
        boundary.innerHTML = `<div class="p-4 bg-red-50 text-red-900 rounded">${boundary.dataset.fallback}</div>`;
      };
      
      window.addEventListener('error', handleError);
    </script>
  </div>
  ```
  ```astro
  <!-- Usage in pages -->
  <IslandErrorBoundary fallback="Failed to load game">
    <GamePlay client:load sessionId={sessionId} />
  </IslandErrorBoundary>
  ```
- **Acceptance Criteria**:
  - [ ] Error boundary component created
  - [ ] Islands wrapped in boundaries
  - [ ] Fallback UI displayed on error
  - [ ] Error logged but page continues
  - [ ] Error recovery possible

### 5.3 SEO & Metadata

#### **Task ASTRO-007: Implement Comprehensive SEO & Structured Data**
- **Priority**: High
- **Category**: Astro - SEO & Metadata
- **Problem**: No SEO headers, Open Graph tags, JSON-LD, or canonical URLs
- **Location**: `Layout.astro`, individual pages
- **Solution**:
  ```astro
  <!-- src/components/SEO.astro -->
  ---
  import type { ImageMetadata } from 'astro';
  
  interface Props {
    title: string;
    description: string;
    image?: string;
    canonical?: string;
    ogType?: string;
    twitterHandle?: string;
  }
  
  const {
    title,
    description,
    image = '/og-image.png',
    canonical,
    ogType = 'website',
    twitterHandle = '@perfilgame',
  } = Astro.props;
  
  const siteUrl = 'https://perfil.game';
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : Astro.url.href;
  ---
  
  <!-- Primary Meta Tags -->
  <meta name="title" content={title} />
  <meta name="description" content={description} />
  <meta name="canonical" href={canonicalUrl} />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={ogType} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={canonicalUrl} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={image} />
  <meta name="twitter:creator" content={twitterHandle} />
  ```
  ```astro
  <!-- src/layouts/Layout.astro - Updated -->
  ---
  import SEO from '@/components/SEO.astro';
  
  interface Props {
    title?: string;
    description?: string;
    image?: string;
  }
  
  const {
    title = 'Perfil - Trivia Game',
    description = 'Multiplayer trivia game where players guess profiles through clues',
    image = '/og-image.png',
  } = Astro.props;
  ---
  
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width" />
      <SEO
        title={title}
        description={description}
        image={image}
        canonical={Astro.url.pathname}
      />
      <!-- ... rest of head -->
    </head>
    <!-- ... -->
  </html>
  ```
- **Structured Data**:
  ```astro
  <!-- src/components/StructuredData.astro -->
  ---
  interface Props {
    type: 'Game' | 'Organization' | 'WebApplication';
    data: Record<string, any>;
  }
  
  const { type, data } = Astro.props;
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
  ---
  
  <script
    type="application/ld+json"
    set:html={JSON.stringify(structuredData)}
  />
  ```
  ```astro
  <!-- Usage on game page -->
  <StructuredData
    type="WebApplication"
    data={{
      name: 'Perfil',
      description: 'Multiplayer trivia game',
      url: 'https://perfil.game',
      applicationCategory: 'GameApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }}
  />
  ```
- **Acceptance Criteria**:
  - [ ] SEO component implemented and used
  - [ ] All pages have proper meta tags
  - [ ] Open Graph tags for social sharing
  - [ ] JSON-LD structured data added
  - [ ] Canonical URLs set
  - [ ] Rich snippets appearing in search results

#### **Task ASTRO-008: Generate Sitemap & Robots.txt**
- **Priority**: High
- **Category**: Astro - SEO Infrastructure
- **Problem**: No sitemap or robots.txt for search engine discovery
- **Location**: Missing build output
- **Solution**:
  ```bash
  # Install Astro sitemap integration
  npm install @astrojs/sitemap
  ```
  ```javascript
  // astro.config.mjs
  import sitemap from '@astrojs/sitemap';
  
  export default defineConfig({
    site: 'https://perfil.game',
    integrations: [
      sitemap({
        // Route filtering
        filter: (page) => !page.includes('/admin'),
      }),
      // ... other integrations
    ],
  });
  ```
  ```txt
  # public/robots.txt
  User-agent: *
  Allow: /
  
  User-agent: *
  Disallow: /admin
  Disallow: /api
  
  Sitemap: https://perfil.game/sitemap-index.xml
  ```
- **Acceptance Criteria**:
  - [ ] `@astrojs/sitemap` installed
  - [ ] `site` configured in astro.config.mjs
  - [ ] Sitemap generated at build time
  - [ ] robots.txt configured
  - [ ] Search engines can discover all pages
  - [ ] No admin/private routes in sitemap

### 5.4 Rendering Strategy & Configuration

#### **Task ASTRO-009: Clarify and Document Rendering Strategy**
- **Priority**: High
- **Category**: Astro - Configuration & Documentation
- **Problem**: Configuration inconsistent: `output: 'server'` with `prerender: true` on pages. Strategy unclear
- **Location**: `astro.config.mjs`, pages with `prerender: true`
- **Current State**:
  ```javascript
  // astro.config.mjs
  export default defineConfig({
    output: 'server',  // <-- Server-rendered mode
    adapter: cloudflare(),
  });
  
  // But pages use:
  export const prerender = true;  // <-- Static generation
  ```
- **Analysis & Decision**:
  - **Option 1: Pure SSG (Recommended)**
    ```javascript
    export default defineConfig({
      output: 'static',  // All pages static
      adapter: cloudflare(),  // For CDN deployment
    });
    // Remove all `prerender: true` statements
    ```
    - Best for: Trivia content, user sessions stored in IndexedDB
    - Deploy to: Cloudflare Workers (static asset serving)
    
  - **Option 2: Hybrid (Future-proofing)**
    ```javascript
    export default defineConfig({
      output: 'hybrid',  // Mix SSG and SSR
    });
    // Keep prerender: true on static pages
    // Use prerender: false on dynamic future routes
    ```
    - Best for: If future server-side features needed
    - Trade-off: More complex deployment
    
  - **Option 3: Pure SSR**
    ```javascript
    export default defineConfig({
      output: 'server',  // All pages server-rendered
    });
    // Remove all `prerender: true`
    ```
    - Best for: Real-time features (not needed now)
    - Impact: Higher infrastructure costs

- **Recommendation**: **Option 1 - Pure SSG**
  - All content pre-renders at build time
  - Deploy to Cloudflare CDN for global edge caching
  - User sessions stored client-side in IndexedDB
  - Better performance and cost efficiency

- **Solution**:
  ```javascript
  // astro.config.mjs - Pure SSG
  export default defineConfig({
    output: 'static',  // Static Site Generation
    adapter: cloudflare(),
    site: 'https://perfil.game',
    
    vite: {
      // ... rest of config
    },
  });
  ```
  ```markdown
  # ARCHITECTURE.md - Add rendering documentation
  
  ## Rendering Strategy: Static Site Generation (SSG)
  
  ### Why SSG?
  - All game content is static (profiles, categories)
  - User sessions stored client-side (IndexedDB)
  - No server-side computation required
  - Optimal for Cloudflare CDN deployment
  
  ### Page Generation
  - All pages pre-rendered at build time
  - Dynamic segments handled via static params
  - No runtime server needed (Cloudflare Workers only)
  
  ### Deployment
  - Pages: Cloudflare CDN
  - Static assets: Cloudflare Workers cache
  - Service Worker: Offline-first caching strategy
  
  ### Future SSR Needs
  - If real-time multiplayer needed: Switch to Astro Hybrid
  - If server-side analytics needed: Add API routes
  ```
- **Acceptance Criteria**:
  - [ ] `output: 'static'` configured
  - [ ] All pages pre-render successfully
  - [ ] Build time < 5 seconds
  - [ ] No runtime errors in deployment
  - [ ] Rendering strategy documented
  - [ ] Page deployment verified

#### **Task ASTRO-010: Implement Performance Budgets & Build Monitoring**
- **Priority**: Medium
- **Category**: Astro - Configuration & Performance
- **Problem**: No build-time performance budgets or monitoring
- **Location**: `astro.config.mjs`, CI/CD pipeline
- **Solution**:
  ```javascript
  // astro.config.mjs - Add build optimization
  export default defineConfig({
    // ... other config
    build: {
      inlineStylesheets: 'auto',  // Inline critical CSS
      concurrency: 4,              // Parallel build optimization
    },
    
    vite: {
      build: {
        // Enforce bundle size budgets
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-core': ['react', 'react-dom'],
            },
          },
        },
      },
      // Performance monitoring
      plugins: [
        {
          name: 'build-performance',
          apply: 'build',
          enforce: 'post',
          generateBundle(options, bundle) {
            let totalSize = 0;
            const report = [];
            
            for (const [name, asset] of Object.entries(bundle)) {
              if (asset.type === 'asset' && typeof asset.source === 'string') {
                const size = new TextEncoder().encode(asset.source).length;
                totalSize += size;
                
                if (size > 100000) {
                  report.push(`⚠️  ${name}: ${(size / 1024).toFixed(2)}KB (LARGE)`);
                } else if (size > 50000) {
                  report.push(`📦 ${name}: ${(size / 1024).toFixed(2)}KB`);
                }
              }
            }
            
            console.log('\n📊 Build Performance Report:');
            console.log(`Total size: ${(totalSize / 1024).toFixed(2)}KB`);
            report.forEach(r => console.log(r));
          },
        },
      ],
    },
  });
  ```
  ```yaml
  # .github/workflows/ci.yml - Add build budget check
  - name: Check Build Performance
    run: |
      npm run build
      
      # Check total build size
      BUILD_SIZE=$(du -sh dist | cut -f1)
      echo "Build size: $BUILD_SIZE"
      
      # Fail if exceeds budget
      if [ "$(du -sb dist | cut -f1)" -gt 5242880 ]; then
        echo "❌ Build size exceeds 5MB budget"
        exit 1
      fi
  ```
- **Acceptance Criteria**:
  - [ ] Build budget configured
  - [ ] Performance report generated
  - [ ] CI checks bundle size
  - [ ] Large assets identified
  - [ ] Build size monitoring in place

### 5.5 Static Assets & Image Optimization

#### **Task ASTRO-011: Implement Image Component & Optimization**
- **Priority**: Medium
- **Category**: Astro - Assets & Performance
- **Problem**: Manual img tags without optimization. SVG and PNG assets not optimized
- **Location**: `src/components/`, `public/icons/`
- **Current Issues**:
  - Static SVG images (background.svg, astro.svg) not optimized
  - PWA icons (512x512 PNG) unoptimized (~223KB each)
  - No responsive image strategy
  - No WebP fallback
- **Solution**:
  ```typescript
  // src/components/OptimizedImage.astro
  ---
  import type { ImageMetadata } from 'astro';
  import { Image } from 'astro:assets';
  
  interface Props {
    src: ImageMetadata;
    alt: string;
    title?: string;
    loading?: 'lazy' | 'eager';
    fetchpriority?: 'high' | 'low';
  }
  
  const {
    src,
    alt,
    title,
    loading = 'lazy',
    fetchpriority = 'low',
  } = Astro.props;
  ---
  
  <Image
    {src}
    {alt}
    {title}
    {loading}
    fetchpriority={fetchpriority}
    densities={[1.5, 2]}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    quality="webp"
  />
  ```
  ```astro
  <!-- Usage in components -->
  <OptimizedImage
    src={backgroundImg}
    alt="Game background"
    loading="eager"
    fetchpriority="high"
  />
  ```
- **PWA Icon Optimization**:
  ```bash
  # Install image optimization tools
  npm install --save-dev sharp
  
  # Add to build process
  # scripts/optimize-icons.js
  ```
  ```javascript
  // scripts/optimize-icons.js
  import sharp from 'sharp';
  
  async function optimizeIcons() {
    const sizes = [192, 512];
    
    for (const size of sizes) {
      // Optimize PNG
      await sharp(`public/icons/icon-${size}x${size}.png`)
        .png({ quality: 80 })
        .toFile(`public/icons/icon-${size}x${size}-opt.png`);
      
      // Generate WebP
      await sharp(`public/icons/icon-${size}x${size}.png`)
        .webp({ quality: 75 })
        .toFile(`public/icons/icon-${size}x${size}.webp`);
    }
    
    console.log('Icons optimized!');
  }
  
  optimizeIcons().catch(console.error);
  ```
- **Acceptance Criteria**:
  - [ ] Image component created
  - [ ] All images use Astro Image component
  - [ ] WebP format with PNG fallback
  - [ ] Icons compressed (<50KB each)
  - [ ] Responsive sizes configured
  - [ ] No performance regression

### 5.6 Routing & Dynamic Routes

#### **Task ASTRO-012: Implement Dynamic Route Prerendering**
- **Priority**: Medium
- **Category**: Astro - Routing
- **Problem**: Dynamic routes `[sessionId]` may not prerender properly if no static routes defined
- **Location**: `src/pages/game/[sessionId].astro`, `src/pages/game-setup/[sessionId].astro`
- **Solution**:
  ```astro
  <!-- src/pages/game/[sessionId].astro -->
  ---
  import { GamePlay } from '@/components/GamePlay';
  import Layout from '@/layouts/Layout.astro';
  
  // Define static paths for prerendering
  export async function getStaticPaths() {
    // Option 1: Generate demo/example sessions
    const demoSessions = [
      { sessionId: 'demo-session-1' },
      { sessionId: 'demo-session-2' },
    ];
    
    // Option 2: Load from data file
    // const sessions = await loadSessionsFromFile();
    
    return demoSessions.map(({ sessionId }) => ({
      params: { sessionId },
    }));
  }
  
  const { sessionId } = Astro.params;
  
  if (!sessionId) {
    return Astro.redirect('/');
  }
  ---
  
  <Layout title="Perfil - Game Session">
    <GamePlay client:load sessionId={sessionId} />
  </Layout>
  ```
  ```typescript
  // Alternative: Fallback rendering
  export async function getStaticPaths() {
    return {
      paths: [
        { params: { sessionId: 'demo' } },
      ],
      fallback: 'route',  // Generate on-demand, cache subsequent requests
    };
  }
  ```
- **Acceptance Criteria**:
  - [ ] getStaticPaths implemented
  - [ ] Demo sessions prerendered
  - [ ] Dynamic routes work with fallback
  - [ ] Build completes without errors
  - [ ] Session routes accessible

### 5.7 Integration Patterns

#### **Task ASTRO-013: Properly Structure Astro + React Integration**
- **Priority**: Medium
- **Category**: Astro - Integration Patterns
- **Problem**: React used as full-page replacements rather than islands
- **Location**: All page files
- **Current Anti-Pattern**:
  ```astro
  <!-- game/[sessionId].astro - WRONG: React replaces everything -->
  <GamePlay client:only="react" sessionId={sessionId} />
  ```
- **Correct Pattern**:
  ```astro
  <!-- game/[sessionId].astro - CORRECT: Astro handles layout, React is island -->
  ---
  import GamePlayIsland from '@/components/GamePlay';
  import Layout from '@/layouts/Layout.astro';
  
  const { sessionId } = Astro.params;
  ---
  
  <Layout title="Game - {sessionId}">
    <!-- Astro-rendered static content -->
    <div class="game-container">
      <!-- Static header -->
      <header>
        <h1>Game Session: {sessionId}</h1>
      </header>
      
      <!-- React island -->
      <GamePlayIsland client:load sessionId={sessionId} />
    </div>
  </Layout>
  ```
- **Benefits**:
  - Clearer architecture
  - Static content serves immediately
  - React only loads for interactivity
  - Better SEO
  - Improved performance
- **Acceptance Criteria**:
  - [ ] Clear separation between static and interactive content
  - [ ] Astro handles page chrome/layout
  - [ ] React used only for interactive sections
  - [ ] Static content in HTML immediately
  - [ ] No provider cascade

### 5.8 Documentation

#### **Task ASTRO-014: Document Astro Architecture & Patterns**
- **Priority**: Medium
- **Category**: Astro - Documentation
- **Problem**: No documentation of Astro-specific patterns, hydration strategy, or routing
- **Location**: Missing `docs/ASTRO_ARCHITECTURE.md`
- **Solution**:
  ```markdown
  # docs/ASTRO_ARCHITECTURE.md
  
  ## Astro Architecture Overview
  
  ### Core Principles
  - Server-first rendering (SSG)
  - Islands of interactivity (React)
  - Zero JavaScript by default
  - Automatic code splitting
  
  ### Rendering Strategy
  - **Output Mode**: Static (SSG)
  - **Adapter**: Cloudflare
  - **Build**: Pre-renders all pages at build time
  
  ### Hydration Strategy
  
  #### client:load
  - Used for: Interactive game UI (GamePlay component)
  - Behavior: Load React immediately on page load
  - Count: 1-2 components per page max
  
  #### client:idle
  - Used for: Utility features (theme switcher, language selector)
  - Behavior: Load when browser is idle
  - Count: 2-3 components per page
  
  #### client:visible
  - Used for: Below-fold content
  - Behavior: Load when in viewport
  - Count: Variable
  
  #### client:only
  - Used for: Providers (I18n, Error handling)
  - Behavior: Skip server rendering entirely
  - Count: Minimize to 1-2 per layout
  
  ### Islands Architecture
  
  ```
  Page (Astro)
  ├─ Static Header (HTML)
  ├─ GamePlay Island (React, client:load)
  ├─ Static Footer (HTML)
  └─ Settings Island (React, client:idle)
  ```
  
  ### File Structure
  
  ```
  src/
  ├─ pages/
  │  ├─ index.astro              # Home page
  │  ├─ 404.astro                # Error page
  │  └─ game/
  │     └─ [sessionId].astro      # Game session
  ├─ layouts/
  │  └─ Layout.astro             # Main layout with SEO/View Transitions
  ├─ components/
  │  ├─ GamePlay.tsx             # Interactive React island
  │  ├─ ThemeSwitcher.tsx        # Hydrated component
  │  └─ SEO.astro               # Reusable Astro component
  └─ middleware.ts               # Request handling
  ```
  
  ### Best Practices
  
  1. **Keep Astro components HTML-first**
     - Use for static content, layout, SEO
     - Minimal JavaScript
  
  2. **Use React islands for interactivity**
     - Not full pages
     - Hydrate strategically
     - Use client directives appropriately
  
  3. **Leverage View Transitions**
     - Smooth navigation
     - No page reload
     - Preserved scroll position
  
  4. **Use Middleware for cross-cutting concerns**
     - Security headers
     - Logging
     - Request tracking
  
  5. **Implement Astro Actions for server ops**
     - Type-safe client-server communication
     - Validation at boundary
     - Secrets protection
  
  ### Performance Considerations
  
  - Target: <100KB JavaScript per page
  - Target: <3s TTI on 3G
  - Core Web Vitals: >90 on all metrics
  - Optimize images and assets
  - Use CDN for static files
  ```
- **Acceptance Criteria**:
  - [ ] Architecture document created
  - [ ] Hydration strategy documented
  - [ ] File structure explained
  - [ ] Best practices listed
  - [ ] Examples provided
  - [ ] Team reviews and approves

---

## 6. Implementation Roadmap

### Phase 1: Critical Foundation (Week 1-2)
**Goal**: Fix critical issues preventing scale and maintainability

1. **FR-001**: Remove wildcard import violations
2. **ASTRO-001**: Replace client:only with strategic hydration
3. **ASTRO-002**: Implement View Transitions
4. **ASTRO-003**: Implement middleware
5. **TS-001**: Fix memory leak in store timers
6. **TS-002**: Fix i18n race condition
7. **REACT-004**: Optimize Zustand selectors
8. **REACT-007**: Implement error boundaries
9. **ARCH-001**: Refactor to repository pattern
10. **ARCH-003**: Fix state rehydration race condition
11. **ARCH-004**: Consolidate provider pattern

**Success Metrics**:
- [ ] Zero bundle size violations
- [ ] 30-40% reduction in initial JavaScript (Astro hydration)
- [ ] No memory leaks in profiling
- [ ] Selector optimization shows 30%+ fewer re-renders
- [ ] Clean separation of concerns in state management
- [ ] Smooth View Transitions navigation

### Phase 2: Performance & UX (Week 3-4)
**Goal**: Optimize performance and improve user experience

12. **FR-002**: Implement responsive layouts
13. **FR-003**: Increase touch target sizes
14. **FR-004**: Implement lazy loading
15. **FR-005**: Optimize hydration strategy (React level)
16. **FR-006**: Add component memoization
17. **FR-007**: Fix PWA theme colors
18. **ASTRO-004**: Clarify SSG rendering strategy
19. **ASTRO-005**: Implement error pages
20. **ASTRO-006**: Implement SEO & metadata
21. **REACT-008**: Add Suspense boundaries
22. **REACT-009**: Replace window.location navigation (use Astro navigate)
23. **ARCH-006**: Implement progressive data loading

**Success Metrics**:
- [ ] Lighthouse score: 95+ on all metrics
- [ ] TTI reduced by 30%+ (combined with Astro optimizations)
- [ ] Initial data load reduced by 50%+
- [ ] WCAG AAA compliance
- [ ] Smooth navigation without reloads
- [ ] SEO metadata on all pages

### Phase 3: Architecture Refinement (Week 5-6)
**Goal**: Improve architecture and code quality

24. **FR-009**: Add loading states
25. **FR-010**: Keyboard navigation
26. **ASTRO-007**: Generate sitemap & robots.txt
27. **TS-003**: AbortController implementation
28. **TS-004**: Strengthen Zod schemas
29. **REACT-001**: Migrate to useActionState
30. **REACT-005**: Add React.memo
31. **ARCH-002**: Implement DDD structure
32. **ARCH-005**: State machine for game flow
33. **ARCH-008**: Integration testing layer

**Success Metrics**:
- [ ] 50+ integration tests
- [ ] Domain layer extracted
- [ ] State machine documented
- [ ] Code coverage >80%
- [ ] All async operations cancellable
- [ ] Sitemap generated and discoverable

### Phase 4: Advanced Patterns (Week 7-8)
**Goal**: Polish and production readiness

34. **FR-011**: Visual feedback animations
35. **FR-012**: Optimize mobile header
36. **REACT-002**: Implement useOptimistic
37. **REACT-003**: Add useTransition
38. **ARCH-007**: Bundle splitting optimization
39. **ARCH-009**: Architectural fitness functions
40. **ARCH-012**: Centralized error architecture
41. **ARCH-013**: Observability implementation

**Success Metrics**:
- [ ] Production monitoring in place
- [ ] Error tracking functional
- [ ] Bundle budgets enforced
- [ ] Architectural rules automated
- [ ] Professional polish complete

---

## 6. Success Criteria & Metrics

### Code Quality Metrics
- **Current**: Wildcard imports in 4+ files
- **Target**: Zero wildcard imports
- **Current**: Uses Tailwind CSS for all styling
- **Target**: Maintain Tailwind-first approach with design tokens

### Performance Metrics
- **Current**: TTI ~3.5s on 3G
- **Target**: TTI <2.5s on 3G
- **Current**: Initial bundle ~450KB
- **Target**: Initial bundle <300KB
- **Current**: 0 lazy-loaded components
- **Target**: 4-6 lazy-loaded components

### Architecture Metrics
- **Current**: 597-line store file
- **Target**: <200 lines with extracted services
- **Current**: Mixed concerns in store
- **Target**: Clear layer separation
- **Current**: 0 integration tests
- **Target**: 50+ integration tests

### Accessibility Metrics
- **Current**: Touch targets 40×40px
- **Target**: Touch targets 48×48px minimum
- **Current**: Lighthouse Accessibility: 92
- **Target**: Lighthouse Accessibility: 100

### User Experience Metrics
- **Current**: Full page reloads on navigation
- **Target**: SPA-style transitions
- **Current**: 1 responsive breakpoint
- **Target**: 4-5 responsive breakpoints
- **Current**: No loading states
- **Target**: Loading states for all async ops

---

## 7. Risk Assessment

### High Risk Items
1. **State persistence refactoring** (ARCH-001): Core functionality, requires careful migration
   - **Mitigation**: Feature flag, extensive testing, gradual rollout

2. **DDD restructuring** (ARCH-002): Large-scale code reorganization
   - **Mitigation**: Incremental extraction, maintain parallel implementations

3. **Progressive data loading** (ARCH-006): Changes data architecture
   - **Mitigation**: Backward compatibility layer, comprehensive E2E tests

### Medium Risk Items
4. **Provider consolidation** (ARCH-004): Could break hydration
   - **Mitigation**: Thorough testing of all routes

5. **Navigation refactoring** (REACT-009): Changes fundamental user flow
   - **Mitigation**: A/B test, monitor error rates

### Low Risk Items
6. **Touch target sizes** (FR-003): UI adjustment
7. **Lazy loading** (FR-004): Progressive enhancement
8. **Visual feedback animations** (FR-011): Progressive enhancement

---

## 8. Maintenance & Monitoring

### Post-Implementation Monitoring
1. **Performance**: Monitor Web Vitals weekly
2. **Errors**: Track error rates by type
3. **Bundle Size**: Automated budget checks in CI
4. **Architecture**: Monthly fitness function review

### Continuous Improvement
1. **Quarterly architecture review**: Assess adherence to patterns
2. **Performance budget**: Adjust thresholds based on usage
3. **Test coverage**: Maintain 80%+ coverage
4. **Documentation**: Keep ADRs and architecture docs updated

---

## 9. Conclusion

This comprehensive review identifies **93 specific, actionable improvements** across frontend development, JavaScript/TypeScript, React patterns, architecture, and Astro framework implementation. While the application demonstrates solid foundations with modern tooling and React 19 compatibility, focused improvements in the critical and high-priority areas will elevate it to production-grade quality.

**Immediate Priorities** (Start in Sprint 1):
1. Fix critical code violations (wildcard imports)
2. Optimize Astro hydration strategy (replace client:only)
3. Implement View Transitions for navigation
4. Add Astro middleware for security
5. Resolve race conditions and memory leaks
6. Optimize performance (selectors, lazy loading)
7. Refactor state persistence architecture
8. Implement error boundaries

**Note**: This project uses **Tailwind CSS** as its styling approach and **Astro 5** for framework. Continue using Tailwind utility classes with design tokens from `tailwind.config.mjs` for all styling needs. Leverage Astro's islands architecture for optimal JavaScript delivery.

**Next Steps**:
1. Review and prioritize tasks with team
2. Create task-master entries for approved tasks
3. Begin Phase 1 implementation
4. Set up monitoring and success metrics
5. Schedule weekly progress reviews

The roadmap is structured to deliver incremental value while building toward a robust, scalable, and maintainable architecture that will support the application's growth.
