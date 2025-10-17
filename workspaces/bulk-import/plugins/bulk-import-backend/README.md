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

#### Scaffolder Template Execution

The Bulk Import plugin allows for the execution of a scaffolder template on multiple selected repositories. An administrator can create a scaffolder template specifically for the Bulk Import plugin and provide it within the application's configuration.

##### Plugin Configuration

The Bulk Import plugin has a specific configuration for the scaffolder template:

```
bulkImport:
  importTemplate: your-template-entity-reference-or-template-name
  importAPI: 'scaffolder'
```

importAPI: This field defines the import workflow. It currently supports two options:

- open-pull-requests: This is the default import workflow, which includes the logic for creating pull requests for every selected repository.
- scaffolder: This workflow uses an import scenario defined in the scaffolder template. The import steps depend on the template's content, allowing for various scenarios. These can include importing existing catalog entities from a repository, creating pull requests, calling webhooks, and more. This method offers greater flexibility.

> Important Note
> The scaffolder template must be generic and not specific to a single repository to be successfully executed for every repository in the bulk list.

For the RHDH instance to use the scaffolder functionality, it must be run with the following environment variable enabled:

```
export NODE_OPTIONS=--no-node-snapshot
```

### Audit Logging

Audit logging is backed by the [`@backstage/backend-plugin-api`](https://www.npmjs.com/package/@backstage/backend-plugin-api) package.
The Bulk Import Backend plugin emits audit events for various operations. Events are grouped logically by `eventId`.

**Bulk import Events:**

- **`unknown-endpoint`**: tracks requests to unknown endpoints.

- **`ping`**: tracks `GET` requests to the `/ping` endpoint, which allows to make sure the bulk import backend is up and running.

- **`org-read`**: tracks `GET` requests to the `/organizations` endpoint, which returns the list of organizations accessible from all configured GitHub Integrations.

  Filter on `queryType`.
  - **`all`**: tracks fetching all organizations. (GET `/organizations`)
  - **`by-query`**: tracks fetching organization filtered by the query parameter 'search'. (GET `/organizations`)

- **`repo-read`**: tracks `GET` requests to the endpoint, which returns the list of repositories accessible from all configured GitHub Integrations.

  Filter on `queryType`.
  - **`all`**: tracks fetching a list of all repositories accessible by Backstage Github Integrations. (GET `/repositories`)
  - **`by-query`**: tracks fetching a list of repositories filtered by the query parameter 'search'. (GET `/repositories`)
  - **`by-org`**: tracks `GET` requests to the `/organizations/:orgName/repositories` endpoint, which returns the list of repositories for the specified organization (accessible from any of the configured GitHub Integrations)

- **`import-read`**: tracks `GET` requests to the `/imports` endpoint, which returns the list of existing import jobs along with their statuses.

  Filter on `queryType`.
  - **`all`**: tracks fetching all imports.
  - **`by-query`**: tracks fetching imports filtered by the query parameter 'search'.

- **`import-status-read`**: tracks `GET` requests to the `/import/by-repo` endpoint, which fetches details about the import job for the specified repository.

  Filter on `queryType`.
  - **`by-query`**: tracks fetching import status filtered by the query parameter 'repo'. (GET `/import/by-repo`).

- **`import-write`** tracks events about midification imports.

  Filter on `actionType`.
  - **`create`**: tracks creating import job. Event submitted on `POST` `/imports`, which allows to submit requests to bulk-import one or many repositories into the Backstage Catalog, by eventually creating import Pull Requests in the target repositories.
  - **`delete`**: tracks deleting import by query parameter 'repo'. Event submitted on `DELETE` `/import/by-repo` requests, which deletes any existing import job for the specified repository, by closing any open import Pull Request that could have been created.

Example:

```text
➤ YN0000: [backend]: 2025-03-20T17:12:34.754Z bulk-import info bulk-import.org-read isAuditEvent=true eventId="org-read" severityLevel="medium" actor={"ip":"::1","hostname":"localhost","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"} request={"url":"/api/bulk-import/organizations?pagePerIntegration=1&sizePerIntegration=5&search=","method":"GET"} meta={"queryType":"all","search":"redhat-developer","responseStatus":200} status="succeeded"
```

## For Users

### Usage

The bulk import backend plugin provides a REST API to bulk import catalog entities into the catalog. The API is available at the `/api/bulk-import` endpoint.

As a prerequisite, you need to add at least one GitHub Integration (using either a GitHub token or a GitHub App or both) in your app-config YAML file (or a local `app-config.local.yaml` file).
See https://backstage.io/docs/integrations/github/locations/#configuration and https://backstage.io/docs/integrations/github/github-apps/#including-in-integrations-config for more details.

## REST API

Please refer to [`src/schema/openapi.yaml`](src/schema/openapi.yaml) for the API definition (along with some examples) and the [generated documentation](api-docs/README.md) for more details about the request and response parameters and formats.
