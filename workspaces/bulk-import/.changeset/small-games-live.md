---
'@red-hat-developer-hub/backstage-plugin-bulk-import-backend': minor
'@red-hat-developer-hub/backstage-plugin-bulk-import': minor
---

## On Behalf of User Access

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
