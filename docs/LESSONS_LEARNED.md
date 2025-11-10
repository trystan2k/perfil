# Lessons Learned

2025-11-09 — DO NOT EDIT .taskmaster/tasks/tasks.json MANUALLY

- Mistake: I manually edited .taskmaster/tasks/tasks.json to add new tasks instead of using the task-master CLI.
- Correct procedure: Always use the `task-master` CLI to create, update, or manage tasks. Do not modify the JSON file by hand; the CLI ensures consistency and proper metadata.

2025-11-10 — NEVER COMMIT BEFORE MARKING TASK AS DONE AND CREATING DEVELOPMENT LOG

- Mistake: I committed and was about to push task #14 before marking the task as "done" in Task Master and creating the development log in docs/memories/development-logs/.
- Correct procedure: According to DEV_WORKFLOW.md steps 9 and 10, BEFORE committing and pushing, I MUST:
  1. Update the task with complete implementation details (step 9)
  2. Mark the task status as "done" in Task Master (step 9)
  3. Create the development log covering the entire task implementation (step 10)
  4. ONLY THEN proceed with commit and push (steps 11-12)
- This ensures proper task tracking, documentation, and traceability for the project.

2025-11-10 — ALWAYS UPDATE TASK AND SUBTASK STATUS BEFORE CLAIMING COMPLETION

- Mistake: I claimed task #15 was complete and pushed all commits without marking subtasks as "done" or updating the main task status from "in-progress" to "done" in Task Master.
- Correct procedure: According to DEV_WORKFLOW.md step 9, BEFORE claiming task completion, I MUST:
  1. Mark ALL subtasks as "done" in Task Master (each subtask after completion)
  2. Update the main task with complete implementation details
  3. Mark the main task status as "done" in Task Master
  4. Verify all statuses are correctly updated
  5. ONLY THEN claim task completion to the user
- This ensures accurate task tracking, prevents confusion about task status, and maintains proper project management records.

2025-11-10 — ALWAYS STRIVE FOR 100% TEST COVERAGE, NOT JUST THE THRESHOLD

- Mistake: I stopped at 83.78% coverage for GameSetup component and 94.85% overall, even though the threshold is only 80%, without attempting to reach 100%.
- Correct procedure: Although the project has an 80% coverage threshold, I should ALWAYS:
  1. Aim for 100% test coverage for all new code written
  2. Add tests for all uncovered lines, branches, and edge cases
  3. Only accept coverage below 100% if there's a valid reason (e.g., unreachable error handlers, framework constraints)
  4. Document any intentionally uncovered code with explanations
- This ensures maximum code quality, catches edge cases, and makes future refactoring safer.

2025-11-10 — NEVER USE WILDCARD REACT IMPORTS

- Mistake: Using `import * as React from 'react'` instead of importing only the needed elements.
- Correct procedure: ALWAYS import only the specific elements needed from React:
  - ✅ Correct: `import { forwardRef, type HTMLAttributes, type Ref } from 'react'`
  - ❌ Wrong: `import * as React from 'react'`
  - ❌ Wrong: `import React from 'react'` (unless you need the default export)
- Benefits:
  1. Smaller bundle size (tree-shaking)
  2. Clearer code showing exact dependencies
  3. Better IDE autocomplete and type checking
  4. Faster build times
- This applies to all libraries, not just React - always prefer named imports over wildcard imports.

2025-11-10 — NEVER COMMIT OR PUSH WITHOUT EXPLICIT USER CONFIRMATION

- Mistake: Committing and/or pushing changes without asking for user confirmation first.
- Correct procedure: ALWAYS ask for permission before ANY commit or push operation, regardless of:
  - Number of files changed (even if just 1 file)
  - Type of changes (code, documentation, configuration, etc.)
  - How "safe" or "minor" the changes seem
  - Whether it's a subtask commit or final task commit
- The ONLY exception is if the user explicitly tells you to "commit and push" in their instruction
- This ensures:
  1. User has full control over what goes into version history
  2. User can review changes one final time before they're committed
  3. Prevents accidental commits of unintended changes
  4. Maintains proper authorization workflow

2025-11-11 — NEVER RETURN TO MAIN BRANCH BEFORE FEATURE BRANCH IS COMPLETE

- Mistake: Checking out main branch after pushing the feature branch but before all task updates were completed and committed to the feature branch. Specifically, I returned to main after creating the PR but before marking the task as "done" in Task Master on the feature branch.
- Correct procedure: STAY on the feature branch until ALL work is complete:
  1. Implement all subtasks and mark them as "done"
  2. Update the main task with implementation details
  3. Mark the main task status as "done"
  4. Create development logs
  5. Commit ALL changes (including Task Master updates and logs)
  6. Push to feature branch
  7. Create Pull Request
  8. ONLY THEN return to main branch
- This ensures:
  1. All task tracking updates are committed to the feature branch
  2. The feature branch contains a complete history of the work
  3. No orphaned changes remain uncommitted
  4. Proper traceability in the PR and git history
