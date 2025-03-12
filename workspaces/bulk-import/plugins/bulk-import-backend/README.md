# Bulk Import Backend Plugin

This is `bulk-import-backend` plugin which provides Rest API to bulk import catalog entities into the catalog

## For administrators

### Installation and Configuration

To set up the bulk import backend package for the backend:

1. Install the bulk import backend plugin using the following command:

   ```console
   yarn workspace backend add @red-hat-developer-hub/backstage-plugin-bulk-import-backend
   ```

1. Add the following code to the `packages/backend/src/index.ts` file:

   ```ts title="packages/backend/src/index.ts"
   const backend = createBackend();
   /* highlight-add-next-line */
   backend.add(
     import('@red-hat-developer-hub/backstage-plugin-bulk-import-backend'),
   );

   backend.start();
   ```

#### Permission Framework Support

The Bulk Import Backend plugin has support for the permission framework. A basic example permission policy is shown below to disallow access to the bulk import API for all users except those in the `backstage-admins` group.

1. Create a backend module for the permission policy, under a `packages/backend/src/plugins/permissions.ts` file:

```ts title="packages/backend/src/plugins/permissions.ts"
import { createBackendModule } from '@backstage/backend-plugin-api';
import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import {
  AuthorizeResult,
  isPermission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

class BulkImportPermissionPolicy implements PermissionPolicy {
  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    if (isPermission(request.permission, bulkImportPermission)) {
      if (
        user?.identity.ownershipEntityRefs.includes(
          'group:default/backstage-admins',
        )
      ) {
        return { result: AuthorizeResult.ALLOW };
      }
    }
    return { result: AuthorizeResult.DENY };
  }
}

export const BulkImportPermissionBackendModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'custom-policy',
  register(reg) {
    reg.registerInit({
      deps: { policy: policyExtensionPoint },
      async init({ policy }) {
        policy.setPolicy(new BulkImportPermissionPolicy());
      },
    });
  },
});
```

2. Import `@backstage/plugin-permission-backend/alpha` and add your permission module to the `packages/backend/src/index.ts` file:

```ts title="packages/backend/src/index.ts"
import { BulkImportPermissionBackendModule } from './plugins/permissions';

backend.add(BulkImportPermissionBackendModule);
backend.add(import('@backstage/plugin-permission-backend/alpha'));
```

### Audit Logging

Audit logging is backed by the [`@backstage/backend-plugin-api`](https://www.npmjs.com/package/@backstage/backend-plugin-api) package. The Bulk Import Backend plugin adds the following events to the backend audit logs:

- **unknown-endpoint**: tracks requests to unknown endpoints.

- **ping**: tracks `GET` requests to the `/ping` endpoint, which allows to make sure the bulk import backend is up and running.

- **find-all-organizations**: tracks `GET` requests to the `/organizations` endpoint, which returns the list of organizations accessible from all configured GitHub Integrations.

- **find-repositories-by-organization**: tracks `GET` requests to the `/organizations/:orgName/repositories` endpoint, which returns the list of repositories for the specified organization (accessible from any of the configured GitHub Integrations).

- **find-all-repositories**: tracks `GET` requests to the `/repositories` endpoint, which returns the list of repositories accessible from all configured GitHub Integrations.

- **find-all-imports**: tracks `GET` requests to the `/imports` endpoint, which returns the list of existing import jobs along with their statuses.

- **create-import-jobs**: tracks `POST` requests to the `/imports` endpoint, which allows to submit requests to bulk-import one or many repositories into the Backstage Catalog, by eventually creating import Pull Requests in the target repositories.

- **find-import-status-by-repo**: tracks `GET` requests to the `/import/by-repo` endpoint, which fetches details about the import job for the specified repository.

- **delete-import-by-repo**: tracks `DELETE` requests to the `/import/by-repo` endpoint, which deletes any existing import job for the specified repository, by closing any open import Pull Request that could have been created.

Example:

```text
YN0000: [backend]: 2025-03-12T14:48:21.524Z bulk-import info bulk-import.find-all-organizations isAuditEvent=true eventId="find-all-organizations" severityLevel="medium" actor={"actorId":"user:default/some-user","ip":"::1","hostname":"localhost","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"} request={"url":"/api/bulk-import/organizations?pagePerIntegration=1&sizePerIntegration=5&search=","method":"GET"} meta={"responseStatus":304} status="succeeded"
```

## For Users

### Usage

The bulk import backend plugin provides a REST API to bulk import catalog entities into the catalog. The API is available at the `/api/bulk-import` endpoint.

As a prerequisite, you need to add at least one GitHub Integration (using either a GitHub token or a GitHub App or both) in your app-config YAML file (or a local `app-config.local.yaml` file).
See https://backstage.io/docs/integrations/github/locations/#configuration and https://backstage.io/docs/integrations/github/github-apps/#including-in-integrations-config for more details.

## REST API

Please refer to [`src/schema/openapi.yaml`](src/schema/openapi.yaml) for the API definition (along with some examples) and the [generated documentation](api-docs/README.md) for more details about the request and response parameters and formats.
