# Copilot Coding Agent Instructions

## Review Philosophy
- Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists
- Be concise: one sentence per comment when possible
- Focus on actionable feedback, not observations
- When reviewing text, only comment on clarity issues if the text is genuinely confusing or could lead to errors.

### Security & Safety
- Unsafe code blocks without justification
- Command injection risks (shell commands, user input)
- Path traversal vulnerabilities
- Credential exposure or hardcoded secrets
- Missing input validation on external data
- Improper error handling that could leak sensitive info

### Correctness Issues
- Logic errors that could cause panics or incorrect behavior
- Race conditions in async code
- Resource leaks (files, connections, memory)
- Off-by-one errors or boundary conditions
- Optional types that don’t need to be optional
- Error context that doesn’t add useful information (e.g., `.context("Failed to do X")` when error already says it failed)
- Overly defensive code that adds unnecessary checks
- Unnecessary comments that just restate what the code already shows (remove them)

### Architecture & Patterns
- Code that violates existing patterns in the codebase
- Missing error handling
- Async/await misuse or blocking operations in async contexts
- Improper trait implementations

*Important**: You review PRs immediately, before CI completes. Do not flag issues that CI will catch.

### What Our CI Checks (`.github/workflows/ci.yml`)

**App checks:**
- `pnpm install --frozen-lockfile` - Fresh dependency install 
- `npm run lint` - Biome linting
- `npm run typecheck` - TypeScript type checking
- `npm run test:coverage` - Vitest tests 
- `npm run build` - Astro build (production)

**Key insight**: Commands like `npx` check local `node_modules` first, which CI installs via `npm ci`. 
Don’t flag these as broken unless you can explain why CI setup wouldn't handle it.

## Skip These (Low Value)

Do not comment on:
- **Style/formatting** - CI handles this
- **Test failures** - CI handles this (full test suite)
- **Missing dependencies** - CI handles this (pnpm install)
- **Minor naming suggestions** - unless truly confusing
- **Suggestions to add comments** - for self-documenting code
- **Refactoring suggestions** - unless there’s a clear bug or maintainability issue
- **Multiple issues in one comment** - choose the single most critical issue
- **Logging suggestions** - unless for errors or security events (the codebase needs less logging, not more)
- **Pedantic accuracy in text** - unless it would cause actual confusion or errors. No one likes a reply guy

## Response Format

When you identify an issue:
1. **State the problem** (1 sentence)
2. **Why it matters** (1 sentence, only if not obvious)
3. **Suggested fix** (code snippet or specific action)

Example:
This could panic if the vector is empty. Consider using `.get(0)` or add a length check.

## When to Stay Silent

If you’re uncertain whether something is an issue, don’t comment. False positives create noise and reduce trust in the review process.

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

## Additional Resources

### Documentation Files (Read First)
- `docs/PRD/PRD.md`: Complete product requirements, game rules, data models, technical stack
- `docs/DEV_WORKFLOW.md`: Mandatory development workflow (authorization, quality gates, commits)
- `docs/TESTING.md`: Testing guidelines and coverage requirements
- `docs/LESSONS_LEARNED.md`: Historical mistakes and correct procedures
- `AGENTS.md`: Agent-specific instructions and onboarding checklist

## Trust These Instructions

These instructions are comprehensive and validated. Trust them and only perform additional searches if:
1. Information here is incomplete for your specific task
2. You encounter errors not covered by these instructions
3. You need implementation details beyond architectural guidance

Always refer to `docs/DEV_WORKFLOW.md` for the complete mandatory workflow before starting any task.
