# ROS / Cost Management Plugin — Test Coverage

**Last updated**: 2026-05-20
**Total E2E tests**: 99
**Unit tests**: 9
**Total**: 108

## Summary

| Category                                 | File                                | Tests | Type |
| ---------------------------------------- | ----------------------------------- | ----: | ---- |
| Live cluster smoke                       | `live-cluster.test.ts`              |    21 | E2E  |
| RBAC — dynamic permissions (FLPATH-4207) | `rbac-dynamic-permissions.test.ts`  |    21 | E2E  |
| Table & pagination                       | `table-and-pagination.test.ts`      |    12 | E2E  |
| Marketplace / Extensions                 | `marketplace.test.ts`               |     8 | E2E  |
| OpenShift cost management                | `openshift-cost-management.test.ts` |     8 | E2E  |
| Secure proxy                             | `secure-proxy.test.ts`              |     7 | E2E  |
| Optimization page                        | `optimization.test.ts`              |     7 | E2E  |
| Navigation                               | `navigation.test.ts`                |     6 | E2E  |
| RBAC — role-based access                 | `rbac.test.ts`                      |     5 | E2E  |
| Apply recommendation workflow            | `apply-recommendation.test.ts`      |     2 | E2E  |
| Dark theme                               | `dark-theme.test.ts`                |     2 | E2E  |
| Backend unit tests                       | `router.test.ts`                    |     9 | Unit |

## CI Pipeline

- **Job**: `flightpath-ros-nightly` on Jenkins CI
- **Repo**: `hardengl/rhdh-plugins` branch `feature/resource-optimization-e2e-tests`
- **Schedule**: Every day (Sun–Sat)
- **Profiles**: RHDH 1.8, 1.9, 1.10 on OCP 4.19–4.21
- **Slack**: `#fp-ros-qe-ci`

---

## E2E Tests (Playwright)

### live-cluster.test.ts (21 tests)

Smoke tests against a live RHDH deployment with real Cost Management data.

| #   | Test                                             | What it verifies                        |
| --- | ------------------------------------------------ | --------------------------------------- |
| 1   | Navigate to Resource Optimization page directly  | URL routing works                       |
| 2   | Navigate to Resource Optimization via sidebar    | Sidebar nav entry present and clickable |
| 3   | Display page header correctly                    | Page title renders                      |
| 4   | Display table headers                            | Column headers match expected set       |
| 5   | Load optimization data in table                  | Table has rows with real data           |
| 6   | Display clickable container links                | Container names are links               |
| 7   | Display cluster filter                           | Cluster dropdown renders                |
| 8   | Interact with cluster filter                     | Filter selection changes table data     |
| 9   | Navigate to details page                         | Clicking container goes to detail view  |
| 10  | Display details page tabs                        | Detail page has expected tabs           |
| 11  | Display configuration sections                   | CPU/memory config sections render       |
| 12  | Display utilization charts                       | Chart components render                 |
| 13  | Display Apply recommendation button              | Button present on detail page           |
| 14  | Navigate back to list from details               | Back navigation works                   |
| 15  | Display container details information            | Detail metadata renders                 |
| 16  | Show configuration values in proper format       | Values have units/formatting            |
| 17  | Proper table accessibility attributes            | a11y attributes on table                |
| 18  | Click Apply recommendation button                | Button is interactive                   |
| 19  | Load page within acceptable time                 | Performance threshold                   |
| 20  | Handle multiple page refreshes                   | No state corruption on refresh          |
| 21  | Navigate between list and details multiple times | No navigation bugs                      |

### rbac-dynamic-permissions.test.ts (21 tests)

Verifies the 3-tier RBAC permission model (FLPATH-4207 fix). Tests all tiers:
`ros.plugin` (full access), `ros/<cluster>` (cluster-scoped), `ros/<cluster>/<project>` (project-scoped).

**Dynamic permission effects (5)**

| #   | Test                                       | What it verifies                                       |
| --- | ------------------------------------------ | ------------------------------------------------------ |
| 1   | RORead user sees cluster-specific data     | `ros/<cluster>` permission is registered and evaluated |
| 2   | Full-access user sees data across clusters | Multi-cluster permissions work                         |
| 3   | No-access user is denied                   | DENY default for unregistered users                    |
| 4   | cost.plugin allows OpenShift cost page     | Cost permission grants access                          |
| 5   | Health endpoint confirms plugin running    | Backend plugin health check                            |

**Backend error handling (2)**

| #   | Test                                                 | What it verifies                   |
| --- | ---------------------------------------------------- | ---------------------------------- |
| 6   | Unauthorized API call returns 403, not 500           | Proper HTTP error codes from proxy |
| 7   | Unauthorized OpenShift API call returns 403, not 500 | Same for cost endpoints            |

**Session isolation (1)**

| #   | Test                                                    | What it verifies                                   |
| --- | ------------------------------------------------------- | -------------------------------------------------- |
| 8   | Authorized and unauthorized users see different results | Cross-role isolation via separate browser contexts |

**Tab-level RBAC (4)**

| #   | Test                                                   | What it verifies                    |
| --- | ------------------------------------------------------ | ----------------------------------- |
| 9   | Workflow-only user cannot access Optimizations         | RORead required for Optimizations   |
| 10  | RORead-only user cannot see OpenShift cost data        | CostRead required for OpenShift tab |
| 11  | CostRead user sees OpenShift cost data                 | Cost permission works               |
| 12  | Full-access user sees both Optimizations and OpenShift | Both permissions together           |

**Granular 3-tier model (7)** — _added for FLPATH-4207_

| #   | Test                                                         | What it verifies                                     |
| --- | ------------------------------------------------------------ | ---------------------------------------------------- |
| 13  | Cluster-only user sees optimizations data                    | `ros/<cluster>` is evaluated (not just `ros.plugin`) |
| 14  | Project-only user sees optimizations data                    | `ros/<cluster>/<project>` is evaluated               |
| 15  | Cluster-only user sees FEWER containers than ros.plugin user | Server-side filtering reduces data                   |
| 16  | Project-only user data is subset of cluster-only user        | Tier 3 ⊆ Tier 2                                      |
| 17  | Cluster-only user DENIED on OpenShift cost page              | No `cost.plugin` = no cost data                      |
| 18  | Project-only user DENIED on OpenShift cost page              | Same denial for tier 3                               |
| 19  | Cluster-only user API response has filter applied            | Backend returns correct HTTP status with data        |

**API response verification (2)**

| #   | Test                                             | What it verifies        |
| --- | ------------------------------------------------ | ----------------------- |
| 20  | Authorized user proxy call returns 200 with data | Happy path API          |
| 21  | Unauthorized user proxy returns 403, not 500     | Error handling on proxy |

### table-and-pagination.test.ts (12 tests)

Table rendering, sorting, and pagination on the Optimizations page.

| #   | Test                                         | What it verifies       |
| --- | -------------------------------------------- | ---------------------- |
| 1   | Display all expected column headers          | Correct columns render |
| 2   | Display data rows in the table               | Rows populate          |
| 3   | Display up to 10 rows per page by default    | Default page size      |
| 4   | Sort by Container column when header clicked | Column sorting works   |
| 5   | Toggle sort direction on repeated clicks     | Asc/desc toggle        |
| 6   | Sort by Last reported column                 | Date column sorting    |
| 7   | Display pagination info                      | "1–10 of N" text       |
| 8   | Previous page disabled on first page         | Boundary check         |
| 9   | Next page enabled when more pages            | Boundary check         |
| 10  | Navigate to next page                        | Page transition works  |
| 11  | Navigate back to previous page               | Reverse navigation     |
| 12  | Maintain same row order after page reload    | Deterministic ordering |

### marketplace.test.ts (8 tests)

Extensions Marketplace plugin install flow.

| #   | Test                                                            | What it verifies              |
| --- | --------------------------------------------------------------- | ----------------------------- |
| 1   | FLPATH-2458: Extensions page is accessible                      | Marketplace page loads        |
| 2   | FLPATH-2460: ROS plugin is listed                               | Plugin appears in catalog     |
| 3   | FLPATH-2460: ROS plugin detail page is accessible               | Detail view renders           |
| 4   | FLPATH-2460: ROS plugin can be installed                        | Install workflow completes    |
| 5   | FLPATH-2458: Plugin appears in Installed packages               | Post-install verification     |
| 6   | FLPATH-2458: Plugin sidebar item appears                        | Sidebar updates after install |
| 7   | FLPATH-2458: Plugin sidebar expands (1.9+) or single item (1.8) | Version-aware nav             |
| 8   | FLPATH-2458: Clicking sidebar item navigates to plugin page     | End-to-end install→use        |

### openshift-cost-management.test.ts (8 tests)

OpenShift cost management page functionality.

| #   | Test                                    | What it verifies   |
| --- | --------------------------------------- | ------------------ |
| 1   | Load the OpenShift cost management page | Page renders       |
| 2   | Display the OpenShift cost overview     | Cost data visible  |
| 3   | Display USD as the default currency     | Default currency   |
| 4   | Change currency to EUR                  | Currency switching |
| 5   | Have a CSV export button                | Export UI present  |
| 6   | Have a JSON export button               | Export UI present  |
| 7   | Click CSV export button                 | CSV export works   |
| 8   | Click JSON export button                | JSON export works  |

### secure-proxy.test.ts (7 tests)

Server-side proxy RBAC enforcement.

| #   | Test                                                 | What it verifies               |
| --- | ---------------------------------------------------- | ------------------------------ |
| 1   | Authorized user sees Optimizations data              | Proxy passes data through      |
| 2   | Authorized user sees OpenShift cost data             | Cost proxy works               |
| 3   | Unauthorized user gets Forbidden on Optimizations    | 403 enforcement                |
| 4   | Unauthorized user gets Forbidden on OpenShift tab    | 403 enforcement                |
| 5   | User without ros.apply sees Apply button disabled    | Apply permission check         |
| 6   | User with ros.apply sees Apply button enabled        | Apply permission grants access |
| 7   | Cluster-scoped RBAC works with slash-separated names | Slash separator handling       |

### optimization.test.ts (7 tests)

Optimizations page core functionality (uses mocked API responses).

| #   | Test                                       | What it verifies            |
| --- | ------------------------------------------ | --------------------------- |
| 1   | Display Resource Optimization page         | Page renders                |
| 2   | Display clusters dropdown                  | Filter UI present           |
| 3   | Display optimization recommendations       | Data renders in cards/table |
| 4   | Display empty state when no optimizations  | Empty state UX              |
| 5   | Validate optimization card accessibility   | a11y compliance             |
| 6   | Handle cluster filter interaction          | Filter changes data         |
| 7   | Click container link and view details page | Navigation to detail        |

### navigation.test.ts (6 tests)

Sidebar navigation and URL routing.

| #   | Test                                            | What it verifies  |
| --- | ----------------------------------------------- | ----------------- |
| 1   | Display sidebar nav entry for Optimizations     | Nav item present  |
| 2   | Expand nav group to show Optimizations sub-item | Nested nav (1.9+) |
| 3   | Navigate to Optimizations page via sidebar      | Click-through nav |
| 4   | Navigate to OpenShift page via sidebar          | Cost tab nav      |
| 5   | Navigate directly to Optimizations via URL      | Direct URL access |
| 6   | Navigate directly to OpenShift page via URL     | Direct URL access |

### rbac.test.ts (5 tests)

Basic RBAC role verification (RORead, ROApply, no-access).

| #   | Test                                                | What it verifies                |
| --- | --------------------------------------------------- | ------------------------------- |
| 1   | See optimization data with RORead role              | Read access works               |
| 2   | Apply recommendation button disabled (no ros.apply) | Apply denied without permission |
| 3   | See data and Apply button enabled (full access)     | Full access works               |
| 4   | Unauthorized error on ROS page (costmgmt-no-access) | No-access user denied           |
| 5   | Unauthorized error on ROS page (costmgmt-no-rbac)   | No-RBAC user denied             |

### apply-recommendation.test.ts (2 tests)

Apply Recommendation workflow (triggers Orchestrator workflow).

| #   | Test                                              | What it verifies        |
| --- | ------------------------------------------------- | ----------------------- |
| 1   | Complete Apply Recommendation workflow end-to-end | Full workflow execution |
| 2   | Show Apply recommendation button on detail page   | Button visibility       |

### dark-theme.test.ts (2 tests)

Dark theme rendering.

| #   | Test                                               | What it verifies             |
| --- | -------------------------------------------------- | ---------------------------- |
| 1   | Switch to dark theme and display readable table    | Table contrast in dark mode  |
| 2   | Render charts section on detail page in dark theme | Chart rendering in dark mode |

---

## Unit Tests (Jest)

### router.test.ts (9 tests)

Backend router and RBAC permission registration logic.

**extractStrings (5)**

| #   | Test                                     | What it verifies                 |
| --- | ---------------------------------------- | -------------------------------- |
| 1   | Returns values from a fulfilled result   | Happy path extraction            |
| 2   | Returns empty set for rejected result    | Error resilience                 |
| 3   | Returns empty set when data is undefined | Null safety                      |
| 4   | Deduplicates values                      | Set behavior                     |
| 5   | Skips falsy values from accessor         | Undefined/empty string filtering |

**buildClusterProjectPermissions (3)**

| #   | Test                                              | What it verifies                         |
| --- | ------------------------------------------------- | ---------------------------------------- |
| 6   | Builds cluster + cluster/project combinations     | Cartesian product of clusters × projects |
| 7   | Returns only cluster perms when projects is empty | Edge case: no projects                   |
| 8   | Returns empty array when clusters is empty        | Edge case: no clusters                   |

**createRouter (1)**

| #   | Test                   | What it verifies           |
| --- | ---------------------- | -------------------------- |
| 9   | GET /health returns ok | Health endpoint basic test |

---

## Test Infrastructure

| File                                | Purpose                                                    |
| ----------------------------------- | ---------------------------------------------------------- |
| `fixtures/auth.ts`                  | Keycloak OIDC login helpers for different RBAC users       |
| `fixtures/optimizationResponses.ts` | Mock API response data for offline tests                   |
| `pages/ResourceOptimizationPage.ts` | Page Object Model for Optimizations pages                  |
| `utils/apiUtils.ts`                 | API interception and response capture utilities            |
| `utils/devMode.ts`                  | Dev-mode-specific test helpers                             |
| `utils/routes.ts`                   | Route resolution (handles ROS 1.2.x vs 1.3.x+ differences) |
| `global-setup.ts`                   | Global Playwright setup (auth, browser config)             |
| `playwright.config.ts`              | Playwright configuration                                   |

## Coverage Gaps / Known Limitations

1. **Dynamic permission refresh**: Permissions are registered once at startup. No test for runtime cluster additions.
2. **Concurrent user sessions**: Tests run sequentially per user, not concurrently.
3. **Apply Recommendation flaky**: The workflow test (`apply-recommendation.test.ts`) depends on Orchestrator pod health and is known to be flaky.
4. **Cost management filtering**: No E2E tests yet for `cost/<cluster>` and `cost/<cluster>/<project>` tier 2/3 filtering (only `cost.plugin` tier 1 is tested).
5. **Backstage pod restart tolerance**: Tests can fail if the Backstage pod restarts mid-suite (e.g., during operator reconciliation).

## Related Jira Tickets

| Ticket                                                         | Description                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [FLPATH-4207](https://redhat.atlassian.net/browse/FLPATH-4207) | 3-tier RBAC model broken (cluster/project permissions never evaluated) |
| [FLPATH-4209](https://redhat.atlassian.net/browse/FLPATH-4209) | Fix documentation with screenshots, audit logs, and test evidence      |
| [FLPATH-3137](https://redhat.atlassian.net/browse/FLPATH-3137) | Original RBAC test case (missed 3-tier gap)                            |
| [FLPATH-2458](https://redhat.atlassian.net/browse/FLPATH-2458) | Extensions Marketplace plugin install tests                            |
| [FLPATH-2460](https://redhat.atlassian.net/browse/FLPATH-2460) | ROS plugin marketplace listing tests                                   |
