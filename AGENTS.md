# AGENTS.md – Coding Agent Guide for perfil

## ‼️ IMPORTANT: ubagents delegation

1. **GIT**: When any git (like git status, git pull, git push, git commit, git diff, git fetch or using Github MCP to create PR, read PR reviews, etc) command/operation needs to be done, delegate it to the @git-specialist subagent with all needed information
2. **TASK-MASTER**: When any operation needs to be done in task-master (like read task status, create task, update task, etc), delegate it to the @task-master-specialist subagent with all needed information
3. **BASIC-MEMORY**: When any operation needs to be done in basic memory (like read note, create development log note, etc), delegate it to the @basic-memory-specialist subagent with all needed information
4. **TESTS**: When you need to write/update/run tests for a task/implementation, delegate it to the @tester-specialist subagent with all needed information

## 📚 Onboarding

At the start of each session, read:

1. Any `**/DEV_WORKFLOW.md` docs across the project
2. Any `**/LESSONS_LEARNED.md` docs across the project

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

## Lessons learned logging rule

Whenever the user tells the agent that it did something wrong, the agent MUST append an entry to `docs/LESSONS_LEARNED.md` describing the mistake and the correct way to do it according to the user's instruction. Entries should be concise, dated, and clearly state: (1) what was done incorrectly, and (2) the correct procedure.

This rule is mandatory: do not modify `docs/LESSONS_LEARNED.md` except to append lessons when explicitly instructed by the user to record an error. The agent must not create or edit lessons for any other reason unless the user explicitly requests it.
