# Resource Optimization back-end plugin

The cost-management backend plugin provides a secure server-side proxy for the
Red Hat Cost Management API. All communication with the upstream API happens
within the backend — SSO tokens never leave the server and RBAC filtering is
enforced before data is returned to the browser.

## Architecture

The plugin exposes a single catch-all route at `/api/cost-management/proxy/*`.
When a request arrives the handler:

1. **Authenticates** the caller via Backstage `httpAuth` (requires a valid user session).
2. **Checks permissions** through the Backstage permission framework using the
   `ros.*` and `cost.*` permission sets (see [docs/rbac.md](../../docs/rbac.md)).
3. **Obtains an SSO token** internally via the OAuth2 `client_credentials` grant
   using the `costManagement.clientId` / `costManagement.clientSecret` from
   `app-config`.
4. **Strips** any client-supplied RBAC-controlled query parameters (`cluster`,
   `project`, `filter[exact:cluster]`, `filter[exact:project]`).
5. **Injects** server-authorised cluster/project filters from the permission
   decision.
6. **Forwards** the request to the Red Hat Cost Management API and streams the
   response back.

### Endpoints

| Path                               | Auth          | Description                         |
| ---------------------------------- | ------------- | ----------------------------------- |
| `GET /api/cost-management/health`  | None          | Health check                        |
| `ALL /api/cost-management/proxy/*` | `user-cookie` | Secure proxy to Cost Management API |

### Configuration

```yaml
# app-config.yaml
costManagement:
  clientId: ${RHHCC_SA_CLIENT_ID}
  clientSecret: ${RHHCC_SA_CLIENT_SECRET}
```

No `proxy` block with `dangerously-allow-unauthenticated` is needed — the
backend plugin handles upstream communication directly.

## Getting started

The plugin has been added to the example app in this workspace, meaning you'll be able to access it by running `yarn
start` from the root directory, and then navigating to http://localhost:3000/cost-management/optimizations.
The health check endpoint for this back-end is available at: http://localhost:7007/api/cost-management/health.

You can also serve the plugin in isolation by running `yarn start:dev` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](/dev) directory.
