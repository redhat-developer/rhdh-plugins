---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': minor
---

Add 13 new GitHub metrics across four domains:

**Issue and PR counts (5 metrics):**

- Currently open issues
- Issues opened in the last 7 days
- PRs opened in the last 7 days
- Issues closed in the last 7 days
- PRs closed in the last 7 days

**PR lifecycle timing (3 metrics):**

- Average time to first review (days)
- Average time to first approval (days)
- Average time to merge (days)

Computed from PRs updated in the last 7 days.

**GitHub Actions (5 metrics):**

- Workflow runs started in the last 7 days
- Successfully completed runs in the last 7 days
- Failed runs in the last 7 days
- Success ratio for 7 days (percentage)
- Success ratio for 24 hours (percentage)

Non-terminal runs (pending, running, cancelled) are excluded from success/failure counts and ratio calculations.

**CI pass rate (2 metrics, batch provider):**

- First-time CI pass rate for 7 days (percentage)
- First-time CI pass rate for 24 hours (percentage)

Checks CI status on the last commit of the first push to each PR. PRs without CI checks are excluded.

All new providers follow the existing `MetricProvider` pattern with `github.`-prefixed provider IDs and use GraphQL for issue/PR queries and REST API for workflow runs.
