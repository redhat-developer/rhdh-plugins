# X2A MCP Extras

Backstage backend plugin that exposes X2A migration project management as
[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) tools. AI
clients such as Cursor, Claude Desktop, or any MCP-compatible LLM can list
projects, create new migration projects, and trigger init/next-phase runs.

## MCP Tools

| Tool name                | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `x2a-list-projects`      | List migration projects with pagination and sorting.       |
| `x2a-create-project`     | Create a new X2A migration project.                        |
| `x2a-trigger-next-phase` | Trigger the init (next-phase) Kubernetes job on a project. |

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
handlers detect this and fall back to a system-user context with
admin-level visibility (`canViewAll: true`). Project ownership is attributed
to `user:default/system`.

This mode is useful for local development or environments where the new
frontend system is not available.

**Requirements:**

- `backend.auth.externalAccess` configured with a static token
- RBAC policy granting at least `x2a.user` or `x2a.admin` to the
  `mcp-clients` subject

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

TODO: review following before PR review

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
 x2aDatabaseServiceRef / kubeServiceRef  (from x2a-backend)
```

The plugin uses **Direct Service Access**: it resolves the `x2aDatabaseServiceRef`
and `kubeServiceRef` from the Backstage service registry and calls their methods
directly, the same way the x2a-backend HTTP routes do. No HTTP round-trips
between plugins.

## Limitations

- The `@backstage/plugin-auth` plugin is built for the new Backstage frontend
  system and does not export its `Router`/`ConsentPage` components publicly. In
  the x2a workspace's legacy `packages/app`, the Router is loaded via a relative
  path into `node_modules` (bypassing the package's `exports` field). This
  workaround is fragile and may break on package updates.
- Repository tokens for `x2a-trigger-next-phase` fall back to app-config values
  (`x2a.git.sourceRepo.token` / `x2a.git.targetRepo.token`). For production,
  configure these in app-config rather than passing them through MCP.
