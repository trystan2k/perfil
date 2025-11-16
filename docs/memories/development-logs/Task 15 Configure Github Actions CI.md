---
title: Task 15 Configure Github Actions CI
type: note
permalink: development-logs/task-15-configure-github-actions-ci
---

## Task 15 Configure Github Actions CI

Two-workflow CI/CD setup: ci.yml for lint/typecheck/test/build, and deploy.yml for deployment to Cloudflare Pages. Includes caching, artifacts, and secrets.

### CI Workflow (ci.yml)
- Triggers PRs and pushes to main
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test:coverage`
- Build: `pnpm build`
- Artifacts: coverage reports and build artifacts

### Deploy Workflow (deploy.yml)
- Triggers on successful CI run
- Builds production bundle and deploys to Cloudflare Pages
- Secrets required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- Project name parameterized via `CLOUDFLARE_PAGES_PROJECT_NAME`

### QA Summary
- CI and Deploy workflows function as expected
- Coverage reports generated and uploaded
