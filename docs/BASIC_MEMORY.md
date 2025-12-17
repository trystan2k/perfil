# Basic Memory - Agent Integration Guide

## Essential Commands

### Core Workflow Commands

```bash
# Project Management
basic-memory project list                                   # List all configured projects with status
basic-memory project add <name> <path>                      # Create/register a new project
basic-memory project default <name>                         # Set the default project
basic-memory project remove <name>                          # Remove a project (doesn't delete files)
basic-memory project info                                   # Show detailed project statistics

# Note Operations
basic-memory tool write-note --title "Title" --content "Content" --project perfil --folder "folder/path" # Create/update a note
basic-memory tool write-note --title "Title" --project perfil --folder "folder/path"                     # Create note in specific folder
basic-memory tool write-note --title "Title" --tags "tag1" --tags "tag2" --project perfil --folder "folder/path" # Create note with tags
basic-memory tool search-notes "search term"  --project perfil                        # Search notes

basic-memory import memory-json /path/to/memory.json        # Import Memory JSON format
basic-memory --project=work import claude conversations     # Import to specific project

# System Status
basic-memory status                                         # Basic status check
basic-memory status --verbose                               # Detailed status with diagnostics
basic-memory status --json                                  # JSON output format
basic-memory --version                                      # Check installed version
```

### Using stdin with write-note

Basic Memory supports piping content directly to notes:

```bash
# Pipe command output to note
echo "Content here" | basic-memory tool write-note --title "Title" --folder "development-logs" --project perfil

# Pipe file content to note
cat README.md | basic-memory tool write-note --title "Project README" --folder "development-logs" --project perfil

# Using heredoc for multi-line content
cat << EOF | basic-memory tool write-note --title "Meeting Notes" --folder "development-logs" --project perfil
# Meeting Notes

## Action Items
- Item 1
- Item 2
EOF

# Input redirection from file
basic-memory tool write-note --title "Notes" --folder "development-logs" --project perfil < input.md
```

## OpenCode Workflow Integration

### Development Logging Workflow

#### Creating Development Logs After Task Completion

The basic-memory specialist is responsible for creating development logs **AFTER** task implementation is complete and **BEFORE** committing code.

**Standard Development Log Creation Pattern:**

```bash
# Create development log for completed task
basic-memory tool write-note \
  --title "Task [ID]: [Task Title]" \
  --folder "development-logs" \
  --project "perfil" \
  --tags "development-log" --tags "task-[ID]" \
  --content "$(cat << EOF
# Task [ID]: [Task Title]

## Task Overview
- **Task ID**: [ID]
- **Status**: Done
- **Implementation Date**: [Date]

## Implementation Approach
[Brief description of the approach taken]

## Files Changed/Created
- \`path/to/file1.ts\` - [Description of changes]
- \`path/to/file2.tsx\` - [Description of changes]
- \`path/to/test.test.ts\` - [Test coverage added]

## Tests Added
- [Description of tests added]
- Coverage: [X%]

## Key Decisions
- [Important technical decisions made]
- [Patterns followed/established]

## Pull Request
- PR: [Placeholder - will be updated after PR creation]

## Notes
- [Any additional context, learnings, or future considerations]
EOF
)"
```

### File Naming Convention for Development Logs

**MANDATORY**: Development logs **MUST** be saved with this exact filename format:

```
Task [ID] [Full Task Title From Task Master].md
```

**CRITICAL REQUIREMENTS:**
1. Start with capital **T**: `Task` (NOT `task`)
2. Space after ID number: `Task [ID] ` (NOT `Task[ID]` or `task-[ID]`)
3. Use the **EXACT full title** from Task Master (NOT shortened or modified)
4. Use **spaces** to separate words (NOT hyphens or underscores)
5. End with `.md` extension
6. File must be saved in `development-logs` folder

**CORRECT Examples:**

- ✅ `Task 1 Implement User Authentication.md`
- ✅ `Task 2 Add Validation Logic.md`
- ✅ `Task 3 Setup Database Schema.md`
- ✅ `Task 70 Strengthen Zod Schema Type Definitions and Export Validation Helpers.md`

**WRONG Examples (DO NOT USE):**

- ❌ `task-1-implement-user-authentication.md` (lowercase, hyphens)
- ❌ `Task1ImplementUserAuthentication.md` (no space after ID, no spaces)
- ❌ `Task 1 user auth.md` (shortened title, not exact)
- ❌ `task-70-zod-schema-type-definitions.md` (hyphens, shortened title)

### Development Log Content Requirements

Each development log **MUST** include:

1. **Task Overview**
   - Task ID (from Task Master)
   - Status (must be "Done" when creating log)
   - Implementation date

2. **Implementation Approach**
   - High-level description of the solution
   - Why this approach was chosen
   - Reference to deepthink plan if applicable

3. **Files Changed/Created**
   - List ALL files modified or created
   - Brief description of changes per file
   - Include test files

4. **Tests Added**
   - Description of test coverage
   - Test types (unit, integration, e2e)
   - Coverage percentage

5. **Key Decisions**
   - Important technical decisions
   - Patterns followed or established
   - Trade-offs made

6. **Pull Request**
   - Placeholder for PR link (to be updated after PR creation)

7. **Notes** (optional)
   - Learnings from implementation
   - Future considerations
   - Known limitations or technical debt

It always must contain the info about all changes made to the codebase, including files created, modified, and deleted, not only in the last commit, last iteration, or last message.

### Using stdin for Development Logs (Recommended)

For cleaner command execution and better multi-line content handling:

```bash
cat << EOF | basic-memory tool write-note --title "Task 1: User Authentication" \
  --folder "development-logs" \
  --project "perfil" \
  --tags "development-log" --tags "task-1"
# Task 1: User Authentication

## Task Overview
- **Task ID**: 1
- **Status**: Done
- **Implementation Date**: 2024-12-16

## Implementation Approach
Implemented JWT-based authentication following the existing auth pattern.
Used bcrypt for password hashing and established middleware for route protection.

## Files Changed/Created
- \`src/lib/auth.ts\` - Core authentication logic with JWT generation
- \`src/middleware/authMiddleware.ts\` - Route protection middleware
- \`src/components/LoginForm.tsx\` - Login UI component
- \`src/__tests__/auth.test.ts\` - Authentication unit tests
- \`e2e/tests/authentication.e2e.ts\` - End-to-end auth tests

## Tests Added
- Unit tests for token generation and validation
- Unit tests for password hashing
- Integration tests for login/logout flow
- E2E tests for complete authentication journey
- Coverage: 98%

## Key Decisions
- Used JWT over session-based auth for scalability
- Followed existing middleware pattern from task 1.1
- Stored tokens in httpOnly cookies for security

## Pull Request
- PR: [To be updated]

## Notes
- Auth middleware can be reused for API routes in future tasks
- Consider implementing refresh token rotation in future
EOF
```

## Important Usage Rules

### Note Creation Rules

1. **Always use specific folder paths**
   - Development logs: `development-logs`
   - Never create notes in root; always specify folder

2. **Use descriptive titles**
   - Format: `Task [ID]: [Descriptive Title]`
   - Must match the task title from Task Master

3. **Always add tags**
   - Minimum: `development-log` tag
   - Add task-specific tag: `task-[ID]`
   - Add additional relevant tags as needed

4. **Use stdin for multi-line content**
   - Preferred method for development logs
   - Avoids escaping issues
   - Cleaner command syntax

5. **Always include project name**
   - The project name is the name of the repository, if any doubt, ask the user.

### Content Formatting Rules

1. **Use Markdown format**
   - Headers: `#`, `##`, `###`
   - Lists: `-` for unordered, `1.` for ordered
   - Code: Backticks for inline, triple backticks for blocks
   - Bold: `**text**`, Italic: `*text*`

2. **File paths must use backticks**
   - Correct: `` `src/components/Button.tsx` ``
   - Wrong: `src/components/Button.tsx`

3. **Include date in ISO format**
   - Format: `YYYY-MM-DD`
   - Example: `2024-12-16`

## OpenCode Best Practices with Basic Memory

### When to Create Development Logs

✅ **ALWAYS create development logs:**

- After task implementation is complete
- After all QA checks pass
- After code review is complete
- BEFORE committing code
- BEFORE creating pull request

❌ **NEVER create development logs:**

- Before implementation starts
- During implementation
- For tasks that are not complete
- For tasks that failed QA

### Typical Interaction Pattern

```
Main Agent → @basic-memory-specialist:
  "Create a development log for task 1: User Authentication.
   The task is complete with the following details:
   - Files changed: [list]
   - Tests added: [list]
   - Implementation approach: [summary]"

Basic Memory Specialist:
  1. Gather all relevant information
  2. Format as structured markdown
  3. Create note using write_note tool with stdin
  4. Save to development-logs
  5. Use filename: task-1.2-user-authentication.md
  6. Confirm successful creation to main agent

Main Agent:
  Wait for confirmation before proceeding to commit
```

## Project Structure

### Core Files

- `development-logs/*.md` - Individual development log files
- `.basic-memory/` - Basic Memory data directory (auto-managed)
- Project-specific memory folder as configured

## Troubleshooting

### Note Creation Fails

```bash
# Check Basic Memory status
basic-memory status --verbose

# Verify project configuration
basic-memory project list
basic-memory project info

# Check permissions on target directory
ls -la docs/memories/development-logs/
```

### Content Formatting Issues

1. Escape special characters properly
2. Use stdin method for complex content
3. Verify markdown syntax before writing
4. Use heredoc for multi-line content


## Important Notes

### CLI

- **CLI**: Always use the CLI, never write the notes by yourself

### File Management

- Notes are stored as markdown files
- Basic Memory manages organization automatically
- Manual file edits are supported but not recommended
- Use tools for all note operations to maintain consistency

### Multi-Project Support

- Projects can be switched instantly
- Use `--project` flag to target specific project
- Default project used when flag is omitted
- All commands support project targeting

---

## 📋 Basic Memory Violations

### NEVER Actions

- **NEVER** create development logs before implementation is complete
- **NEVER** create development logs without proper folder structure
- **NEVER** skip required fields in development logs
- **NEVER** use incorrect filename format for development logs - **MUST BE**: `Task [ID] [Full Title].md` with spaces (NOT hyphens/underscores/lowercase)
- **NEVER** use shortened or modified titles - use the **EXACT** title from Task Master
- **NEVER** create logs for tasks that haven't passed QA
- **NEVER** manually edit Basic Memory database files
- **NEVER** create notes without proper tags
- **NEVER** reference task/subtask IDs in commit messages (only in development logs)
- **NEVER** save development logs with hyphens, underscores, or lowercase "task" prefix

### ALWAYS Actions

- **ALWAYS** create development logs in `development-logs` folder
- **ALWAYS** use filename format: `Task [ID] [Full Task Title From Task Master].md`
- **ALWAYS** use spaces between words (NOT hyphens or underscores): `Task 70 Strengthen Zod Schema...` ✅ (NOT `task-70-strengthen-zod-schema...` ❌)
- **ALWAYS** use the exact, complete title from Task Master (verify in Task Master CLI before creating)
- **ALWAYS** start filename with capital "T" in "Task"
- **ALWAYS** include all required fields in development logs
- **ALWAYS** add `development-log` tag to all dev logs
- **ALWAYS** use stdin method for multi-line content
- **ALWAYS** wait for QA to pass before creating logs
- **ALWAYS** create log before commit/push/PR
- **ALWAYS** confirm successful creation to main agent
- **ALWAYS** use markdown formatting consistently

---

_This guide ensures the basic-memory specialist has immediate access to Basic Memory's essential functionality for development logging workflows in the perfil project._
