# @red-hat-developer-hub/backstage-plugin-bulk-import

## 7.3.3

### Patch Changes

- 9beb261: Scope JSS class names with a unique seed to prevent style collisions with
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.3.3

## 7.3.2

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.3.2

## 7.3.1

### Patch Changes

- 4522d8c: - Fixed duplicate header in NFS app by adding `noHeader: true` to the PageBlueprint configuration
  - Persist selected approval tool (GitHub/GitLab) in URL parameter to survive page refresh
  - Fixed large empty space between table rows and pagination on the last page when rows is less than rows-per-page
- ef36dbb: Corrected `dataFetcher` return type to include `Response` and replaced unsafe type casts with `instanceof` narrowing.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.3.1

## 7.3.0

### Minor Changes

- a1ae6d2: ## On Behalf of User Access

  This release introduces the ability for the Bulk Import plugin to fetch repository and organization listings **on behalf of the signed-in user**, using their OAuth credentials rather than relying solely on server-side integration credentials (GitHub App, PAT, or GitLab token).

  ### What Changed

  **Backend (`bulk-import-backend`)**
  - Added a new `GET /api/bulk-import/scm-hosts` endpoint that returns the configured GitHub and GitLab integration host URLs as a `SCMHostList` object, enabling the frontend to discover which hosts to request OAuth tokens for.
  - The `GET /repositories` and `GET /organizations/{organizationName}/repositories` endpoints now **require** the `x-scm-tokens` request header — a JSON map of SCM host base URL to user OAuth token. Requests that omit this header, or supply an empty or oversized header, are rejected with HTTP 401. This ensures repository listings are always scoped to the signed-in user's access and never fall back to server-wide integration credentials.
  - The `x-scm-tokens` header is stripped from the request immediately upon receipt, before the permission check and before any audit event is created, so OAuth token values are never persisted in audit logs.
  - When user tokens are provided for GitHub, the Octokit response cache is intentionally disabled to prevent cross-user ETag cache leakage. Server-side credential paths are not affected.
  - Introduced a shared `GitApiService` interface and common SCM types (`SCMOrganization`, `SCMRepository`, `SCMFetchError`, etc.) to unify the GitHub and GitLab service implementations under a consistent contract.

  **Frontend (`bulk-import`)**
  - The plugin now has a **soft dependency** on `@backstage/integration-react`'s `ScmAuthApi`. If the API is registered in the application, the plugin automatically requests OAuth tokens for each configured SCM host and passes them to the backend to enable user-scoped repository listings.
  - Added `getSCMHosts()` to the `BulkImportAPI` interface with a corresponding `GET /api/bulk-import/scm-hosts` client call, used to discover host URLs before requesting user tokens.
  - User OAuth tokens are transmitted to the backend via the `X-SCM-Tokens` request header as a JSON-encoded map.
  - If the SCM OAuth integration is not configured or token collection fails for all hosts, the repository list query is **blocked** on the frontend and the hook surfaces a descriptive error. This prevents the frontend from firing a request that will always be rejected with 401.

  ### Required Configuration

  The GitHub and/or GitLab OAuth provider must be configured in the Backstage application for repository listing to work. Deployments that previously relied on server-side credentials alone for the repository list view must add an SCM OAuth provider to continue using this feature.

  If `ScmAuthApi` is not registered or tokens cannot be obtained for any configured SCM host, users will see an error prompting them to configure the SCM OAuth integration.

- 328508c: Backstage version bump to v1.49.3

### Patch Changes

- 518943d: Updated dependency `@openapitools/openapi-generator-cli` to `2.31.1`.
  Updated dependency `@playwright/test` to `1.59.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.14.0`.
- 8e0bb08: Updated dependency `@openapitools/openapi-generator-cli` to `2.30.2`.
  Updated dependency `openapicmd` to `2.9.0`.
  Updated dependency `@playwright/test` to `1.58.2`.
- Updated dependencies [328508c]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.3.0

## 7.2.1

### Patch Changes

- afd7a1e: Update translations for Bulk Import.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.2.1

## 7.2.0

### Minor Changes

- a16cd34: Added support for Backstage New Frontend System (NFS)

### Patch Changes

- 8751f81: Updated NFS app and dev harness to use `rhdhThemeModule` from `@red-hat-developer-hub/backstage-plugin-theme/alpha` instead of manually constructing ThemeBlueprint extensions
- Updated dependencies [a16cd34]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.2.0

## 7.1.1

### Patch Changes

- f6d5102: Translation updated for German and Spanish
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.1.1

## 7.1.0

### Minor Changes

- 30b48e0: Backstage version bump to v1.47.3

### Patch Changes

- Updated dependencies [30b48e0]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.1.0

## 7.0.1

### Patch Changes

- 2adef63: Implemented smart polling for import task status in the repository table. Active tasks now poll every 10 seconds for real-time updates, while completed or idle repositories poll every 60 seconds to reduce API load. Polling intervals are aligned to consistent 60-second marks for efficient batching.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.0.1

## 7.0.0

### Major Changes

- 0f684d9: Simplified bulk-import routing structure:
  - The plugin now uses a single `/bulk-import` path instead of multiple paths
  - Removed `/bulk-import/repositories`, `/bulk-import/repositories/repositories`, and `/bulk-import/repositories/add` routes
  - Any undefined paths under `/bulk-import/*` will redirect to `/bulk-import`
  - **BREAKING**: Removed `addRepositoriesRouteRef` from plugin exports

### Patch Changes

- aaac497: Updated dependency `prettier` to `3.8.1`.
- Updated dependencies [aaac497]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.0.0

## 6.11.1

### Patch Changes

- 5fdd2c9: turn back accidentally deleted annotation for importAPI.
- 9c17c36: Updated dependency `prettier` to `3.8.0`.
- Updated dependencies [9c17c36]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.11.1

## 6.11.0

### Minor Changes

- 88ac11d: Implement the execution of import orchestrator workflows with the help of the bulk-import plugin.

### Patch Changes

- Updated dependencies [88ac11d]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.11.0

## 6.10.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.10.1

## 6.10.0

### Minor Changes

- f3fbbee: Add configurable instructions section for bulk import workflow

  This change introduces a fully configurable "Import to Red Hat Developer Hub" instructions section that allows administrators to customize the workflow steps displayed to users.

  **New Features:**
  - **Configurable Steps**: Define custom workflow steps via `app-config.yaml` with custom text and icons
  - **Enhanced Icon Support**: Comprehensive icon system supporting Backstage system icons, Material Design icons, SVG strings, URLs, and legacy built-in icons
  - **Dynamic Layout**: Steps automatically adjust width for optimal space usage (≤6 steps fill width, >6 steps scroll horizontally)
  - **User Preferences**: Collapsed/expanded state persisted in localStorage per user
  - **Universal Display**: Instructions section now shows for both PR flow and scaffolder flow
  - **Smart Hiding**: Section automatically hides when no steps are configured

  **Configuration Schema:**

  ```yaml
  bulkImport:
    # Enable/disable the instructions section (default: true)
    instructionsEnabled: true

    # Default expanded state (default: true)
    instructionsDefaultExpanded: true

    # Custom workflow steps
      instructionsSteps:
       - id: 'step1'
         text: 'Choose your source control platform'
         icon: 'kind:component' # Backstage system icon
       - id: 'step2'
         text: 'Browse repositories'
         icon: 'search' # Material Design icon
       - id: 'step3'
         text: 'Custom SVG icon'
         icon: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>' # SVG string
       - id: 'step4'
         text: 'External icon'
         icon: 'https://example.com/icon.png' # URL
       - id: 'step5'
         text: 'Legacy built-in icon'
         icon: 'approval-tool' # Legacy format (backward compatible)
       - id: 'step6'
         text: 'No icon step'
         # Steps without icons show text only
  ```

### Patch Changes

- 9e15bf7: Updated dependency `prettier` to `3.7.4`.
- a493013: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.12.0`.
- f74564d: Added 'it' and 'ja' i18n support and updated 'fr' translation strings.
- Updated dependencies [9e15bf7]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.10.0

## 6.9.1

### Patch Changes

- 86a9000: Remove interactive column sorting and fix case-insensitive sort ordering.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.9.1

## 6.9.0

### Minor Changes

- b88e8dd: Improve bulk import UI consistency and user experience
  - Ensure "Bulk import" navigation in left sidebar takes users directly to Import page
  - Hide source control tool radio buttons when only one provider is configured
  - Remove Repository/Organization toggle buttons from Import page
  - Update empty state message for better user guidance
  - Show "Import to Red Hat Developer Hub" info bar for pull request flow, hide for scaffolder flow
  - Show "Choose a source control tool" step only when multiple approval tools are configured
  - Added "Missing Configuration" page that displays when no GitHub or GitLab integrations are configured
  - Show "Ready to import" instead of "Not generated" status in scaffolder flow
  - Remove "Preview file" button for selected repositories in scaffolder flow
  - Fix task status display to show status text + separate "View task" button

### Patch Changes

- 1a99b9f: Updated dependency `@playwright/test` to `1.57.0`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.11.0`.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.9.0

## 6.8.0

### Minor Changes

- 0739b9a: Backstage version bump to v1.45.2

### Patch Changes

- Updated dependencies [0739b9a]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.8.0

## 6.7.2

### Patch Changes

- 8694ed5: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `@playwright/test` to `1.56.1`.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.7.2

## 6.7.1

### Patch Changes

- 40b80fe: Change "lifecycle" to active in catalog.yaml
- 40b80fe: Remove "support", "lifecycle" keywords and "supported-versions" in package.json. Change "lifecycle" to active in catalog.yaml
- Updated dependencies [40b80fe]
- Updated dependencies [40b80fe]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.7.1

## 6.7.0

### Minor Changes

- 3764e8e: Use enums for importFlow and TaskStatus
  - Convert TaskStatus from union type to enum for better status handling and type safety
  - Add ImportFlow enum to standardize import flow configuration values

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.7.0

## 1.19.0

### Minor Changes

- 4e3b05a: Backstage version bump to v1.44.1

### Patch Changes

- Updated dependencies [4e3b05a]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.11.0

## 1.18.1

### Patch Changes

- 0c89f33: Updated dependency `@playwright/test` to `1.56.0`.

## 1.18.0

### Minor Changes

- 8c33ce4: Enable GitLab frontend support. Restore previously removed approval tool parameters in the backend.

## 1.17.2

### Patch Changes

- 4c5967e: Make bulkImport configuration optional again to be backward compatible

## 1.17.1

### Patch Changes

- 433fde0: Include config.d.ts in the bulk-import plugin release bundle.

## 1.17.0

### Minor Changes

- 2a31b02: Implement scaffolder template execution for the bulk-import plugin.

### Patch Changes

- 316e356: Migrate from rhdh-theme to the theme within rhdh-plugins repo.
- cc7083f: Use a single react-query QueryClient instance for all pages and remove the need to have one in the app.
- Updated dependencies [2a31b02]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.10.0

## 1.16.1

### Patch Changes

- dd5350f: French translation updated
- b338a66: Updated dependency `@playwright/test` to `1.55.1`.

## 1.16.0

### Minor Changes

- fcc3bcc: Add internationalization (i18n) support with German, French and Spanish translations in bulk import.

## 1.15.0

### Minor Changes

- 81cfcfe: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [81cfcfe]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.9.0

## 1.14.0

### Minor Changes

- 391dbd5: Backstage version bump to v1.41.1

### Patch Changes

- 219c891: Updated dependency `@playwright/test` to `1.54.2`.
- cf4dcc9: Updated dependency `@playwright/test` to `1.54.2`.
- 8256072: Updated dependency `@playwright/test` to `1.55.0`.
- Updated dependencies [391dbd5]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.8.0

## 1.13.4

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.2

## 1.13.3

### Patch Changes

- 22e947b: Bump to backstage version 1.39.1
- e03293e: Updated dependency `@playwright/test` to `1.53.1`.
- Updated dependencies [22e947b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.1

## 1.13.2

### Patch Changes

- bb1ba58: removed all janus-idp/shared-react dependencies
- 002f7c9: Updated dependency `@testing-library/user-event` to `14.6.1`.
- 8c2e067: Updated dependency `openapicmd` to `2.7.0`.
  Updated dependency `@mui/styles` to `5.17.1`.
  Updated dependency `@playwright/test` to `1.52.0`.
- 37e6364: Updated dependency `@playwright/test` to `1.53.0`.
- e99da2b: Improve Bulk Import UI performance by optimizing API call behavior:
  - Prevent unnecessary API calls when switching between **Organizations** and **Repositories** tabs.
  - Avoid redundant calls when clicking on pagination controls without changing page or page size.
  - Suppress extraneous API requests triggered by random screen clicks.
  - Introduce **debouncing** to the search input to reduce network load during fast typing.

  These changes reduce client-side overhead and improve the responsiveness of the Bulk Import page.

- d7a0dd1: Aligned eslint-rules as per other plugins.

## 1.13.1

### Patch Changes

- bcb78bc: fix generic error when pr creation fails

## 1.13.0

### Minor Changes

- 361daf4: Backstage version bump to v1.38.1

### Patch Changes

- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- Updated dependencies [a9e5f32]
- Updated dependencies [361daf4]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.0

## 1.12.1

### Patch Changes

- d5cc14d: added MUI class generator

## 1.12.0

### Minor Changes

- 95b14e6: Backstage version bump to v1.36.1

### Patch Changes

- 4a1f79b: fixing extra apis call on added repository list
- 680ede5: Updated dependency `@mui/icons-material` to `5.16.14`.
  Updated dependency `@mui/styles` to `5.16.14`.
  Updated dependency `@mui/material` to `5.16.14`.
  Updated dependency `@mui/styled-engine` to `5.16.14`.
- Updated dependencies [95b14e6]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.6.0

## 1.11.0

### Minor Changes

- fbbd37f: Backstage version bump to v1.35.0

### Patch Changes

- 28769f6: Update Readme to point to right link
- a87d02d: Updated dependency `start-server-and-test` to `2.0.10`.
  Updated dependency `sass` to `1.83.4`.
  Updated dependency `ts-loader` to `9.5.2`.
- Updated dependencies [fbbd37f]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.5.0

## 1.10.8

### Patch Changes

- b47ad99: Implemented Server Side Sorting for `GET /imports`

## 1.10.7

### Patch Changes

- f627fd2: Updated dependency `@mui/icons-material` to `5.16.13`.
  Updated dependency `@mui/material` to `5.16.13`.
  Updated dependency `@mui/styles` to `5.16.13`.
- e9e670c: Updated dependency `@mui/icons-material` to `5.16.11`.
- 18547a0: Updated dependency `msw` to `1.3.5`.
- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `openapicmd` to `2.6.1`.
  Updated dependency `prettier` to `3.4.2`.
- 2743f5b: Updated dependency `start-server-and-test` to `2.0.9`.
- 414250a: Updated dependency `@playwright/test` to `1.49.1`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.2

## 1.10.6

### Patch Changes

- 462bfde: Persist changes made in the preview pull request form when PR is waiting to be approved

## 1.10.5

### Patch Changes

- ea3e1df: fix add repository pagination padding/position

## 1.10.4

### Patch Changes

- 734d971: Fixed a bug in the bulk-import plugin where the "Check All" checkbox was incorrectly selected when the total number of selected repositories across multiple pages matched the number of rows in the current table

## 1.10.3

### Patch Changes

- 0afb197: Disable Delete button for repositories that are not sourced from `location`.

## 1.10.2

### Patch Changes

- b910e0b: bump @backstage/repo-tools to 0.10.0 and regenerate api reports
- Updated dependencies [b910e0b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.1

## 1.10.1

### Patch Changes

- faa82f1: Removed canvas as a devDependency

## 1.10.0

### Minor Changes

- ab15e37: use react query to fetch repositories

## 1.9.0

### Minor Changes

- 06f1869: update preview form to use separate formik context

## 1.8.0

### Minor Changes

- 919f996: rebase with latest changes from janus

### Patch Changes

- Updated dependencies [919f996]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.0

## 1.7.1

### Patch Changes

- 07bf748: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [07bf748]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.1

## 1.7.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.0
  - @janus-idp/shared-react@2.13.0

## 1.6.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

## 1.6.0

### Minor Changes

- d9551ae: update bulk import ui as per the api response
- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: pin the @janus-idp/cli package
- d9551ae: upgrade to yarn v3
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @janus-idp/shared-react@2.12.0
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.2.0

* **@janus-idp/cli:** upgraded to 1.15.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.1

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.11.1
- **@janus-idp/cli:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.0
- **@janus-idp/shared-react:** upgraded to 2.11.0
- **@janus-idp/cli:** upgraded to 1.14.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.2

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.3

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.1

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.5...@red-hat-developer-hub/backstage-plugin-bulk-import@1.2.0) (2024-08-06)

### Features

- **bulk-import:** add fields for annotations, labels and spec input ([#1950](https://github.com/janus-idp/backstage-plugins/issues/1950)) ([a1b790a](https://github.com/janus-idp/backstage-plugins/commit/a1b790a021a355046fc9c592812fc15f7cbda1fb))

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.4...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.5) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.3...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.4) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.2...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.3) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.1...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.2) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.0...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.1) (2024-07-26)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.9.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.6...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.0) (2024-07-25)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))

### Bug Fixes

- **deps:** update rhdh dependencies (non-major) ([#1960](https://github.com/janus-idp/backstage-plugins/issues/1960)) ([8b6c249](https://github.com/janus-idp/backstage-plugins/commit/8b6c249f1d2e8097cac0260785c26496a5be1a06))

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.9.0
- **@janus-idp/cli:** upgraded to 1.13.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.4...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.5) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.10

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.3...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.4) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.9

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.2...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.3) (2024-04-05)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.8

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.1...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.2) (2024-04-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.7

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.0...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.1) (2024-03-29)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.6

## @red-hat-developer-hub/backstage-plugin-bulk-import 1.0.0 (2024-03-11)

### Features

- **bulk-import:** create bulk-import frontend plugin ([#1327](https://github.com/janus-idp/backstage-plugins/issues/1327)) ([e03f47f](https://github.com/janus-idp/backstage-plugins/commit/e03f47f1f770823ee79a97a2fa79cec144394b17))
