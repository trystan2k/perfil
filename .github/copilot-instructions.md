# Copilot Coding Agent Instructions

## Repository Overview

**Perfil** is a multiplayer guessing game web application inspired by the Brazilian board game *Perfil*. Players guess mystery words/people/places based on progressive clues revealed by a game host (MC). This is a mobile-first Progressive Web App built with modern web technologies.

- **Type**: Static web application (SSG)
- **Size**: Small (~40 source files)
- **Primary Language**: TypeScript (100%)
- **Frameworks**: Astro 5.x (SSG) + React 19.x (interactive islands)
- **State Management**: Zustand 5.x for game state, TanStack Query 5.x for async data
- **Styling**: Tailwind CSS 3.x
- **Target Runtime**: Modern browsers (mobile-first, responsive design)
- **Package Manager**: pnpm (v10+)
- **Node Version**: 24.x (enforced in package.json engines)

## Build & Validation Commands

### Prerequisites
Always run `pnpm install --frozen-lockfile` after cloning or when dependencies change. This ensures consistent dependency versions.

### Development Workflow
```bash
# Start dev server (http://localhost:4321)
pnpm dev

# Format code (Biome - always run before linting)
pnpm format

# Lint code (Biome - unified formatter + linter)
pnpm lint

# Type checking (TypeScript + Astro)
pnpm typecheck

# Run tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test run

# Run tests with coverage (enforces 80% thresholds)
pnpm test:coverage

# Build production bundle (outputs to dist/)
pnpm build

# Preview production build locally
pnpm preview

# Complete quality check (MANDATORY before commit)
pnpm run complete-check
```

### Command Execution Order (CRITICAL)
**ALWAYS** run commands in this exact order when validating changes:
1. `pnpm run format` (fixes formatting automatically)
2. `pnpm run lint` (checks code quality)
3. `pnpm run typecheck` (validates TypeScript + Astro files)
4. `pnpm run test:coverage` (runs tests with 80% coverage enforcement)
5. `pnpm run build` (validates production build)

**Shortcut**: Use `pnpm run complete-check` which runs all steps in correct order.

### Quality Gates (MANDATORY)
- **NEVER** commit code if `pnpm run complete-check` fails
- **NEVER** bypass git hooks with `--no-verify`
- **ALL** quality checks must pass with zero errors and zero warnings
- Coverage thresholds: 80% for statements, branches, functions, and lines
- Build must complete successfully without errors

### Timing Expectations
- `pnpm install --frozen-lockfile`: ~2-5 seconds (with cache)
- `pnpm lint`: ~10-20ms (very fast)
- `pnpm typecheck`: ~2-3 seconds
- `pnpm test run`: ~1-2 seconds (56 tests)
- `pnpm test:coverage`: ~1-2 seconds + coverage report generation
- `pnpm build`: ~1 second (static site generation)
- `pnpm run complete-check`: ~10-15 seconds total

### Known Issues & Workarounds
No known issues or workarounds required. All commands work reliably in sequence.

## Project Architecture

### Directory Structure
```
perfil/
├── .github/workflows/        # CI/CD pipelines
│   ├── ci.yml               # Quality checks on PR/push
│   └── deploy.yml           # Cloudflare Pages deployment
├── .husky/                  # Git hooks (pre-commit, pre-push)
├── docs/                    # Project documentation
│   ├── PRD/PRD.md          # Product requirements (game rules, features)
│   ├── DEV_WORKFLOW.md     # Development workflow (mandatory reading)
│   ├── TESTING.md          # Testing guidelines
│   └── memories/           # Development logs
├── public/
│   └── data/profiles.json  # Game profiles data (8 profiles)
├── src/
│   ├── components/         # React components (.tsx) and Astro components (.astro)
│   ├── hooks/              # React custom hooks (TanStack Query)
│   ├── layouts/            # Astro layout components
│   ├── pages/              # Astro file-based routing
│   ├── stores/             # Zustand state stores
│   └── types/              # TypeScript types and Zod schemas
├── astro.config.mjs        # Astro configuration
├── biome.json              # Biome formatter + linter config
├── tailwind.config.mjs     # Tailwind CSS config
├── tsconfig.json           # TypeScript config (strict mode)
├── vitest.config.ts        # Vitest test configuration
└── package.json            # Dependencies and scripts
```

### Key Configuration Files
- **astro.config.mjs**: Astro + React + Tailwind integrations
- **biome.json**: Unified formatting and linting (2 space indent, single quotes, 100 char line width)
- **vitest.config.ts**: Test environment (jsdom), coverage provider (v8), 80% thresholds
- **tsconfig.json**: Extends `astro/tsconfigs/strict`
- **.editorconfig**: 2 space indent, LF line endings, UTF-8, trim trailing whitespace

### Code Organization Patterns
- **Test files**: Co-located in `__tests__/` directories, use `.test.ts` or `.test.tsx` extensions (NEVER `.spec.*`)
- **Type definitions**: Centralized in `src/types/models.ts` using Zod schemas with TypeScript type inference
- **State management**: Zustand stores in `src/stores/` (e.g., `gameStore.ts`)
- **Data fetching**: TanStack Query hooks in `src/hooks/` (e.g., `useProfiles.ts`)
- **Astro components**: `.astro` files for static/server-rendered content
- **React components**: `.tsx` files for interactive client-side islands

### Critical Dependencies
- **Astro**: Static site generation framework
- **React + React DOM**: Interactive component islands
- **Zustand**: Game session state management (players, scores, turns)
- **TanStack Query**: Async data fetching and caching
- **Zod**: Runtime schema validation for game data
- **Biome**: Unified formatter and linter (replaces ESLint + Prettier)
- **Vitest**: Testing framework with coverage
- **@testing-library/react**: Component testing utilities
- **Tailwind CSS**: Utility-first styling

## CI/CD & Pre-commit Checks

### Git Hooks (Husky + lint-staged)
**Pre-commit** (.husky/pre-commit):
- Runs `lint-staged` which executes:
  - `biome format --write` on staged files
  - `biome check --write` on staged files
  - `vitest related --run` on changed TypeScript files

**Pre-push** (.husky/pre-push):
- Runs `pnpm run complete-check` (lint → typecheck → test:coverage → build)
- **NEVER** bypass with `--no-verify` - this is a mandatory quality gate

### GitHub Actions CI Pipeline (.github/workflows/ci.yml)
Triggers on: push to main, pull requests to main, manual workflow_dispatch

Steps executed:
1. Checkout code
2. Setup Node.js 24.x
3. Setup pnpm v10
4. Install dependencies with `--frozen-lockfile`
5. Run linting: `pnpm lint`
6. Run type checking: `pnpm typecheck`
7. Run tests with coverage: `pnpm test:coverage`
8. Build production: `pnpm build`
9. Upload coverage report artifact (retention: 7 days)
10. Upload build artifacts (retention: 1 day)

**All steps must pass** for CI to succeed. PRs cannot be merged until CI is green.

### Deployment Pipeline (.github/workflows/deploy.yml)
Triggers after successful CI workflow on main branch, or manual workflow_dispatch.

Deploys to: Cloudflare Pages
Required secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required variables:
- `CLOUDFLARE_PAGES_PROJECT_NAME`

## Code Style Guidelines

### Formatting & Linting (Biome)
- **Indentation**: 2 spaces (enforced by .editorconfig and biome.json)
- **Line width**: 100 characters
- **Quote style**: Single quotes for JavaScript/TypeScript
- **Trailing commas**: ES5 style (arrays, objects, not function params)
- **Line endings**: LF (Unix style)
- **Final newline**: Required in all files
- **Trailing whitespace**: Automatically trimmed

### TypeScript Conventions
- **Strict mode**: Enabled (extends `astro/tsconfigs/strict`)
- **Type inference**: Prefer Zod schema inference (`z.infer<typeof schema>`)
- **Explicit types**: Required for function parameters and return types
- **Imports**: ES module syntax, relative paths for local modules

### Testing Conventions (CRITICAL)
- **Test file naming**: Use `.test.ts` or `.test.tsx` (NEVER `.spec.*`)
- **Test directory**: Always in `__tests__/` subdirectories
- **User events**: ALWAYS use `@testing-library/user-event` (NEVER `fireEvent`)
- **Act wrapping**: NOT required with `userEvent` (handled internally)
- **Test structure**: Arrange-Act-Assert pattern
- **Coverage requirement**: 80% minimum (enforced by vitest.config.ts)

### React Component Patterns
- **Client directives**: Use `client:load`, `client:visible`, etc. for Astro islands
- **State management**: Zustand for global game state, local useState for component state
- **Data fetching**: TanStack Query hooks (see `useProfiles.ts` example)
- **Validation**: Zod schemas for all external data (see `models.ts`)

### File Naming
- **React components**: PascalCase (e.g., `QueryProvider.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useProfiles.ts`)
- **Stores**: camelCase with `Store` suffix (e.g., `gameStore.ts`)
- **Types**: camelCase (e.g., `models.ts`)
- **Astro components**: PascalCase (e.g., `Layout.astro`)
- **Astro pages**: kebab-case or camelCase (e.g., `index.astro`)

## Development Workflow (MANDATORY)

**CRITICAL**: Always read and follow `docs/DEV_WORKFLOW.md` for the complete workflow.

### Key Workflow Rules (DO NOT SKIP)
1. **NEVER** start implementation without explicit authorization
2. **ALWAYS** create feature branches from up-to-date `main` branch
3. **ALWAYS** run `pnpm run complete-check` before committing
4. **NEVER** commit with failing quality checks (even warnings)
5. **ALWAYS** ask for code review before moving to next subtask
6. **NEVER** bypass git hooks with `--no-verify`
7. **NEVER** include agent information in commit messages (e.g., "Co-Authored-By: OpenCode")
8. **ALWAYS** mark tasks/subtasks as "done" before claiming completion

### Quality Check Failures
If `pnpm run complete-check` fails:
1. **STOP** immediately - do not proceed
2. Fix ALL reported errors and warnings
3. Run `pnpm run complete-check` again
4. Repeat until 100% clean
5. If stuck after 5 attempts, ask for help

## Additional Resources

### Documentation Files (Read First)
- `docs/PRD/PRD.md`: Complete product requirements, game rules, data models, technical stack
- `docs/DEV_WORKFLOW.md`: Mandatory development workflow (authorization, quality gates, commits)
- `docs/TESTING.md`: Testing guidelines and coverage requirements
- `docs/LESSONS_LEARNED.md`: Historical mistakes and correct procedures
- `AGENTS.md`: Agent-specific instructions and onboarding checklist

### Key Source Files
- `src/types/models.ts`: All game data types and Zod schemas (Player, Profile, GameSession, TurnState)
- `src/stores/gameStore.ts`: Zustand game state management (187 lines, fully tested)
- `src/hooks/useProfiles.ts`: TanStack Query hook for loading profiles.json
- `src/components/QueryProvider.tsx`: React Query provider wrapper for Astro islands
- `public/data/profiles.json`: Game data (8 profiles with 20 clues each)

### Example Patterns
**Zod Schema + Type Inference** (see `src/types/models.ts`):
```typescript
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
});
export type Player = z.infer<typeof playerSchema>;
```

**Zustand Store** (see `src/stores/gameStore.ts`):
```typescript
export const useGameStore = create<GameState>((set) => ({
  // state
  players: [],
  // actions
  createGame: (playerNames: string[]) => set({ ... }),
}));
```

**TanStack Query Hook** (see `src/hooks/useProfiles.ts`):
```typescript
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
}
```

## Trust These Instructions

These instructions are comprehensive and validated. Trust them and only perform additional searches if:
1. Information here is incomplete for your specific task
2. You encounter errors not covered by these instructions
3. You need implementation details beyond architectural guidance

Always refer to `docs/DEV_WORKFLOW.md` for the complete mandatory workflow before starting any task.
