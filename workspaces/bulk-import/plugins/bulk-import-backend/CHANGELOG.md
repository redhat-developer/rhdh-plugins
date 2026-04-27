# @red-hat-developer-hub/backstage-plugin-bulk-import-backend

## 7.3.0

### Minor Changes

- 4eafd59: **BREAKING** Changes the behavior of the bulk-import backend plugin to return only repositories that are yet to be imported by filtering out the already imported ones. Therefore, the frontend will not display already imported repositories with status displayed as "Imported" anymore. The frontend fetches all repositories at once on the first page load and then all the pagination and search is done client-side.
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

- b3a0333: Fixed GitLab OAuth flow for on behalf of the signed-in user
- 518943d: Updated dependency `@openapitools/openapi-generator-cli` to `2.31.1`.
  Updated dependency `@playwright/test` to `1.59.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.14.0`.
- 8e0bb08: Updated dependency `@openapitools/openapi-generator-cli` to `2.30.2`.
  Updated dependency `openapicmd` to `2.9.0`.
  Updated dependency `@playwright/test` to `1.58.2`.
- 3f9d1fe: Updated dependency `openapicmd` to `2.9.2`.
- Updated dependencies [328508c]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.3.0

## 7.2.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.2.1

## 7.2.0

### Patch Changes

- a16cd34: Added support for Backstage New Frontend System (NFS)
- Updated dependencies [a16cd34]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.2.0

## 7.1.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.1.1

## 7.1.0

### Minor Changes

- 30b48e0: Backstage version bump to v1.47.3

### Patch Changes

- Updated dependencies [30b48e0]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.1.0

## 7.0.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.0.1

## 7.0.0

### Patch Changes

- aaac497: Updated dependency `prettier` to `3.8.1`.
- Updated dependencies [aaac497]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@7.0.0

## 6.11.1

### Patch Changes

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

- e143e26: Updated dependency `@octokit/auth-app` to `7.2.2`.
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.10.1

## 6.10.0

### Patch Changes

- 9e15bf7: Updated dependency `prettier` to `3.7.4`.
- Updated dependencies [9e15bf7]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.10.0

## 6.9.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.9.1

## 6.9.0

### Patch Changes

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

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-bulk-import-common@6.7.0

## 6.6.0

### Minor Changes

- 4e3b05a: Backstage version bump to v1.44.1

### Patch Changes

- Updated dependencies [4e3b05a]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.11.0

## 6.5.1

### Patch Changes

- ace9761: Fix failing repo list table when GitLab token is bad.

## 6.5.0

### Minor Changes

- 8c33ce4: Enable GitLab frontend support. Restore previously removed approval tool parameters in the backend.

## 6.4.1

### Patch Changes

- 4c5967e: Make bulkImport configuration optional again to be backward compatible

## 6.4.0

### Minor Changes

- 2a31b02: Implement scaffolder template execution for the bulk-import plugin.

### Patch Changes

- bd09be8: Automatically select templates from default namespace for bulkImport.importTemplate configuration.
- b5ce9fc: Fix dependencies: Replace @ai-zen/node-fetch-event-source with @microsoft/fetch-event-source and remove unused dependency @roadiehq/scaffolder-backend-module-utils
- e11b586: Fix an sql issue when filtering added repositories on SQlite
- Updated dependencies [2a31b02]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.10.0

## 6.3.0

### Minor Changes

- 60cea87: Add the ability to use GitLab for bulk imports
- 81cfcfe: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [81cfcfe]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.9.0

## 6.2.0

### Minor Changes

- 391dbd5: Backstage version bump to v1.41.1

### Patch Changes

- Updated dependencies [391dbd5]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.8.0

## 6.1.7

### Patch Changes

- 760b519: Fixes `/imports` endpoint unable to edit `catalog-info.yaml` PR

## 6.1.6

### Patch Changes

- 5f50921: Fixes `/imports` endpoint unable to create `catalog-info.yaml` PR in rhdh-local

## 6.1.5

### Patch Changes

- 0fb7550: Fixes `/imports` endpoint unable to create `catalog-info.yaml` PR

## 6.1.4

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.2

## 6.1.3

### Patch Changes

- 22e947b: Bump to backstage version 1.39.1
- Updated dependencies [22e947b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.1

## 6.1.2

### Patch Changes

- 9171b96: Updated dependency `@types/express` to `4.17.23`.
- 8c2e067: Updated dependency `openapicmd` to `2.7.0`.
  Updated dependency `@mui/styles` to `5.17.1`.
  Updated dependency `@playwright/test` to `1.52.0`.

## 6.1.1

### Patch Changes

- 571d93e: Updated dependency `@types/express` to `4.17.22`.
- be43040: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.2`.
  Updated dependency `openapicmd` to `2.6.2`.

## 6.1.0

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

## 6.0.0

### Major Changes

- b806644: Use newer audit-log package from Backstage. Note: Breaking change – audit log format has changed.

## 5.4.0

### Minor Changes

- 95b14e6: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [95b14e6]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.6.0

## 5.3.0

### Minor Changes

- fbbd37f: Backstage version bump to v1.35.0

### Patch Changes

- 05a1ce0: Updated dependency `@openapitools/openapi-generator-cli` to `2.16.3`.
- 816d8bc: Updated dependency `@openapitools/openapi-generator-cli` to `2.16.2`.
- Updated dependencies [fbbd37f]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.5.0

## 5.2.2

### Patch Changes

- b47ad99: Implemented Server Side Sorting for `GET /imports`

## 5.2.1

### Patch Changes

- 97534e9: Updated dependency `@types/express` to `4.17.21`.
- 18547a0: Updated dependency `msw` to `1.3.5`.
- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `openapicmd` to `2.6.1`.
  Updated dependency `prettier` to `3.4.2`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.2

## 5.2.0

### Minor Changes

- be29a84: Introduced a new response key 'source' in the GET /imports endpoint to indicate from which source the import originated from ('config', 'location', 'integration'). In case of duplicates, it returns first source it finds in order 'config', 'location', 'integration'.

## 5.1.1

### Patch Changes

- b910e0b: bump @backstage/repo-tools to 0.10.0 and regenerate api reports
- Updated dependencies [b910e0b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.1

## 5.1.0

### Minor Changes

- 919f996: rebase with latest changes from janus

### Patch Changes

- Updated dependencies [919f996]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.0

## 5.0.1

### Patch Changes

- 07bf748: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [07bf748]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.1

## 5.0.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.0
  - @janus-idp/backstage-plugin-audit-log-node@1.7.0

## 4.0.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

## 4.0.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: pin the @janus-idp/cli package
- d9551ae: upgrade to yarn v3
- d9551ae: Change the export-dynamic script to no longer use any flags and remove the tracking of the dist-dynamic folder
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.2.0
  - @janus-idp/backstage-plugin-audit-log-node@1.6.0

* **@janus-idp/cli:** upgraded to 1.15.2

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.5.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.0
- **@janus-idp/cli:** upgraded to 1.14.0
- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.5.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.2

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.4.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.0.0
- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.0
- **@janus-idp/cli:** upgraded to 1.0.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.1

## @red-hat-developer-hub/backstage-plugin-bulk-import-backend [0.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import-backend@0.1.0...@red-hat-developer-hub/backstage-plugin-bulk-import-backend@0.2.0) (2024-07-25)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.0
