---
'@red-hat-developer-hub/backstage-plugin-bulk-import-backend': minor
'@red-hat-developer-hub/backstage-plugin-bulk-import': minor
---

## On Behalf of User Access

This release introduces the ability for the Bulk Import plugin to fetch repository and organization listings **on behalf of the signed-in user**, using their OAuth credentials rather than relying solely on server-side integration credentials (GitHub App, PAT, or GitLab token).

### What Changed

**Backend (`bulk-import-backend`)**

- Added a new `GET /api/bulk-import/scm-hosts` endpoint that returns the configured GitHub and GitLab integration host URLs as a `SCMHostList` object, enabling the frontend to discover which hosts to request OAuth tokens for.
- The `GET /repositories` and `GET /organizations/{organizationName}/repositories` endpoints now accept an optional `x-scm-tokens` request header — a JSON map of SCM host base URL to user OAuth token. When tokens are present, repository listings reflect what the signed-in user can personally access rather than the full scope of the server-wide integration credentials.
- When user tokens are provided for GitHub, the Octokit response cache is intentionally disabled to prevent cross-user ETag cache leakage. Server-side credential paths are not affected.
- Introduced a shared `GitApiService` interface and common SCM types (`SCMOrganization`, `SCMRepository`, `SCMFetchError`, etc.) to unify the GitHub and GitLab service implementations under a consistent contract.

**Frontend (`bulk-import`)**

- The plugin now has a **soft dependency** on `@backstage/integration-react`'s `ScmAuthApi`. If the API is registered in the application, the plugin automatically requests OAuth tokens for each configured SCM host and passes them to the backend to enable user-scoped repository listings.
- Added `getSCMHosts()` to the `BulkImportAPI` interface with a corresponding `GET /api/bulk-import/scm-hosts` client call, used to discover host URLs before requesting user tokens.
- User OAuth tokens are transmitted to the backend via the `X-SCM-Tokens` request header as a JSON-encoded map.

### Fallback Behavior

The GitHub and GitLab auth providers are **soft dependencies**. The plugin degrades gracefully when they are not configured or unavailable:

- If `ScmAuthApi` is not registered in the application, no user tokens are collected and the backend falls back entirely to server-side credentials.
- If a token cannot be obtained for a specific host (e.g., the user has not signed in via that provider, or no OAuth provider is registered for that host), that host is silently skipped and the backend uses its configured integration credentials for that host.
- Deployments that do not configure GitHub or GitLab OAuth providers continue to work exactly as before with no change in behavior.
