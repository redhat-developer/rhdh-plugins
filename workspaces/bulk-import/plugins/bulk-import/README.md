# Bulk import frontend plugin for Backstage

This plugin allows bulk import of multiple catalog entities into the catalog.

## For administrators

### Installation

#### Installing as a dynamic plugin?

The sections below are relevant for static plugins. If the plugin is expected to be installed as a dynamic one:

- Follow https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/dynamic-plugins.md#installing-a-dynamic-plugin-package-in-the-showcase
- Add content of `app-config.janus-idp.yaml` into `app-config.local.yaml`.

#### Prerequisites

- Follow the Bulk import backend plugin [README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/bulk-import/plugins/bulk-import-backend/README.md) to integrate bulk import in your Backstage instance.

- Follow the [GitHub Locations](https://backstage.io/docs/integrations/github/locations) to integrate GitHub integrations in your Backstage instance. For now, the plugin only supports loading catalog entities from github.com or GitHub Enterprise.

- Configure a GitHub and/or GitLab OAuth auth provider and register `ScmAuthApi` from `@backstage/integration-react` in your application. **This is required for repository listing.** The `GET /repositories` and `GET /organizations/{org}/repositories` backend endpoints require user OAuth credentials (sent via the `X-SCM-Tokens` header) and will return HTTP 401 if they are absent. See [Configuring Auth Providers](#configuring-auth-providers) for setup instructions.

---

**NOTE**

- When RBAC permission framework is enabled, for non-admin users to access bulk import UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file:

```CSV
p, role:default/team_a, bulk.import, use, allow
p, role:default/team_a, catalog-entity.read, read, allow
p, role:default/team_a, catalog-entity.create, create, allow
g, user:default/<login-id/user-name>, role:default/team_a
```

#### Procedure

1. Install the Bulk import UI plugin using the following command:

   ```console
   yarn workspace app add @red-hat-developer-hub/backstage-plugin-bulk-import
   ```

2. Add Route in `packages/app/src/App.tsx`:

   ```tsx title="packages/app/src/App.tsx"
   /* highlight-add-next-line */
   import { BulkImportPage } from '@red-hat-developer-hub/backstage-plugin-bulk-import';
   ...
   /* highlight-add-start */
    <Route
        path="/bulk-import/*"
        element={<BulkImportPage />}
    />
    /* highlight-add-end */
   ...
   ```

3. Add **Bulk import** Sidebar Item in `packages/app/src/components/Root/Root.tsx`:

   ```tsx title="packages/app/src/components/Root/Root.tsx"
   /* highlight-add-next-line */
   import { BulkImportSidebarItem } from '@red-hat-developer-hub/backstage-plugin-bulk-import';

   export const Root = ({ children }: PropsWithChildren<{}>) => (
    <SidebarPage>
      <Sidebar>
      ...
      /* highlight-add-next-line */
      <BulkImportSidebarItem />
      ...
    </SidebarPage>
   );
   ```

## On Behalf of User Access

The Bulk Import plugin can fetch repository and organization listings **on behalf of the signed-in user** using their OAuth credentials, so that users see only the repositories and organizations they personally have access to.

### How It Works

When `ScmAuthApi` (from `@backstage/integration-react`) is available in the application, the plugin:

1. Calls `GET /api/bulk-import/scm-hosts` to discover the configured GitHub and GitLab integration host URLs.
2. Requests an OAuth token for each host from `ScmAuthApi` using a read-only scope (`repoWrite: false`).
3. Passes the collected tokens to the backend via the `X-SCM-Tokens` request header when listing repositories or organizations.

The backend then uses these user tokens to call the SCM APIs on behalf of the user, returning only what that user can access.

### Required OAuth Configuration

GitHub and/or GitLab OAuth providers are **required** for repository and organization listing. The backend enforces this: `GET /repositories` and `GET /organizations/{org}/repositories` return **HTTP 401** if the `X-SCM-Tokens` header is absent or empty.

If `ScmAuthApi` is not registered in the application, or if token collection fails for every configured SCM host, the frontend blocks the listing request and surfaces a descriptive error prompting the user to configure the OAuth integration.

> **Migration note:** Deployments that previously relied on server-side integration credentials alone for the repository list view (GitHub App, PAT, or GitLab token) must now also configure an SCM OAuth provider. See [Configuring Auth Providers](#configuring-auth-providers) below.

### Configuring Auth Providers

To enable user-scoped repository listings, configure the relevant auth providers in your `app-config.yaml`:

```yaml
auth:
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
    gitlab:
      development:
        clientId: ${GITLAB_CLIENT_ID}
        clientSecret: ${GITLAB_CLIENT_SECRET}
```

Refer to the Backstage documentation for [GitHub auth](https://backstage.io/docs/auth/github/provider) and [GitLab auth](https://backstage.io/docs/auth/gitlab/provider) for full configuration details.

## New Frontend System

If you're using Backstage's new frontend system, add the plugin to your app:

```tsx
// packages/app/src/App.tsx
import bulkImportPlugin from '@red-hat-developer-hub/backstage-plugin-bulk-import/alpha';

export default createApp({
  features: [
    // ...other plugins
    bulkImportPlugin,
  ],
});
```

The plugin will automatically provide:

- Bulk Import page at `/bulk-import` with all existing features
- A "Bulk import" navigation item in the sidebar

### Extensions

The following extensions are available in the plugin:

- `api:bulk-import`
- `page:bulk-import`
- `nav-item:bulk-import`
