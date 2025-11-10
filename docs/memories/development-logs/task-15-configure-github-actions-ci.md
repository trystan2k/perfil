# Task 15: Configure GitHub Actions CI/CD Pipeline

**Status:** ✅ Completed  
**Priority:** High  
**Started:** 2025-11-10  
**Completed:** 2025-11-10

## Objective

Create a comprehensive GitHub Actions CI/CD pipeline that runs quality checks (linting, type checking, tests with coverage, and build) on PRs and pushes to `main`, with automated deployment to Cloudflare Pages.

## Implementation Summary

### Final Architecture: Separate CI and Deploy Workflows

After initial implementation and review, refactored to use **two separate workflows** for better separation of concerns:

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Pull requests and pushes to `main`

**Job: quality-checks**

- **Environment:** Ubuntu Latest, Node.js 24.x, pnpm 10
- **Caching:** pnpm store caching for faster subsequent runs
- **Quality Gates:**
  1. Lint: `pnpm lint` (Biome checks)
  2. Type Check: `pnpm typecheck` (TypeScript + Astro)
  3. Test Coverage: `pnpm test:coverage` (Vitest with 80% thresholds)
  4. Build: `pnpm build` (Production bundle)
- **Artifacts:**
  - Coverage reports (`coverage/`) - always uploaded, 7-day retention
  - Build artifacts (`dist/`) - only on success, 1-day retention (for deploy workflow)

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:** 
- After successful CI workflow completion on `main` branch
- Manual dispatch via `workflow_dispatch` for on-demand deployments

**Job: deploy**
- **Condition:** Only runs if CI workflow succeeded on main branch
- **Process:**
  1. Checkout code
  2. Setup Node.js & pnpm (with caching)
  3. Install dependencies
  4. Build production bundle (fresh build, not using artifacts)
  5. Deploy to Cloudflare Pages using `wrangler-action@v3`
- **Configuration:**
  - Uses repository variable `CLOUDFLARE_PAGES_PROJECT_NAME` instead of hardcoded project name
  - Provides flexibility to change project name without modifying workflow
- **Required Secrets:**
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- **Required Variables:**
  - `CLOUDFLARE_PAGES_PROJECT_NAME` (e.g., "perfil")

### Architecture Decision: Why Separate Workflows?

**Advantages of Two Workflows:**

1. **Clearer Separation of Concerns** - CI checks vs deployment are independent
2. **Better Observability** - Two workflow runs in GitHub UI for clear visibility
3. **More Flexible** - Can trigger deployment manually or rerun without rerunning tests
4. **Faster PR Feedback** - PRs only run CI checks, no deployment overhead
5. **Industry Standard** - Separating CI from CD is a best practice
6. **Easier to Maintain** - Each workflow has a single, clear purpose

**Why Not Single Workflow:**

- Single workflow uploads artifacts even on PRs (wasteful)
- Mixed concerns in one file
- Less flexible for manual deployments
- Deploy job still requires conditional logic

## Documentation Updates

Updated all references from Render to Cloudflare Pages:

- PRD section 16: CI/CD deployment strategy
- Task Master task #15 and subtask 6
- Verified no other Render hosting references exist

## Subtasks Completed

1. ✅ **Subtask 15.1:** Base CI workflow with triggers and dependency installation
2. ✅ **Subtask 15.2:** Linting and type checking steps
3. ✅ **Subtask 15.3:** Test execution and coverage generation
4. ✅ **Subtask 15.4:** Production build step
5. ✅ **Subtask 15.5:** Upload of build and coverage artifacts
6. ✅ **Subtask 15.6:** Conditional deploy job to Cloudflare Pages

## Commits

**Initial Implementation:**

- `5a8c0d3`: Documentation updates (Render → Cloudflare Pages)
- `972e7b5`: Complete CI/CD pipeline implementation (single workflow)
- `a1d21b6`: Development log for task 15

**Refactoring to Separate Workflows:**

- Refactored from single workflow with two jobs to two separate workflows
- Improved separation of concerns and flexibility
- Deploy workflow now rebuilds (doesn't rely on artifacts from CI)

## Test Strategy

### Verification Steps

1. **Lint Failure Test:**
   - Create PR with intentional linting error
   - Verify CI job fails at lint step
   - Fix and verify passes

2. **Type Error Test:**
   - Introduce type error
   - Verify CI job fails at typecheck step
   - Fix and verify passes

3. **Test Failure Test:**
   - Create failing test
   - Verify CI job fails at test step
   - Fix and verify passes

4. **Build Verification:**
   - Verify build step completes successfully
   - Check build artifacts are uploaded

5. **Coverage Artifacts:**
   - Verify coverage reports are uploaded
   - Confirm accessibility in workflow run UI

6. **Deployment Verification:**
   - Configure Cloudflare secrets in repository settings
   - Push to feature branch → verify deploy workflow does NOT trigger
   - Merge to `main` → verify deploy workflow triggers after CI success

## Technical Details

### CI Workflow Triggers

```yaml
# ci.yml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
```

### Deploy Workflow Triggers

```yaml
# deploy.yml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]
```

### Key Actions Used

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `pnpm/action-setup@v4`
- `actions/cache@v4`
- `actions/upload-artifact@v4` (CI workflow only)
- `cloudflare/wrangler-action@v3` (Deploy workflow only)

### Quality Standards Enforced

- Code style consistency (Biome)
- Type safety (TypeScript strict mode)
- Test coverage thresholds (80% minimum)
- Build validation (production-ready output)

## Next Steps

1. Configure Cloudflare Pages project in dashboard
2. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Add repository variable:
   - `CLOUDFLARE_PAGES_PROJECT_NAME` (e.g., "perfil")
4. Test full deployment flow with PR → merge → deploy
5. Test manual deployment via workflow_dispatch

## Post-Implementation Improvements

After the initial implementation, the following improvements were made by the user:

### 1. Added Manual Deployment Trigger
- Added `workflow_dispatch` trigger to deploy workflow
- Allows manual deployment on-demand without waiting for CI completion
- Useful for hotfixes or manual production releases

### 2. Parameterized Project Name
- Changed from hardcoded project name (`perfil`) to repository variable
- Now uses `${{ vars.CLOUDFLARE_PAGES_PROJECT_NAME }}`
- Benefits:
  - Environment-agnostic workflow configuration
  - Easier to reuse workflow across different projects/environments
  - No workflow file changes needed when project name changes
  - Follows best practice of separating configuration from code

**Updated deploy command:**
```yaml
command: pages deploy dist --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT_NAME }}
```

## Lessons Learned

1. **Separate Workflows are Better:** After review, refactored from single workflow to two separate workflows for clearer separation of concerns and better observability
2. **workflow_run Trigger:** Using `workflow_run` to chain workflows is more flexible than job dependencies within a single workflow
3. **Fresh Builds for Deploy:** Deploy workflow rebuilds instead of using artifacts, ensuring consistency and reducing artifact dependency issues
4. **Conditional Uploads:** Use `if: always()` for coverage reports and `if: success()` for build artifacts to optimize artifact storage
5. **Caching Strategy:** pnpm store caching significantly reduces CI run time
6. **Sequential Quality Gates:** Each check fails fast, providing quick feedback
7. **Documentation Consistency:** Ensuring all docs reflect current deployment strategy is crucial

## Related Tasks

- **Task 13:** Vitest test coverage configuration (dependency)
- **Task 14:** Git hooks with Husky + lint-staged (dependency)
- **Task 1:** Project tooling setup (dependency)

## Quality Check

All checks passing:

- ✅ Lint: No issues
- ✅ Typecheck: No errors
- ✅ Tests: 55 passing (4 test files)
- ✅ Build: Successful production bundle
