# Development Workflow Guide

## 🚨 CRITICAL: MANDATORY READING AFTER CONVERSATION COMPACTION

**AFTER ANY CONVERSATION COMPACTION (summary/compact action), you MUST:**

1. ✅ **IMMEDIATELY** read `docs/DEV_WORKFLOW.md` in full
2. ✅ **IMMEDIATELY** read `docs/LESSONS_LEARNED.md` in full
3. ✅ **STRICTLY** follow all rules in these files - no exceptions
3. ✅ **STRICTLY** follow the steps in the order they appear
4. ✅ **GO** proceed the pending task in the conversation following the dev workflow

## ⛔ CRITICAL

- ❌ **NEVER** EVER run multiple npm commands at the same time. If one command hangs or is taking too long,
KILL IT before running the next one.
- ❌ **NEVER** Start a second task without explicit user authorization. Only do the task you were requested to do.

## 🚨 CRITICAL REMINDER: DO NOT SKIP ANY STEPS AND EXECUTE THEM IN ORDER THEY APPEAR IN THIS DOCUMENT

**THE COMMIT/PUSH/PR STEPS ARE THE LAST STEPS IN THE DEVELOPMENT WORKFLOW.**

**No steps is optional. They are ALL MANDATORY IN THE ORDER THEY APPEAR IN THIS DOCUMENT.**

If you skip any steps or execute in the wrong order, your commit will be incomplete and violate the development workflow.

## ⚠️ FUNDAMENTAL PRINCIPLES

THESE INSTRUCTIONS ARE MANDATORY and must be strictly followed throughout development. No item can be neglected. NEVER ASSUME ANYTHING - ALWAYS ASK IF IN DOUBT.

- **Attention**: NEVER, NEVER start to implement a task without been requested to do so.
- Also always start the task from the `main` branch and ensure it is up-to-date with remote.
- **Important**: Remember that this project use `pnpm`.

## 🔄 STANDARD WORKFLOW

Please follow these steps for each task, in the order they appear:

### 1. 📋 TASK RECEPTION

**Attention**: Delegate any action to the respective subagent specialists; don’t do it in the main agent.

- Receive the task or subtask to be developed
- Identify the task ID in the Task Master system
- **Action**: Check if task is already implemented, if so, ask for clarification
- Ensure that your are at `main` branch, otherwise, checkout it.
- **Action**: Run `git pull` to ensure that your branch is up-to-date with remote.
- **Attention**:If there are changes that are not committed, stash them checkout and pull `main` and then unstash the changes.
- **Action**: Ask git subagent to create a feature branch based on `main` and do your work on this feature branch with this details:
  - Create one feature branch per task ID and commit all subtasks in this same branch (do not create branch for subtasks)
  - Feature branch should follow the pattern `feature/PER-[ID]-[title]`
- **Attention**: If the task is not expanded, ask the @task-master-specialist subagent to expand before start and AFTER the branch is created.

### 2. 🔍 OBTAINING DETAILS

- **Action**: Ask the @task-master-specialist subagent to get full details of the task
- Extract essential information:
  - Title and description
  - Dependencies
  - Acceptance criteria
  - Test strategy
  - Specific technical details

### 3. 🧠 PLANNING WITH DEEPTHINK

- **Action**: Use `deepthink` to create a detailed action plan
- **Planning principles**:
  - ✅ **Simplicity**: Always seek the simplest solution
  - ❌ **Avoid overengineering**: Do not overcomplicate unnecessarily
  - 🎯 **Elegance**: Clean and well-structured solutions
  - 📝 **Documentation**: Clear and executable plan
  - 🔄 **Effective**: Analyze existing code to follow same patterns

**Deepthink plan template**:

```markdown
## Task Analysis
- Main objective:
- Identified dependencies:
- System impact:

## Chosen Approach
- Proposed solution:
- Justification for simplicity:
- Components to be modified/created:

## Implementation Steps
1. [Specific step]
2. [Specific step]
3. [Specific step]

## Validation
- Success criteria:
- Checkpoints:
```

### 4. 📊 STATUS UPDATE - START

- **Action**: Mark the task/subtask as `in-progress` in Task Master (delegate to the @task-master-specialist subagent)
- Confirm that the status has been successfully updated

### 5. ⚙️ IMPLEMENTATION

- Follow the plan created in deepthink
- When developing new components, review existing components and follow the same patterns (hooks usage, variable names, prop names, prop usage, etc.)
- Apply the same repository conventions when writing tests
- Ensure all code shares a consistent look & feel, as if authored by one person at the same time
- Do not create code that will never be used; if something is created and ends up unused, remove it

#### 🔄 Subtask Development Cycle

For tasks with subtasks, follow this cycle for each subtask:

1. **Implement all subtasks** following the deepthink plan
2. **Tests** add all necessary tests for the subtask (delegate the tests development to the @tester-specialist subagent), aim for 100% code coverage or close enough.
3. **Quality check** - Run `pnpm run complete-check` after each subtask implementation
4. **Repeat** for each subtask

- **Principles during implementation**:
  - 🎯 Focus on the essential
  - 📝 Comment code when necessary
  - 🧪 Write tests according to the defined strategy (delegate the tests development to the @tester-specialist subagent)
  - 🔄 Perform incremental refactorings

### 6. 🔍 SUBTASK QUALITY VERIFICATION

- **Action**: Run `pnpm run complete-check` after each subtask implementation
- **If problems are reported**:
  - ⚠️ **MANDATORY** - resolve ALL problems
  - Do not proceed to commit until QA is clean
  - Run again until it passes completely
  - Do not comment/skip tests just because they fail, never
  - If you are still struggling to fix it (cannot fix in 5 interactions, for example), ask for help
  - Do not ASSUME the problem is unrelated to the task. Check, confirm, and ask for help if needed—but regardless of whether it’s related, SOLVE IT.
- **Action**: Ask the agent specialists (identify the ones that are more specialized in the task) to review the changes and apply any suggestion.

### 7. CODE REVIEW

Ask the specialist listed below to review not only the code but the subtask implementation as well. Once you get the feedbacks, generate a code review report with them and apply the suggestions.

- **Action**: Ask the @astro-specialist subagent to review the subtask implementation and provide feedbacks
- **Action**: Ask the @react-specialist subagent to review the subtask implementation and provide feedbacks
- **Action**: Ask the @typescript-specialist subagent to review the subtask implementation and provide feedbacks
- **Action**: Ask the @test-automator subagent to review the subtask implementation and provide feedbacks
- **Action**: Ask the @code-reviewer subagent to review the code and provide feedbacks

- **Important**: Check that no hardcoded strings are used. All strings to be displayed should use the i18n system.

- If the specialists generate at documentation with the review or summary of their analysis, please review them, identify any improvements, issues, suggestions and check if they makes sense to be applied. Once you finish applying all suggestions, please delete the documentation (they should not be committed to the repository).

### 8. 🔍 FINAL QUALITY VERIFICATION (🚨 CRITICAL - BEFORE ANY COMMIT)

**🚨 THIS STEP MUST BE COMPLETED BEFORE MOVING TO COMMIT/PUSH/PR**

- **Action**: When all subtasks are complete, ask @tester-specialist subagent to write an E2E test for the entire task implementation
- **Action**: After ALL subtasks are complete and code review is done and applied, run `pnpm run complete-check` one final time
- **Action**: Ensure entire task implementation works as expected end-to-end
- **If problems are reported**:
  - ⚠️ **MANDATORY** - resolve ALL problems before proceeding
  - This is the final quality gate before task completion
  - If there are problems (even if not related to the subtasks), resolve them, **NEVER** commit code with problems
  - Do not comment/skip tests just because they fail, **NEVER**
  - If you are still struggling to fix it (cannot fix in 5 interactions, for example), ask for help
- **Confirm**: QA check passes 100% clean before proceeding to next step

### 9. ✅ TASK STATUS UPDATE - COMPLETION (🚨 CRITICAL - BEFORE COMMIT)

**🚨 THIS STEP MUST BE COMPLETED BEFORE MOVING TO COMMIT/PUSH/PR**

- **Attention**: Remember to delegate these actions to the @task-master-specialist subagent ONLY
- **Action**: Update the task with complete implementation details covering all subtasks
- **Action**: Mark the task as `done` in Task Master
- **Important**: Task Master specialist ONLY updates task status and details. DO NOT ask them to create development logs.
- Confirm that the status has been updated correctly
- Confirm that all subtasks are marked as complete
- **Wait**: Do NOT proceed to next step until Task Master confirms completion

### 10. 📝 DEVELOPMENT LOGGING (🚨 CRITICAL - BEFORE COMMIT)

**🚨 THIS STEP MUST BE COMPLETED BEFORE MOVING TO COMMIT/PUSH/PR**

- **Attention**: Remember to delegate this action to the @basic-memory-specialist subagent ONLY
- **Action**: Ask the @basic-memory-specialist subagent to create a development log documenting the task implementation
- **Action**: The development log should be saved in `docs/memories/development-logs` as a markdown file with filename format: `Task [ID] [Full Task Title From Task Master].md` (NOT `task-[ID]-...` or shortened titles)
- **Content**: Include task title, implementation approach, files changed/created, tests added, and PR link (placeholder for PR link at this stage)
- **Important**: Task Master specialist does NOT create development logs - only basic-memory-specialist does this
- Confirm that the development log has been created successfully
- **Wait**: Do NOT proceed to next step until development log is confirmed created

### 10.5 🚨 REQUEST USER APPROVAL BEFORE COMMIT (🚨 CRITICAL - MANDATORY)

**🚨 THIS STEP IS MANDATORY AND CANNOT BE SKIPPED**

- **Action**: BEFORE proceeding to commit, ALWAYS ask the user to review all changes
- **Action**: Present a clear summary of:
  - Files changed/created
  - Brief description of changes
  - Proposed commit message
- **Action**: WAIT for explicit user approval/confirmation
- **Action**: If user requests ANY changes:
  - Make the requested changes
  - THEN ask for approval AGAIN before proceeding
  - NEVER assume previous approval still applies after making changes
- **🚨 CRITICAL**: You can ONLY proceed to commit when user explicitly approves
- **NEVER** assume it's ok to commit just because previous steps passed
- **NEVER** commit without explicit user permission

### 11. 📝 COMMIT CYCLE

- **Attention**: Remember to delegate this action to the @git-specialist subagent
- **🚨 CRITICAL - MANDATORY**: BEFORE ANYTHING ELSE - Ask the user to review all changes and wait for explicit approval
  - Present clear summary of files changed/created
  - Show proposed commit message
  - WAIT for user response
  - If user requests changes: make them, THEN ask for approval AGAIN (NEVER assume previous approval still applies)
  - ONLY proceed to commit step when user explicitly approves
- **Action**: Ask me if I did any code change during review. If so, review the changes and use this info for the commit
- **Action**: Run `pnpm run complete-check` one final time before commit
- **Action**: Include all files modified during the task implementation to the commit, even the task master file, development logs, etc. NEVER LEAVE FILE without been commited.
- **🚨 CRITICAL**: ALWAYS ask for explicit permission before committing - NEVER commit without user confirmation
- **Action**: Commit with descriptive message following the pattern below (only after receiving permission)
- **NEVER**: Never include in the commit message or description any reference to the task or subtask ID or any LLM model used. It should only be about the actual work done.
- **NEVER**: When executing the PUSH, wait for the pre-hooks to complete, DO NOT abort it because 'it is taking too long'. You must wait it to finish and do nothing else until it is done.

**Task commit message pattern**:

```bash
type(scope): brief description of actual work done

- Specific changes made in this task
- Files modified/created
- Tests added (if any)
```

### 12. 💾 FINAL PUSH

- **Attention**: Remember to delegate this action to the @git-specialist subagent
- **🚨 CRITICAL**: ALWAYS ask for explicit permission before pushing - NEVER push without user confirmation
- **Action**: Ask permission for final push of all task commits to feature branch (only after receiving permission)
- Only push when all subtasks and task are complete and documented
- **WAIT for explicit user confirmation** before executing the push command

### 13. ⛄ OPENING THE PULL REQUEST

- **Attention**: Remember to delegate this action to the @git-specialist subagent
- **🚨 CRITICAL**: Before create the PR, ask for my approval.
- **Action**: Ask @git-specialist subagent to create a Pull Request with a comprehensive and accurate description of the implementation.
- **Action**: Ask @git-specialist subagent to request review from Copilot
- **NEVER** Add any comment related to the Agent doing the Pull request (for example, avoid any reference to opencode, claude code, gemini, etc) and to the task or subtasks IDs.
- **WAIT for explicit user confirmation** before creating the PR

### 14. 📢 COMPLETION NOTIFICATION

- **Action**: Notify about task completion
- **Notification format**:

```markdown
✅ Task #[ID] completed successfully

📋 [Task title]
✔️ QA: Passed all checks
💾 PR: [PR link]
```

---

### QA Scripts

```bash
# Full QA execution
pnpm run complete-check

# Individual checks (if available)
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

**⚠️ CRITICAL: NEVER RUN MULTIPLE NPM SCRIPTS CONCURRENTLY**

- **ALWAYS** wait for `pnpm run complete-check` to finish completely before running any other command
- **NEVER** run tests while another test process is still running
- **NEVER** run git operations (commit/push) while QA scripts are executing
- Running multiple scripts simultaneously can cause system crashes and resource conflicts
- Be patient and let each script finish before starting the next one

## ⚡ MANDATORY CHECKS

### ✅ Before Starting Development

- [ ] Task clearly understood
- [ ] Load the appropriate CONTEXT.md file, for the project that the task is related to (frontend or api) from docs folder
- [ ] Details obtained via Task Master
- [ ] **Serena MCP activated** - Try to use `serena_activate_project` whenever possible
- [ ] **Project context reviewed** - Use `serena_read_memory` to review relevant project knowledge
- [ ] Deepthink plan created and validated
- [ ] Status updated to `in-progress`

### ✅ During Development

- [ ] Following established plan
- [ ] **ALWAYS try to use Serena MCP**:
  - [ ] read `docs/SERENA.md` to understand available commands
- [ ] Tests being written as needed via @tester-specialist subagent
- [ ] Clean and well-structured code

### ✅ Before Commit

- [ ] Implementation complete as per task
- [ ] QA executed and 100% clean
- [ ] Tests passing
- [ ] Code reviewed

### ✅ Before Final Task Completion

- [ ] All subtasks completed and committed
- [ ] Final QA executed and 100% clean
- [ ] Task status updated to `done`
- [ ] Development log covers entire task
- [ ] All commits ready for final push

### ✅ After Completion

- [ ] Task status updated to `done` via @task-master-specialist subagent
- [ ] Log recorded in basic-memory via @basic-memory-specialist subagent
- [ ] Final push completed with all commits via @git-specialist subagent
- [ ] PR created and Copilot review requested via @git-specialist subagent
- [ ] Completion notification sent

---

## 🚫 NO NO Actions (Development Guidelines)

Based on your development guidelines, here are the **NO NO actions**:

---

## 🔴 Development Workflow Violations

- **NEVER** skip steps in the mandatory development workflow  
- **NEVER** commit when QA fails (`pnpm complete-check` must pass)  
- **NEVER** continue if QA check fails because 'errors were already there'. In cases like this, ask me if you can skip or fix them.
- **NEVER** comment or skip tests because they are failing
- **NEVER** work without marking task in-progress first  
- **NEVER** complete task without documentation (development memory logging)  
- **NEVER** Assume unspecified requirements
- **NEVER** Overengineer solutions
- **NEVER** Include any agent information in the commit message (like Co-Authored-By:)
- **NEVER** reference task or subtask IDs in commit messages - focus purely on the work done
- **NEVER** bypass git hooks with `--no-verify` or similar flags - git hooks are mandatory quality gates
- **🚨 NEVER EVER commit or push without explicit user confirmation** - ALWAYS ask first, no exceptions
- **🚨 NEVER assume user approval carries forward after making requested changes** - If user requests ANY changes, ask for approval AGAIN before proceeding
- **🚨 NEVER run multiple npm/pnpm scripts concurrently** - ALWAYS wait for scripts to finish before running other commands
- **🚨 NEVER proceed with commit/push/PR without asking user first** - At EVERY gate (commit, push, PR), ALWAYS ask "Do you approve?" and WAIT for explicit response
- Under **NO** circumstance commit code when there are issues from QA scripts (even warnings)  
- Code that is not used should be deleted
- **IMPORTANT**: The main branch will always be in a working state (all QA scripts pass), so if you do any change not matter in what part (code, document, etc) and a test fails or a lint error appears, **FIX IT**. **NEVER** say "I will fix it later" or "It has nothing to do with my changes". Also **NEVER** revert the change so test just pass, check why the test is failing and fix it, if the code change is ok (in case of doubt, ask me what to do).

---

## 📁 File Creation Violations

- **NEVER** create files unless absolutely necessary for achieving your goal  
- **NEVER** proactively create documentation files (`*.md`) or README files  
- **ALWAYS** prefer editing existing files to creating a new one  

---

## 🧪 Testing Violations

- **NEVER** use `.spec.ts` extensions – Use `.test.ts` only  
- **NEVER** use `specs` directories – Use `tests` only  
- **ALWAYS** write tests in separated folder from src (but next to it), following the same structure as src
- **NEVER** use `fireEvent` – **ALWAYS** use [`@testing-library/user-event`](https://testing-library.com/docs/user-event/intro)  
- **NEVER** wrap `userEvent` calls in manual `act()` blocks  
- **NEVER** commit tests with warnings  

---

## 🏗 Architecture Violations

- **ALWAYS** get documentation information about libraries from Context7 MCP, before start to using them
- **ALWAYS** use Serena MCP for codebase exploration before making changes
- **NEVER** assume libraries are available – Always check existing usage first  
- **NEVER** add comments unless explicitly asked  
- **NEVER** skip existing patterns – Follow codebase conventions  
- **NEVER** commit secrets or keys to repository  
- **NEVER** modify code without first understanding the existing structure (use `serena_get_symbols_overview`)
- **NEVER** use wildcard imports like `import * as React from 'react'` – ALWAYS import only needed elements:
  - ✅ Correct: `import { forwardRef, type HTMLAttributes, type Ref } from 'react'`
  - ❌ Wrong: `import * as React from 'react'`
  - This improves tree-shaking, bundle size, and code clarity

---

## 🎨 Tailwind CSS and Styling Violations

- **ALWAYS** use Tailwind CSS utility classes for styling – This is the project's styling approach
- **ALWAYS** use design tokens from `tailwind.config.mjs` and CSS variables – **NEVER** use hardcoded values (colors, spacing, etc.)
- **NEVER** use inline `style={{}}` objects – Use Tailwind utility classes instead
- **NEVER** create styles in `global.css` that can be achieved with Tailwind utilities
- **ALWAYS** use the `cn()` utility from `lib/utils.ts` to combine classes conditionally
- **ALWAYS** leverage Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for responsive design
- **ALWAYS** use Tailwind's dark mode classes (`dark:`) for theme support

---

## ✅ The Golden Rule

> Do what has been asked; nothing more, nothing less.

---

## Null vs. Undefined Convention

**Convention**: Use `undefined` for optional/missing values and `null` for explicit "no value" states.

**Rationale**:

- `undefined` represents "value not provided" or "not yet assigned" (default for optional parameters/properties)
- `null` represents an intentional, explicit "no value" state (more semantic)
- Clearer intent in type signatures and easier to distinguish between optional and nullable

**Usage Examples**:

### ❌ Anti-patterns (Discouraged)

```typescript
// Mixing null for optional - unclear intent
interface User {
  name: string;
  nickname: string | null;        // Should be undefined
  email: string | null;           // Should be undefined
}

// Undefined for explicit empty state - less semantic
const result = {
  data: undefined,                // Should be null for explicit "no data" state
};
```

### ✅ Recommended Patterns

```typescript
// Optional properties use undefined
interface User {
  name: string;
  nickname?: string;              // Implicitly User | undefined
  email?: string;                 // Implicitly string | undefined
}

// Explicit empty states use null
type DataResult = {
  data: Record<string, unknown> | null;    // Null = intentional "no data"
  error: Error | null;                     // Null = no error occurred
};

// Function parameters - optional uses undefined
function greet(name: string, title?: string) {
  // title is undefined if not provided
}

// Object property nullability with null
const config = {
  apiKey: null,  // Explicitly set to null (vs never providing the key)
  timeout: 5000,
};
```

**Exception**: DOM attributes may require `undefined` (e.g., `aria-describedby={condition ? "id" : undefined}`).

**Enforcement**: Biome linting rules will catch violations and provide actionable feedback.

---

These are the absolute prohibitions that will break your development workflow, code quality, or project standards.

---

## 🆘 IN CASE OF PROBLEMS

### QA Failing

1. **STOP** all implementation
2. Analyze reported errors
3. Resolve one by one
4. Run QA again
5. Only continue when 100% clean

### Doubts about Requirements

1. **DO NOT ASSUME** - always ask
2. Consult task details in Task Master
3. Request specific clarifications
4. Document clarifications for future reference

### Technical Problems

1. **Use Serena MCP** for codebase exploration and analysis
2. Consult previous development logs (use `serena_read_memory`)
3. Check task dependencies
4. Request specific technical guidance
5. Document solution for similar cases (use `serena_write_memory`)

**Key Serena MCP Use Cases:**

- **File Analysis**: Use `serena_get_symbols_overview` before modifying files
- **Code Search**: Use `serena_find_symbol` and `serena_search_for_pattern` to understand existing implementations
- **Safe Modifications**: Use symbol-based tools (`serena_replace_symbol_body`, `serena_insert_after_symbol`) instead of regex replacements when possible
- **Project Memory**: Use `serena_read_memory` to access project knowledge and `serena_write_memory` to document findings

---

**Remember: This workflow ensures quality, traceability, and consistency. Following each step religiously is fundamental to project success.**
