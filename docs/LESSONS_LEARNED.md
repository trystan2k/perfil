# Lessons Learned

## 🚨 CRITICAL: READ THIS FILE AFTER EVERY CONVERSATION COMPACTION

**IF YOU ARE READING THIS AFTER A CONVERSATION COMPACTION (summary/compact):**

1. ✅ You MUST also read `docs/DEV_WORKFLOW.md` immediately
2. ✅ You MUST follow ALL lessons documented below strictly
3. ✅ NEVER assume permission from a summary - ALWAYS ask explicitly

---

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

2025-11-22 — MUST UPDATE TASK AND CREATE DEVELOPMENT LOG BEFORE COMMITTING

- Mistake: I committed and pushed changes for task #85 BEFORE updating the task status to "done" and creating the development log. I followed this wrong sequence:
   1. Commit to feature branch
   2. Push to remote
   3. Create PR
   4. THEN mark task as done and create development log (and I delegated development log to WRONG specialist)
- Additional mistake: I delegated the development log creation to @task-master-specialist instead of @basic-memory-specialist
- Correct procedure: According to DEV_WORKFLOW.md steps 8-13, the proper sequence is:
   1. Step 8: Update the task with implementation details and mark as "done" in Task Master (delegate to @task-master-specialist ONLY)
   2. Step 9: Create development log in docs/memories/development-logs (delegate to @basic-memory-specialist ONLY - NOT task-master)
   3. Step 10: (Optional) Request code review (coderabbit CLI)
   4. Step 11: Commit with all changes (including task updates and development log)
   5. Step 12: Push to remote
   6. Step 13: Create PR
- Specialist roles clarification:
   - **@task-master-specialist**: ONLY updates task status and details in Task Master. Does NOT create development logs.
   - **@basic-memory-specialist**: ONLY creates development logs in docs/memories/development-logs. Does NOT update Task Master.
- Why this matters:
   1. Development log must be committed to the feature branch for complete traceability
   2. Task Master updates must be committed to show task completion history
   3. The PR should contain the complete history including task status changes and documentation
   4. Proper specialist delegation ensures each tool is used for its intended purpose
- This ensures:
   1. All task tracking is properly documented in git history
   2. Development logs are part of the feature branch, not orphaned
   3. PR contains complete implementation record
   4. Proper traceability and audit trail for all changes
   5. Correct specialist delegation for optimal workflow

2025-11-28 — NEVER RUN MULTIPLE NPM SCRIPTS CONCURRENTLY

- Mistake: Running multiple npm/pnpm scripts simultaneously (e.g., running tests while another test process is still running, or pushing while complete-check is executing) can cause system crashes.
- What can happen:
   1. Running `pnpm run complete-check` (which includes tests)
   2. While it's still running, executing another command that also runs tests
   3. Or running git operations (push, commit) while QA scripts are executing
   4. This causes resource conflicts and can crash the computer
- Correct procedure: ALWAYS wait for npm/pnpm scripts to complete before running other commands:
   1. Run `pnpm run complete-check` and WAIT for it to finish completely
   2. Only after the script completes (success or failure), proceed with other operations
   3. Never run multiple test suites simultaneously
   4. Never run git operations while QA scripts are executing
   5. Be patient - let each script finish before starting the next one
- This ensures:
   1. System stability and prevents crashes
   2. Accurate test results without resource conflicts
   3. Clean process execution without interference
   4. Reliable CI/CD pipeline behavior

2025-12-03 — NEVER RUN COMPLETE-CHECK MULTIPLE TIMES UNNECESSARILY

- Mistake: Running `pnpm run complete-check` multiple times in succession during the same fix cycle (e.g., running it 4-5 times while fixing linting errors, test failures, etc.) instead of running it once and extracting all needed information from that single output.
- What's wrong:
   1. `complete-check` runs lint + typecheck + test:coverage + test:e2e + build - this is a LONG, resource-intensive process
   2. Running it repeatedly wastes time (6-8 seconds per run, plus user wait time)
   3. Running it repeatedly wastes computational resources
   4. It shows poor planning and inefficiency
- Correct procedure: Run `pnpm run complete-check` ONCE and extract ALL information needed:
   1. Run `pnpm run complete-check` a SINGLE time
   2. Capture the FULL output (use `2>&1` to capture both stdout and stderr if needed)
   3. From that ONE output, extract:
      - Lint errors and warnings
      - Typecheck errors
      - Test failures (which files, which tests)
      - Build errors
      - Coverage reports
   4. Fix ALL issues identified
   5. Run `pnpm run complete-check` ONE more time to verify all fixes
   6. If there are still issues, repeat steps 1-5
- Exception: You may run individual scripts (lint, test, etc.) separately if you need focused feedback, but NEVER run complete-check more than necessary
- This ensures:
   1. Efficient use of time and resources
   2. Better workflow planning
   3. Faster development cycles
    4. Less frustration waiting for repeated checks

2025-12-13 — TESTS ARE ESSENTIAL, NEVER OPTIONAL

- Mistake: During task #95 (Random Clue Ordering), I removed E2E tests that were failing due to UI selector issues and called them "a bonus" to the implementation. I intended to skip fixing them and move forward with the rest of the workflow.
- Critical realization: Tests are NEVER a bonus, optional add-on, or nice-to-have. They are:
   1. ESSENTIAL to the implementation - not separate from it
   2. REQUIRED for all acceptance criteria and success metrics
   3. MANDATORY components of any task, not optional enhancements
   4. PART OF the definition of "done" for any feature
- Correct procedure: When tests fail:
   1. NEVER remove or skip failing tests - this is code quality regression
   2. ALWAYS fix failing tests by identifying root cause and fixing either code or test
   3. DELEGATE to @tester-specialist if test failures are beyond expertise
   4. COMMIT ALL TESTS - they must be part of the feature branch
   5. ALL TESTS MUST PASS before task can be marked as done
- Why this matters:
   1. Tests verify that the implementation actually works
   2. Tests prevent regressions and catch future bugs
   3. Tests are the safety net for refactoring and maintenance
   4. Skipping tests means the feature isn't truly validated
   5. Failing tests in codebase create technical debt
   6. Project quality depends on comprehensive, passing test coverage
- This ensures: Complete feature validation, long-term code quality, prevention of hidden bugs, proper acceptance criteria fulfillment, and professional, production-ready code



