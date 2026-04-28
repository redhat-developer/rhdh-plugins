# X2A MCP Extras

Backstage backend plugin that exposes X2A migration project management as
[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) tools. AI
clients such as Cursor, Claude Desktop, or any MCP-compatible LLM can list
projects, create new migration projects, and get direct links to the
Backstage UI for operations that require SCM credentials.

## Design: Why URLs Instead of Direct Actions?

Triggering a migration phase requires **source and target SCM (repository)
authentication tokens**. These tokens are sensitive credentials that the
Backstage/RHDH UI can collect securely from the user at the time of the
action, but an LLM calling MCP tools does not have access to them and should
not be expected to handle them.

For this reason, tools that would otherwise perform write operations
(`x2a-create-project`, `x2a-trigger-next-phase`) return a **full URL to the
Project Details page** in the Backstage UI. The LLM is expected to present
this URL to the user with instructions to:

1. Open the link in their browser.
2. Trigger the next migration phase from the UI.
3. Provide the required SCM tokens through the secure UI form.

This keeps secret material out of the MCP transport while still allowing an
AI assistant to orchestrate the migration workflow end-to-end.

## MCP Tools

| Tool name                | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `x2a-list-projects`      | List migration projects with pagination and sorting.                            |
| `x2a-list-modules`       | List modules for a project (by `projectId`) with statuses.                      |
| `x2a-create-project`     | Create a new project and return its Project Details URL.                        |
| `x2a-trigger-next-phase` | Look up a project and return its Project Details URL for triggering next phase. |

## Authentication Modes

The plugin supports **dual-mode authentication**:

### 1. DCR OAuth (recommended for production)

Dynamic Client Registration (OAuth 2.1) lets MCP clients authenticate as a
specific Backstage user. Credentials carry a `BackstageUserPrincipal`, so all
RBAC rules, project ownership, and group-based filtering work exactly as in
the Backstage UI.

**Requirements:**

- Backstage 1.43.0+ (backend support for DCR)
- `@backstage/plugin-auth` frontend plugin installed (already added to
  `packages/app` - uses a legacy-system workaround to load the NFS-only consent page)
- `auth.experimentalDynamicClientRegistration.enabled: true` in app-config

### 2. Static tokens (fallback / local development)

Static bearer tokens produce a `BackstageServicePrincipal`. The MCP tool
handlers detect this and fall back to a system-user context. Project
ownership is attributed to `user:default/system`.

Visibility depends on RBAC permissions: granting `x2aAdminViewPermission`
or `x2aAdminWritePermission` enables `canViewAll`. With only `x2a.user`,
the service principal sees only its own projects (created by
`user:default/system`).

This mode is useful for local development or environments where the new
frontend system is not available.

**Requirements:**

- `backend.auth.externalAccess` configured with a static token
- RBAC policy granting at least `x2a.user` (own projects) or
  `x2a.admin.view` / `x2a.admin.write` (all projects) to the
  `mcp-clients` subject

### Credential resolution in MCP tools

All MCP tools share one code path (`resolveCredentialsContext` in
`src/actions/credentials.ts`) before they touch the database. Two points
from that helper are easy to miss from the high-level “OAuth vs static
token” split above:

1. **RBAC is evaluated the same way for users and for static-token service
   principals.** The handler always calls `resolveX2aPermissionFlags`, which
   checks `x2a.user`, `x2a.admin` (read), and `x2a.admin` (write) against the
   **actual** `BackstageCredentials` on the request. Tools that only read the
   database (`x2a-list-projects`, `x2a-trigger-next-phase`) require ordinary
   read access (`x2a.user`, or admin read/write that implies seeing all
   projects). `x2a-create-project` is gated as a write path and needs `x2a.user`
   or admin write. A static bearer token does **not** bypass those rules - if
   the token’s subject has no matching policy, the tool responds with
   `NotAllowedError` and a message that points you at RBAC for the MCP client
   subject.

2. **Only identity and catalog context differ by mode.** DCR OAuth carries a
   `BackstageUserPrincipal`, so the handler uses the real user ref and loads
   `groupsOfUser` from the catalog (same idea as the UI). A static token
   carries a `BackstageServicePrincipal`. RBAC still runs on that subject, but
   the normalized context passed to the DB layer uses `getUserRef()`’s
   fallback (`user:default/system`) and an **empty** group list. That is why
   “own projects” for a token means projects owned by that synthetic identity
   unless you grant admin view/write - **not** because service principals skip
   permission checks.

## Deployment Checklist

### 1. Install backend dependencies

Add to your backend `package.json`:

```json
{
  "dependencies": {
    "@backstage/plugin-mcp-actions-backend": "^0.1.9",
    "@red-hat-developer-hub/backstage-plugin-x2a-mcp-extras": "..."
  }
}
```

### 2. Register plugins in backend

In `packages/backend/src/index.ts`:

```typescript
backend.add(import('@backstage/plugin-mcp-actions-backend'));
backend.add(import('@red-hat-developer-hub/backstage-plugin-x2a-mcp-extras'));
```

### 3. Configure MCP action sources

In `app-config.yaml`:

```yaml
backend:
  actions:
    pluginSources:
      - 'x2a-mcp-extras'
```

### 4. Configure authentication

#### Option A: Static tokens (quick start)

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${MCP_TOKEN}
          subject: mcp-clients
        accessRestrictions:
          - plugin: mcp-actions
```

Add RBAC policy for the service subject:

```csv
p, user:default/mcp-clients, x2a.user, use, allow
```

Set the `MCP_TOKEN` environment variable to a secure random string.

#### Option B: DCR OAuth (recommended)

```yaml
auth:
  experimentalDynamicClientRegistration:
    enabled: true
    allowedRedirectUriPatterns:
      - cursor://*
      - http://localhost:*
```

Install `@backstage/plugin-auth` (**requires new frontend
system**) in the frontend to provide the OAuth consent
page. In the x2a workspace's legacy app this is already wired up via a
lazy-loaded relative import (see `packages/app/src/App.tsx`).

### 5. Configure the MCP client

Point your MCP client (Cursor, Claude Desktop, etc.) at the Backstage MCP
endpoint:

```
http://<backstage-host>:7007/api/mcp-actions
```

- **With static tokens:** configure the client to send
  `Authorization: Bearer <MCP_TOKEN>`
- **With DCR OAuth:** the client will go through the standard OAuth
  authorization flow; no manual token configuration needed.

### 6. Verify

Test with any of the three tools:

```
x2a-list-projects {}
x2a-create-project { "name": "test", "abbreviation": "TST", ... }
x2a-trigger-next-phase { "projectId": "<uuid>" }
```

Both `x2a-create-project` and `x2a-trigger-next-phase` return a
`projectDetailsUrl` field. Verify the URL points to the correct Backstage
frontend (it is derived from the `app.baseUrl` config value).

## Architecture

```
MCP Client (Cursor/Claude)
        │
        ▼
 @backstage/plugin-mcp-actions-backend  (MCP server)
        │
        ▼
 x2a-mcp-extras plugin  (this plugin)
        │  Direct Service Access
        ▼
 x2aDatabaseServiceRef  (from x2a-backend)
        │
        ▼
 Backstage UI  ← user opens the returned URL
        │        to trigger phases with SCM tokens
        ▼
 x2a-backend  → Kubernetes jobs
```

The plugin uses **Direct Service Access**: it resolves the
`x2aDatabaseServiceRef` from the Backstage service registry to read and
create projects. Write operations that require SCM tokens (triggering
migration phases) are delegated to the user via the Backstage UI - the MCP
tools return a direct URL to the Project Details page instead.

## Limitations

- The `@backstage/plugin-auth` plugin is built for the new Backstage frontend
  system and does not export its `Router`/`ConsentPage` components publicly. In
  the x2a workspace's legacy `packages/app`, the Router is loaded via a relative
  path into `node_modules` (bypassing the package's `exports` field). This
  workaround is fragile and may break on package updates.
- The returned `projectDetailsUrl` is built from the `app.baseUrl` config
  value. If the Backstage frontend is served behind a different URL (e.g. a
  reverse proxy with a different hostname), make sure `app.baseUrl` reflects
  the URL that end users actually access.
