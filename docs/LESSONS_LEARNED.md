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
