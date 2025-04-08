# Login as Admin in UI Dev Mode

## Steps to Configure GitHub Authentication

### 1. Log in with Your GitHub Account

Ensure you are logged into your GitHub account before proceeding.

### 2. Create an OAuth Token

You can create an OAuth application by visiting the following link:
[GitHub OAuth Applications](https://github.com/settings/applications/new)

When creating the OAuth application, use the following values:

- **Homepage URL:** `http://localhost:3000/`
- **Authorization Callback URL:** `https://localhost:7007/api/auth/github/handler/frame`

### 3. Update Your GitHub Email Settings

Make sure the email associated with your GitHub account is set to **primary** and **public**.

### 4. Define a User Identity in `users.yaml`

Add the following entry to `/workspaces/orchestrator/entities/users.yaml`:

```yaml
---
apiVersion: backstage.io/v1alpha1
kind: User
metadata:
  name: <your identity name>
spec:
  profile:
    displayName: <Your Name>
    email: <your-github-email@example.com>
  memberOf: []
```

Ensure that the email in this identity matches the email used in GitHub.

### 5. Create `app-config.local.yaml` File

Create a file named `app-config.local.yaml` in the same directory as `app-config.yaml`.

#### 5.1 Configure Authentication

```yaml
auth:
  # see https://backstage.io/docs/auth/ to learn about auth providers
  environment: development
  providers:
    guest: {}
    github:
      development:
        clientId: <client-id>
        clientSecret: <client-secret>
        signIn:
          resolvers:
            - resolver: emailMatchingUserEntityProfileEmail
```

#### 5.2 Enable RBAC plugin

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: ../../docs/rbac-policy.csv
    policyFileReload: true
    pluginsWithPermission:
      - orchestrator
    admin:
      users:
        - name: user:default/<your identity name>
```

### 6. Configure RBAC Policy File

Add the following line to `/workspaces/orchestrator/docs/rbac-policy.csv` to grant admin access:

```
user:default/<your identity name>, role:default/workflowAdmin
```

This assigns the `workflowAdmin` role to your user, granting administrative privileges.

---

Open `http://localhost:3000/` and choose Sign in using GitHub
