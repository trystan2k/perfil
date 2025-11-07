# AGENTS.md – Coding Agent Guide for perfil

## 📚 Onboarding

At the start of each session, read:

1. Any `**/README.md` docs across the project
2. Any `**/DEV_WORKFLOW.md` docs across the project

## Project context

For context about the project, see document [CONTEXT.md](docs/CONTEXT.md) if it exists.

## Build, Lint, and Test Commands

- **Dev**
  - Build: `pnpm build` (Rsbuild)
  - Dev: `pnpm dev`
  - Typecheck: `pnpm typecheck`
  - Lint: `pnpm lint` (Biome)
  - Format: `pnpm format` (Biome)
- **Testing**: Vitest for unit and integration tests
  - Run tests: `pnpm test`
  - Run tests with coverage: `pnpm test:coverage`
  - Run tests for a specific file: `pnpm test <file_path>`
  - Run a specific test: `pnpm test -t <test_name>`

## Code Style Guidelines

- **Indentation**: 2 spaces (see .editorconfig)
- **Line endings**: LF, final newline, trim trailing whitespace
- **Imports**: Use ES module syntax (`import ... from ...`)
- **TypeScript**: Strict mode, use explicit types, enable decorators
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Formatting**: Use Biome (`pnpm format`) - unified tool as per ADR 005
- **Linting**: Use Biome (`pnpm lint`) - unified tool as per ADR 005
- **Error Handling**: Prefer explicit error types, use TypeScript safety
- **File structure**: Organize by feature/module, keep related files together
- **No Cursor/Copilot rules present**

_Refer to this guide for agentic coding in this repository. Update if new tools or rules are added._
