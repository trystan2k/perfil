# Development Workflow Guide

## 🚨 CRITICAL: MANDATORY READING AFTER CONVERSATION COMPACTION

**AFTER ANY CONVERSATION COMPACTION (summary/compact action), you MUST:**

1. ✅ **IMMEDIATELY** read `docs/DEV_WORKFLOW.md` in full
2. ✅ **IMMEDIATELY** read `docs/LESSONS_LEARNED.md` in full
3. ✅ **STRICTLY** follow all rules in these files - no exceptions
4. ✅ **GO** proceed the pending task in the conversation following the dev workflow

## ⛔ CRITICAL: AUTHORIZATION REQUIRED

**🚨 NEVER START ANY TASK WITHOUT EXPLICIT USER AUTHORIZATION 🚨**

You MUST:

- ❌ **NEVER** checkout branches without authorization
- ❌ **NEVER** expand tasks without authorization
- ❌ **NEVER** create feature branches without authorization
- ❌ **NEVER** begin implementation without authorization
- ❌ **NEVER** run git commands (commit/push/etc.) without authorization
- ❌ **NEVER** commit or push - ALWAYS ask for explicit permission first
- ✅ **ALWAYS** wait for the user to explicitly tell you: "Start task #X" or similar

## ⚠️ ### FUNDAMENTAL PRINCIPLES

THESE INSTRUCTIONS ARE MANDATORY and must be strictly followed throughout development. No item can be neglected. NEVER ASSUME ANYTHING - ALWAYS ASK IF IN DOUBT.

- **Attention**: NEVER, NEVER start to implement a task without been requested to do so.
- Also always start the task from the `main` branch and ensure it is up-to-date with remote.
- **Important**: Remember that this project use `pnpm`.

## 🔄 STANDARD WORKFLOW

### 1. 📋 TASK RECEPTION

- **Action**: Await clear instructions on which task to implement
- Receive the task or subtask to be developed
- Identify the task ID in the Task Master system
- **Action**: Check if task is already implemented, if so, ask for clarification
- Ensure that your are at `main` branch, otherwise, checkout it.
- **Action**: Run `git pull` to ensure that your branch is up-to-date with remote.
- **Attention**:If there are changes that are not committed, stash them checkout and pull `main` and then unstash the changes.
- **Action**: Create a feature branch based on `main` and do your work on this feature branch
- Create one feature branch per task ID and commit all subtasks in this same branch (do not create branch for subtasks)
- Feature branch should follow the pattern `feature/PER-[ID]-[title]`
- **Action**: Check if task is already expanded, otherwise expand it using task-master

### 2. 🔍 OBTAINING DETAILS

- **Action**: Use **Task Master CLI** to get full details
- Task master CLI commands can be found at `docs/TASK_MASTER.md`
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

- **Action**: Mark the task/subtask as `in-progress` in Task Master
- Confirm that the status has been successfully updated

### 5. ⚙️ IMPLEMENTATION

- Follow the plan created in deepthink

#### 🔄 Subtask Development Cycle

For tasks with subtasks, follow this cycle for each subtask:

1. **Implement subtask** following the deepthink plan
2. **Quality check** - Run `pnpm run complete-check` after each subtask implementation
3. **Repeat** for each subtask

- **Principles during implementation**:
  - 🎯 Focus on the essential
  - 📝 Comment code when necessary
  - 🧪 Write tests according to the defined strategy
  - 🔄 Perform incremental refactorings

### 6. 🔍 SUBTASK QUALITY VERIFICATION

- **Action**: Run `pnpm run complete-check` after each subtask implementation
- **If problems are reported**:
  - ⚠️ **MANDATORY** - resolve ALL problems
  - Do not proceed to commit until QA is clean
  - Run again until it passes completely
  - Do not comment/skip tests just because they fail, never
  - If you are still struggling to fix it (cannot fix in 5 interactions, for example), ask for help
- **Action**: Ask the agent specialists (identify the ones that are more specialized in the task) to review the changes and apply any suggestion.

### 7. 🔍 FINAL QUALITY VERIFICATION

- **Action**: After ALL subtasks are complete, run `pnpm run complete-check` one final time
- **Action**: Ensure entire task implementation works as expected
- **If problems are reported**:
  - ⚠️ **MANDATORY** - resolve ALL problems
  - This is the final quality gate before task completion
  - If there are problems (even if not related to the subtasks), resolve them, **NEVER** commit code with problems
  - Do not comment/skip tests just because they fail, **NEVER**
  - If you are still struggling to fix it (cannot fix in 5 interactions, for example), ask for help

### 8. ✅ TASK STATUS UPDATE - COMPLETION

- **Action**: Update the task with complete implementation details covering all subtasks
- **Action**: Mark the task as `done` in Task Master
- Confirm that the status has been updated correctly
- Confirm that all subtasks are marked as complete

### 9. 📝 DEVELOPMENT LOGGING

- **Action**: Use **Basic Memory MCP** to log development details of the task.
- **Action**: Once it is inserted in basic memory DB, export the memory for the task to a physical file to `docs/memories/development-logs`

### 10. 📝 COMMIT CYCLE

- **Action**: Before commit, ask me to review the changes and only continue after my ok
- **Action**: Ask me if I did any code change during review. If so, review the changes and use this info for the commit
- **Action**: Run `pnpm run complete-check` one final time before commit
- **Action**: Include all files modified during the task implementation to the commit, even the task master file, development logs, etc.
- **🚨 CRITICAL**: ALWAYS ask for explicit permission before committing - NEVER commit without user confirmation
- **Action**: Commit with descriptive message following the pattern below (only after receiving permission)
- **NEVER**: Never include in the commit message or description any reference to the task or subtask ID or any LLM model used. It should only be about the actual work done.

**Task commit message pattern**:

```bash
type(scope): brief description of actual work done

- Specific changes made in this task
- Files modified/created
- Tests added (if any)
```

### 12. 💾 FINAL PUSH

- **🚨 CRITICAL**: ALWAYS ask for explicit permission before pushing - NEVER push without user confirmation
- **Action**: Ask permission for final push of all task commits to feature branch (only after receiving permission)
- Only push when all subtasks and task are complete and documented

### 13. ⛄ OPENING THE PULL REQUEST

- **Action**: Before create the PR, ask for my approval.
Use the Github MCP (or if not available Github CLI) to open a PR with a comprehensive and accurate description of the implementation.
- **Action**: Use Github MCP to request review from Copilot
**NEVER** Add any comment releated to the Agent doing the Pull request (for example, avoid any reference to opencode, claude code, gemini, etc) and to the task or subtasks IDs.

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

## ⚡ MANDATORY CHECKS

### ✅ Before Starting Development

- [ ] Task clearly understood
- [ ] Load the appropriate CONTEXT.md file, for the project that the task is related to (frontend or api) from docs folder
- [ ] Details obtained via Task Master
- [ ] **Serena MCP activated** - Use `serena_activate_project` if needed
- [ ] **Project context reviewed** - Use `serena_read_memory` to review relevant project knowledge
- [ ] Deepthink plan created and validated
- [ ] Status updated to `in-progress`

### ✅ During Development

- [ ] Following established plan
- [ ] **ALWAYS try to use Serena MCP**:
  - [ ] read `docs/SERENA.md` to understand available commands
- [ ] Tests being written as needed
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

- [ ] Task status updated to `done`
- [ ] Log recorded in Basic Memory MCP
- [ ] Final push completed with all commits
- [ ] PR created and Copilot review requested
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
- Under **NO** circumstance commit code when there are issues from QA scripts (even warnings)  

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

## 🎨 CSS Modules and Styling Violations

- **ALWAYS** use CSS Modules for component-specific styling – **NEVER** use inline styles or global CSS classes
- **ALWAYS** co-locate CSS Module files with their components (`Component.tsx` + `Component.module.css`)
- **ALWAYS** use design tokens in CSS files – **NEVER** use hardcoded values (colors, spacing, etc.)
- **NEVER** create styles in `global.css` that should be component-specific
- **NEVER** use `style={{}}` inline objects – Use CSS Modules instead
- **NEVER** reference CSS Module classes by string names in tests – Import and use the styles object
- **NEVER** skip CSS Modules for new components – It's the mandatory styling approach

---

## ✅ The Golden Rule

> Do what has been asked; nothing more, nothing less.

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
