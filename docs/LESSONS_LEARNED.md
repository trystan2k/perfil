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

2025-11-11 — NEVER INCLUDE TEST-ONLY CODE IN PRODUCTION COMPONENTS

- Mistake: Adding test-specific code to production components, including:
  - Hidden buttons with test IDs (`reveal-trigger`, `insufficient-drag-trigger`)
  - Window-exposed test APIs (`window.__testRevealAnswer`)
  - Exported functions or props solely for testing purposes
- Correct procedure: Tests must ONLY simulate real user interactions:
  1. DO NOT add ANY test-specific code to production components (no test IDs, no window APIs, no test-only exports)
  2. Tests should ONLY perform actions a real user would perform (clicks, drags, keyboard input, etc.)
  3. If code cannot be reached through user interactions, question whether it should exist at all
  4. Accept lower coverage if code is genuinely unreachable by users (after careful consideration)
  5. Prefer testing through the public API and user events, not internal implementation details
- This ensures:
  1. Production code is completely clean of test artifacts
  2. Tests verify actual user experience, not implementation details
  3. Refactoring is safe because tests don't depend on internal structure
  4. No unnecessary code shipped to users
  5. Better separation of concerns between production and test code

2025-11-11 — ALWAYS COMMIT TASK STATUS UPDATES WITH IMPLEMENTATION

- Mistake: Completing a task implementation and committing the code changes, but forgetting to commit the Task Master status updates (marking task/subtasks as "done") in the same session/branch.
- Correct procedure: ALWAYS commit task status updates together with the implementation:
  1. Complete the implementation work
  2. Mark subtasks/task as "done" in Task Master
  3. Create development logs
  4. Commit ALL changes together (code + Task Master updates + logs) in a single commit or ensure all are committed before pushing
  5. The feature branch should contain both the implementation AND the updated task status
- This ensures:
  1. Task tracking stays synchronized with code changes
  2. Complete traceability in version control
  3. No orphaned task updates left uncommitted
  4. Clear history of what was done when

2025-11-11 — ALWAYS ASK PERMISSION BEFORE COMMITS WHEN RESUMING FROM SUMMARY

- Mistake: When resuming from a conversation summary and the user says "go on" or "continue", immediately proceeding with git commits/pushes without asking for explicit permission first.
- Correct procedure: When resuming from a summary where the next step involves commits/pushes:
  1. Read the summary to understand what work was done
  2. Identify what remains to be committed/pushed
  3. EXPLICITLY ASK the user for permission to commit/push those specific changes
  4. Wait for user confirmation before executing any git commit or push commands
  5. NEVER assume "go on" or "continue" means permission to commit - always ask explicitly
- This ensures:
  1. User maintains control over version history even across session boundaries
  2. User can review what will be committed before it happens
  3. Prevents automatic commits when resuming from compacted conversations
  4. Maintains the authorization workflow regardless of session state

2025-11-11 — ALWAYS ASK PERMISSION FOR ANY TEST COVERAGE DECREASE

- Mistake: Making changes that decrease test coverage (even by 0.001%) without informing the user or asking for permission to accept the lower coverage.
- Correct procedure: BEFORE committing/pushing any changes that decrease test coverage:
  1. Run test coverage to verify the impact of changes
  2. If coverage decreased by ANY amount (even 0.001%):
     - IMMEDIATELY inform the user of the coverage decrease
     - Show the old vs new coverage percentages
     - Explain which files/lines are now uncovered
     - EXPLICITLY ASK permission to accept the lower coverage
  3. Wait for user approval before proceeding
  4. NEVER assume small coverage decreases are acceptable without asking
- This ensures:
  1. User maintains control over code quality standards
  2. No silent degradation of test coverage over time
  3. Coverage decreases are conscious decisions, not accidents
  4. Project maintains high quality standards consistently

2025-11-11 — ALWAYS VALIDATE AI SUGGESTIONS AGAINST PROJECT ARCHITECTURE

- Mistake: Implementing SSR (Server-Side Rendering) for the scoreboard route based on a GitHub Copilot PR review comment, without first validating the suggestion against the project's documented architecture (which specifies Static Site Generation / SSG).
- What happened:
  1. Copilot suggested using `prerender: false` (SSR) for "consistency"
  2. I added the Cloudflare adapter and enabled SSR without questioning the architectural change
  3. This violated the project's core design: SSG with client-side data fetching from IndexedDB
- Correct procedure: When ANY AI tool (Copilot, Claude, etc.) suggests architectural changes:
  1. STOP and verify the suggestion against the project's documented architecture (PRD, README, etc.)
  2. Question whether the change aligns with the project's design decisions
  3. Consider if the AI might be making incorrect assumptions
  4. Consult with the user BEFORE implementing architectural changes
  5. Remember: AI-generated suggestions (including PR reviews) can be wrong
- This ensures:
  1. Project architecture remains consistent with design decisions
  2. No silent architectural drift from AI suggestions
  3. All architectural changes are conscious, validated decisions
  4. Documentation remains the source of truth, not AI assumptions
