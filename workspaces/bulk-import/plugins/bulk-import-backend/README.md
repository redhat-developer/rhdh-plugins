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

importAPI: This field defines the import workflow. It currently supports three options:

- open-pull-requests: This is the default import workflow, which includes the logic for creating pull requests for every selected repository.
- scaffolder: This workflow uses an import scenario defined in the scaffolder template. The import steps depend on the template's content, allowing for various scenarios. These can include importing existing catalog entities from a repository, creating pull requests, calling webhooks, and more. This method offers greater flexibility.
- orchestrator: This workflow uses the Orchestrator plugin to execute workflows for bulk import operations. This mode provides advanced workflow orchestration capabilities and integrates with the Backstage Orchestrator plugin.

> Important Note
> The scaffolder template must be generic and not specific to a single repository to be successfully executed for every repository in the bulk list.

For the RHDH instance to use the scaffolder functionality, it must be run with the following environment variable enabled:

```
export NODE_OPTIONS=--no-node-snapshot
```

##### Scaffolder Template Input Parameters

The **Bulk Import plugin** executes a Scaffolder template task with specified parameters. The Scaffolder template author should use these parameters within the template.

The Bulk Import plugin parses Git repository information and provides the following parameters for the Scaffolder template task:

- **`repoUrl`** – Normalized repository URL in the format:  
  ${gitProviderHost}?owner=${owner}&repo=${repository-name}

**Example:** `https://github.com/redhat-developer/rhdh-plugins` will be transformed to:  
`github.com?owner=redhat-developer&repo=rhdh-plugins`.

- **`name`** – Repository name.  
  **Example:** For `https://github.com/redhat-developer/rhdh-plugins`, the `name` will be `rhdh-plugins`.

- **`organization`** – Repository owner, which can be a user nickname or organization name.  
  **Example:** For `https://github.com/redhat-developer/rhdh-plugins`, `organization` will be `redhat-developer`.

- **`branchName`** – Proposed repository branch. By default, it is `bulk-import-catalog-entity`.

- **`targetBranchName`** – Default branch of the Git repository.

- **`gitProviderHost`** – Git provider host parsed from the repository URL.  
  **Example:** For `https://github.com/redhat-developer/rhdh-plugins`, `gitProviderHost` will be `github.com`.  
  This parameter allows the template author to write Git-provider-agnostic templates.

### Example of Using Parameters in a Scaffolder Template

```yaml
parameters:
  - title: Repository Details
    required:
      - repoUrl
      - branchName
      - targetBranchName
      - name
      - organization
    properties:
      repoUrl:
        type: string
        title: Repository URL (Backstage format)
        description: 'e.g. github.com?owner=Org&repo=repoName or gitlab.com?owner=Org&repo=repoName'
      organization:
        type: string
        title: Owner of the Repository
      name:
        type: string
        title: Name of the repository
      branchName:
        type: string
        title: Branch to add the catalog entity to
      targetBranchName:
        type: string
        title: Branch to target the PR/MR to
      gitProviderHost:
        type: string
        title: Git provider host
```

#### Orchestrator Workflow Execution

The Bulk Import plugin supports using the Orchestrator plugin to execute workflows for bulk import operations. This mode leverages the Orchestrator's workflow engine to provide advanced orchestration capabilities for importing repositories.

##### Plugin Configuration

To use the orchestrator mode, configure the Bulk Import plugin as follows:

```yaml
bulkImport:
  orchestratorWorkflow: your-workflow-id
  importAPI: 'orchestrator'
```

**Configuration Parameters:**

- **`orchestratorWorkflow`** (required): The ID of the orchestrator workflow to execute for each repository. This workflow must be registered in the Orchestrator plugin.
- **`importAPI`**: Set to `'orchestrator'` to enable orchestrator workflow execution mode.

> **Important Notes:**
>
> - The Orchestrator plugin must be installed and configured in your Backstage instance.
> - The specified workflow must be available in the Orchestrator plugin.
> - The workflow must be generic and able to handle different repositories, as it will be executed for each repository in the bulk import list.

##### Orchestrator Workflow Input Parameters

When executing an orchestrator workflow, the Bulk Import plugin provides the following input data to the workflow:

- **`owner`** – Repository owner (organization or user name).
  **Example:** For `https://github.com/redhat-developer/rhdh-plugins`, `owner` will be `redhat-developer`.

- **`repo`** – Repository name.
  **Example:** For `https://github.com/redhat-developer/rhdh-plugins`, `repo` will be `rhdh-plugins`.

- **`baseBranch`** – Default branch of the Git repository (e.g., `main`, `master`).

- **`targetBranch`** – Target branch for the import operation. By default, this is set to `bulk-import-orchestrator`.

Additionally, the plugin automatically provides authentication tokens for the Git provider:

- **`authTokens`** – Array of authentication tokens for the Git provider:
  - For GitHub repositories (`approvalTool: 'GIT'`): `{ token: <github-token>, provider: 'github' }`
  - For GitLab repositories (`approvalTool: 'GITLAB'`): `{ token: <gitlab-token>, provider: 'gitlab' }`

The tokens are obtained from the configured GitHub/GitLab integrations in your Backstage instance.

##### How Orchestrator Mode Works

1. **Workflow Execution**: When you submit a bulk import request with `importAPI: 'orchestrator'`, the plugin:
   - Iterates through each repository in the request
   - Retrieves the appropriate Git provider credentials (GitHub or GitLab)
   - Executes the specified orchestrator workflow for each repository
   - Passes the repository information and authentication tokens as input data

2. **Workflow Tracking**: The plugin:
   - Stores workflow instance IDs in the database
   - Associates each workflow instance with its repository
   - Tracks workflow execution status by querying the Orchestrator API

3. **Status Monitoring**: You can check the status of orchestrator workflows:
   - The workflow status is mapped from Orchestrator states to Bulk Import statuses (e.g., `WORKFLOW_ACTIVE`, `WORKFLOW_COMPLETED`, `WORKFLOW_ERROR`)
   - Status information includes the workflow instance ID, which can be used to view detailed workflow execution in the Orchestrator UI

##### API Endpoints for Orchestrator Mode

When using `importAPI: 'orchestrator'`, the following API endpoints are used:

- **`POST /api/bulk-import/orchestrator-workflows`** – Create orchestrator workflow import jobs
- **`GET /api/bulk-import/orchestrator-workflows`** – List all orchestrator workflow import jobs
- **`GET /api/bulk-import/orchestrator-import/by-repo`** – Get orchestrator workflow import status for a specific repository
- **`DELETE /api/bulk-import/orchestrator-import/by-repo`** – Delete orchestrator workflow records for a specific repository

##### Example Orchestrator Workflow

Your orchestrator workflow should accept the input parameters described above. Here's an example of how the workflow input data structure looks:

```json
{
  "inputData": {
    "owner": "redhat-developer",
    "repo": "rhdh-plugins",
    "baseBranch": "main",
    "targetBranch": "bulk-import-orchestrator"
  },
  "authTokens": [
    {
      "token": "<github-token>",
      "provider": "github"
    }
  ]
}
```

The workflow can then use these parameters to perform operations such as:

- Creating catalog entities
- Generating pull requests
- Calling external APIs
- Performing custom import logic

##### Workflow Status Mapping

The plugin maps Orchestrator workflow states to Bulk Import status values:

- Orchestrator `ACTIVE` → `WORKFLOW_ACTIVE`
- Orchestrator `COMPLETED` → `WORKFLOW_COMPLETED`
- Orchestrator `ERROR` → `WORKFLOW_ERROR`
- Orchestrator `ABORTED` → `WORKFLOW_ABORTED`
- Other states are prefixed with `WORKFLOW_` and uppercased

If workflow status cannot be retrieved, the status is set to `WORKFLOW_FETCH_FAILED`.

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
