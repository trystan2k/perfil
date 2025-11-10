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
