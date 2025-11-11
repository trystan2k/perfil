# AGENTS.md – Coding Agent Guide for perfil

## 🚨 CRITICAL: MANDATORY READING AFTER CONVERSATION COMPACTION

**AFTER ANY CONVERSATION COMPACTION (summary/compact action), you MUST:**
1. ✅ **IMMEDIATELY** read `docs/DEV_WORKFLOW.md` in full
2. ✅ **IMMEDIATELY** read `docs/LESSONS_LEARNED.md` in full
3. ✅ **NEVER** proceed with ANY action until you've read both files
4. ✅ **STRICTLY** follow all rules in these files - no exceptions

**These files contain critical lessons about authorization violations you have made before.**

## ⛔ CRITICAL: AUTHORIZATION REQUIRED

**🚨 NEVER START ANY TASK WITHOUT EXPLICIT USER AUTHORIZATION 🚨**

You MUST:
- ❌ **NEVER** checkout branches without authorization
- ❌ **NEVER** expand tasks without authorization
- ❌ **NEVER** create feature branches without authorization
- ❌ **NEVER** begin implementation without authorization
- ❌ **NEVER** run git commands (including commit/push) without authorization
- ❌ **NEVER** commit or push without explicit user permission - ALWAYS ask first
- ✅ **ALWAYS** wait for the user to explicitly tell you which task to start

**When resuming from a summary, ask me what to do next before do anything else.**

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

## Taskmaster

If you need to use Taskmaster, refer to the [TASK_MASTER.md](docs/TASK_MASTER.md) guide.

_Refer to this guide for agentic coding in this repository. Update if new tools or rules are added._

## Lessons learned logging rule

Whenever the user tells the agent that it did something wrong, the agent MUST append an entry to `docs/LESSONS_LEARNED.md` describing the mistake and the correct way to do it according to the user's instruction. Entries should be concise, dated, and clearly state: (1) what was done incorrectly, and (2) the correct procedure.

This rule is mandatory: do not modify `docs/LESSONS_LEARNED.md` except to append lessons when explicitly instructed by the user to record an error. The agent must not create or edit lessons for any other reason unless the user explicitly requests it.
