# Augment Security Modes

Augment supports **3 security modes** for flexible authentication and authorization. This allows you to choose the right level of security for your environment.

## Quick Reference

| Mode          | Plugin Access | MCP Server Auth | Status          | Use Case                                 |
| ------------- | ------------- | --------------- | --------------- | ---------------------------------------- |
| `none`        | Open          | No auth         | ✅ Tested       | Development, demos, trusted environments |
| `plugin-only` | Keycloak RBAC | No auth         | ✅ Tested       | **Recommended for most deployments**     |
| `full`        | Keycloak RBAC | OAuth tokens    | 🚧 Experimental | End-to-end authentication chain          |

> **⚠️ Note**: `full` mode is experimental and not fully tested. For production, use `plugin-only` mode.

## Mode 1: `none` - No Access Control

**Anyone can access Augment. MCP servers receive no authentication.**

```yaml
augment:
  security:
    mode: 'none'
```

### When to Use

- Local development
- Internal demos
- Trusted network environments
- Quick testing

### What Happens

- No permission checks on Augment endpoints
- MCP servers are called without Authorization headers
- MCP servers should use their own service account for K8s access

---

## Mode 2: `plugin-only` - Plugin Access Control (Default)

**Users must be in a Keycloak group to access Augment. MCP servers use their own service accounts.**

```yaml
augment:
  security:
    mode: 'plugin-only'
    accessDeniedMessage: 'Contact your platform team for Augment access.'
```

### When to Use

- **Most production deployments**
- When you want group-based access control
- When MCP server has its own K8s service account with appropriate permissions

### What Happens

1. User authenticates via Keycloak → gets JWT with group claims
2. Backstage RBAC checks `augment.access` permission
3. Users in `augment-users` group → access granted
4. Users NOT in group → 403 Access Denied
5. MCP servers are called without auth (they use their own service accounts)

### RBAC Configuration Required

Create `rbac-policy.csv`:

```csv
g, group:default/augment-users, role:default/augment-user
p, role:default/augment-user, augment.access, read, allow
```

Configure in `app-config.yaml`:

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: /path/to/rbac-policy.csv
```

---

## Mode 3: `full` - Full Authentication Chain 🚧

> **⚠️ Experimental**: This mode is not fully tested. The code supports it, but the MCP server OAuth validation flow has not been validated end-to-end. Use `plugin-only` mode for production.

**Keycloak controls plugin access AND MCP servers receive OAuth tokens.**

```yaml
augment:
  security:
    mode: 'full'
    accessDeniedMessage: 'Contact your platform team for access.'
    mcpOAuth:
      tokenUrl: 'https://keycloak.example.com/realms/demo/protocol/openid-connect/token'
      clientId: 'augment-backend'
      clientSecret: ${MCP_OAUTH_CLIENT_SECRET}
      scopes:
        - openid
```

### When to Use

- When MCP server requires OAuth authentication
- End-to-end authenticated environments
- Strict security requirements

### Current Limitation

The MCP server (kubernetes-mcp-server) validates incoming OAuth tokens but then attempts to use them for Kubernetes API calls, which doesn't work with Keycloak tokens. Until this is resolved, use `plugin-only` mode where the MCP server uses its own Kubernetes service account.

### What Happens

1. User authenticates via Keycloak → gets JWT with group claims
2. Backstage RBAC checks `augment.access` permission
3. For MCP calls: Augment backend fetches OAuth token using client credentials
4. MCP server receives `Authorization: Bearer <token>` header
5. MCP server validates the token against Keycloak

### Keycloak Configuration Required

1. Create a **service account client** in Keycloak:
   - Client ID: `augment-backend`
   - Client authentication: ON
   - Service accounts roles: enabled
   - Authentication flow: Client credentials

2. Add an **audience mapper** to include `mcp-server` in token audience:
   - Mapper type: Audience
   - Included audience: `mcp-server`

3. Configure MCP server to validate tokens:
   ```toml
   require_oauth = true
   authorization_url = "https://keycloak.example.com/realms/demo"
   oauth_audience = "mcp-server"
   ```

---

## Configuration Reference

### Full Schema

```yaml
augment:
  security:
    # Security mode: 'none' | 'plugin-only' | 'full'
    mode: 'plugin-only'

    # Custom message when access denied
    accessDeniedMessage: 'Contact your platform team for access.'

    # OAuth config for MCP auth (mode 3 only)
    mcpOAuth:
      tokenUrl: 'https://keycloak.example.com/realms/demo/protocol/openid-connect/token'
      clientId: 'augment-backend'
      clientSecret: ${MCP_OAUTH_CLIENT_SECRET}
      scopes:
        - openid
```

### Environment Variables

For mode 3, set the client secret as an environment variable:

```bash
export MCP_OAUTH_CLIENT_SECRET="your-keycloak-client-secret"
```

---

## Comparison Matrix

| Feature                        | `none` | `plugin-only` | `full` |
| ------------------------------ | ------ | ------------- | ------ |
| Backstage login required       | No\*   | Yes           | Yes    |
| Keycloak group check           | No     | Yes           | Yes    |
| RBAC policy required           | No     | Yes           | Yes    |
| MCP gets OAuth token           | No     | No            | Yes    |
| Keycloak service client needed | No     | No            | Yes    |
| MCP server OAuth config        | No     | No            | Yes    |

\*Depends on overall Backstage auth configuration

---

## Troubleshooting

### Mode 2: User gets 403 but is in the group

1. Check that the user's Keycloak group matches the RBAC policy:

   ```bash
   # Decode JWT to see groups
   echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '.groups'
   ```

2. Verify RBAC policy is loaded:

   ```bash
   # Check Backstage logs for RBAC loading
   grep -i rbac /var/log/backstage.log
   ```

3. Ensure group format matches:
   - RBAC: `group:default/augment-users`
   - Keycloak group: `augment-users` (mapped to `default` namespace)

### Mode 3: MCP calls fail with 401

1. Verify client credentials are correct
2. Check MCP server OAuth configuration matches Keycloak
3. Ensure audience mapper is configured for `mcp-server`
4. Check Augment backend logs for token fetch errors

### Fallback Behavior

- If mode 3 is configured without `mcpOAuth`, it falls back to mode 2
- Warning is logged: "Security mode 'full' requires mcpOAuth configuration"

---

## Migration Guide

### From Legacy `auth` to `security.mode`

**Before (deprecated):**

```yaml
augment:
  auth:
    requiredGroup: 'augment-users'
```

**After:**

```yaml
augment:
  security:
    mode: 'plugin-only'
```

The new `security` block uses Backstage RBAC permissions instead of direct group checks.
Configure RBAC policies to map Keycloak groups to the `augment.access` permission.
