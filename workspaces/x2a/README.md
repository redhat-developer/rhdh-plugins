# X2Ansible Backstage Plugin

This is a Backstage plugin workspace providing web UI for the [X2Ansible](https://github.com/x2ansible/x2a-convertor) project.

## Plugins in this Workspace

### X2A Backend Plugin

The [X2A Backend Plugin](./plugins/x2a-backend) provides REST API endpoints and Kubernetes job orchestration for migrating applications to Ansible playbooks using LLM-powered conversion. It manages the lifecycle of migration jobs, credential storage (LLM and AAP), and integration with Ansible Automation Platform.

Key features:

- RESTful API for project and job management
- Kubernetes job orchestration with automatic cleanup
- Secure credential management via Kubernetes secrets
- Support for multiple LLM providers (AWS Bedrock, OpenAI)
- Integration with Ansible Automation Platform

See the [backend plugin README](./plugins/x2a-backend/README.md) for detailed configuration and usage documentation.

## Development Environment Setup

### Prerequisites

- Node.js >22
- Yarn package manager
- Kubernetes cluster access (optional, for Kubernetes features)

### Installation

1. Install dependencies:

   ```sh
   yarn install
   ```

2. **Optional:** Update `app-config.yaml` based on your environment.
   - **`auth:`**
     - Configure authentication providers for sign-in and SCM access (GitHub, GitLab). See [Backstage auth docs](https://backstage.io/docs/auth/).
     - Based on your options of auth-providers, mind updating the `plugins/scaffolder-backend-module-x2a/templates/conversion-project-template.yaml` for source and target repository URLs.
   - **`integrations:`**
     - Configure SCM integrations for custom-domain hosts (e.g. self-hosted GitHub Enterprise, GitLab, or Bitbucket). The plugin reads the `integrations:` section to detect which SCM provider owns a given repository URL. Only the `host` field is required for this purpose; access tokens in `integrations:` entries are **not** needed by the x2a plugin (authentication is handled via OAuth through the `auth:` providers above). See the [SCM Provider Detection](#scm-provider-detection) section below.
   - **`x2a:`** - Provide LLM credentials, Ansible Automation Platform connection details, and Kubernetes resource limits. See [x2a-convertor technical details](https://github.com/x2ansible/x2a-convertor?tab=readme-ov-file#technical-details).

3. Start the development environment with just the plugin loaded:

   **GitHub OAuth**: [Create a GitHub OAuth application](https://github.com/settings/developers).

   **GitLab OAuth:** When [creating a GitLab OAuth application](https://gitlab.com/-/user_settings/applications), request scopes per [official documentation](https://backstage.io/docs/auth/gitlab/provider/).

   Cloud-based **Bitbucket.org OAuth:** When creating a Bitbucket OAuth consumer via `https://bitbucket.org/[YOUR_WORKSPACE]/workspace/settings/api`, request scopes per [official documentation](https://backstage.io/docs/auth/bitbucket/provider/), which include:
   - `account:read`
   - `workspace membership:read`

   In addition, request the following scopes required by the Backstage Bitbucket scaffolder module for repository and pull-request operations:
   - `project:read`
   - `snippet:write`
   - `issue:write`
   - `pullrequest:write`

   ```sh
   export AUTH_GITHUB_CLIENT_ID=.... # Optional if "guest" user is not enough
   export AUTH_GITHUB_CLIENT_SECRET=... # Optional if "guest" user is not enough

   # For GitLab auth (create app at https://gitlab.com/-/user_settings/applications):
   export AUTH_GITLAB_CLIENT_ID=...
   export AUTH_GITLAB_CLIENT_SECRET=...

   # For Bitbucket:
   export AUTH_BITBUCKET_CLIENT_ID=... # Bitbucket "key"
   export AUTH_BITBUCKET_CLIENT_SECRET=...... # Bitbucket "secret"

   yarn dev
   ```

   This command runs both the frontend and backend plugins in parallel. The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:7007`.

   Eventually run the full Backstage application for more advanced testing or development, i.e. scaffolder or RBAC:

   ```sh
   export AUTH_GITHUB_CLIENT_ID=.... # Optional if "guest" user is not enough
   export AUTH_GITHUB_CLIENT_SECRET=... # Optional if "guest" user is not enough
   export AUTH_GITLAB_CLIENT_ID=...
   export AUTH_GITLAB_CLIENT_SECRET=...

   yarn start
   ```

## SCM Provider Detection

The plugin needs to know which SCM provider (GitHub, GitLab, or Bitbucket) a repository URL belongs to so it can use the correct OAuth scopes, token formats, and web UI URL patterns.

### How detection works

1. **Config-based detection (recommended for custom domains):** The plugin reads the Backstage `integrations:` config section and builds a hostname-to-provider mapping. Any host listed under `integrations.github`, `integrations.gitlab`, or `integrations.bitbucketCloud` is automatically associated with the corresponding provider.

2. **URL heuristic fallback:** When no matching host is found in the config, the plugin falls back to simple URL matching: URLs containing `github.com` resolve to GitHub, `bitbucket.org` to Bitbucket, and everything else defaults to GitLab.

### Configuration

To enable detection for SCM hosts on custom domains, add them to the `integrations:` section of `app-config.yaml`. Only the `host` field is required — access tokens are **not** needed for provider detection (the x2a plugin authenticates via OAuth through the `auth:` providers, not through integration tokens).

```yaml
integrations:
  github:
    - host: github.com
    - host: github.mycompany.com # GitHub Enterprise on a custom domain
      apiBaseUrl: https://github.mycompany.com/api/v3
  gitlab:
    - host: gitlab.com
    - host: gitlab.internal.io # Self-hosted GitLab
      apiBaseUrl: https://gitlab.internal.io/api/v4
  bitbucketCloud:
    - host: bitbucket.org
```

Without this configuration, only the well-known cloud hosts (`github.com`, `bitbucket.org`) are detected by URL; all other hosts fall back to GitLab behavior.

## Adding New API Endpoints

To add a new API endpoint, follow these steps:

### 1. Update the OpenAPI Specification

Edit `plugins/x2a-backend/src/schema/openapi.yaml` to add your new endpoint definition. For example:

```yaml
paths:
  /projects/{projectId}/status:
    get:
      summary: Returns the status of a project.
      parameters:
        - in: path
          name: projectId
          schema:
            type: string
          required: true
      responses:
        '200':
          description: Project status.
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
```

### 2. Regenerate the API Code

After updating `openapi.yaml`, regenerate the server and client API code:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-x2a-backend openapi-generate
```

This command:

- Generates TypeScript types and server-side code in `plugins/x2a-backend/src/schema/openapi/generated/`
- Generates client-side code in `plugins/x2a-common/client/src/schema/openapi/generated/`

### 3. Implement the Endpoint Handler

**Note:** Always regenerate the API code before implementing new endpoints to ensure TypeScript types are up to date.

Add your endpoint implementation in `plugins/x2a-backend/src/router.ts`. Import the generated types and implement the handler:

```typescript
import { ProjectStatusGet } from './schema/openapi';

router.get('/projects/:projectId/status', async (req, res) => {
  const endpoint = 'GET /projects/:projectId/status';
  const projectId = req.params.projectId;

  // Your implementation here
  const status = await x2aDatabase.getProjectStatus({ projectId });

  const response: ProjectStatusGet['response'] = status;
  res.json(response);
});
```

## Database Configuration

By default, the plugin uses SQLite with an in-memory database for local development. The database configuration is located in `app-config.yaml`:

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

### Using a Plugin-Specific Database

To configure a separate database for the x2a plugin:

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
    plugin:
      x2a:
        connection:
          filename: ./data/x2a.db
```

### Using Other Database Backends

The plugin uses Knex.js, which supports multiple database backends (PostgreSQL, MySQL, etc.). To use a different database:

1. Install the appropriate database client package (e.g., `pg` for PostgreSQL)
2. Update `app-config.yaml`:

```yaml
backend:
  database:
    client: pg
    connection:
      host: localhost
      port: 5432
      user: postgres
      password: ${POSTGRES_PASSWORD}
      database: x2a
```

### Database Migrations

Database migrations are located in `plugins/x2a-backend/migrations/`. Migrations run automatically when the backend starts. To create a new migration:

1. Create a new file in `plugins/x2a-backend/migrations/` following the naming pattern: `YYYYMMDDHH_description.ts`
2. Implement `up()` and `down()` functions:

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('new_table', table => {
    table.uuid('id').primary();
    // ... other columns
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('new_table');
}
```

## Kubernetes Connection Setup

The plugin uses the Kubernetes client library to interact with Kubernetes clusters.

By default, it loads configuration from your local `~/.kube/config` file.

Additional methods are planned to be implemented later.

### Local Development Setup

1. Ensure you have a valid Kubernetes configuration file at `~/.kube/config`
2. The plugin will automatically detect and use this configuration

### Using a Custom Kubeconfig Location

Set the `KUBECONFIG` environment variable to point to your kubeconfig file:

```sh
export KUBECONFIG=/path/to/your/kubeconfig
yarn dev
```

### In-Cluster Configuration

When running inside a Kubernetes cluster, the plugin will automatically fall back to in-cluster configuration if no local kubeconfig is found.

### Verifying Kubernetes Connection

The plugin's `KubeService` provides methods to interact with Kubernetes resources. Check the logs when starting the backend to see if the Kubernetes configuration was loaded successfully:

```
Loaded Kubernetes configuration from ~/.kube/config
```

## Running Tests with PostgreSQL

By default, `yarn test` runs database tests against SQLite only. The backend
tests are written to also exercise PostgreSQL (via `TestDatabases` from
`@backstage/backend-test-utils`), but PostgreSQL is skipped locally because the
Backstage test tooling disables Docker when the `CI` environment variable is not
set.

### Quick start — testcontainers (Docker/Podman)

Run tests against both SQLite and PostgreSQL with a single command:

```sh
yarn test:pg          # unit tests (SQLite + PostgreSQL)
yarn test:all:pg      # full suite including lint, prettier, coverage
```

These scripts set `CI=true` so that `testcontainers` automatically pulls and
starts a `postgres:18` container. **Docker or Podman must be running.**

On Fedora/RHEL with Podman, enable the Docker-compatible socket first:

```sh
systemctl --user enable --now podman.socket
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
```

The first run downloads the `postgres:18` image.

## Additional Commands

- `yarn test` - Run tests (SQLite only)
- `yarn test:pg` - Run tests (SQLite + PostgreSQL via testcontainers)
- `yarn lint` - Run linter
- `yarn prettier:fix` - Fix code formatting
- `yarn build:all` - Build all packages
- `yarn clean` - Clean build artifacts

## Project Structure

- `plugins/x2a/` - Frontend plugin
- `plugins/x2a-backend/` - Backend plugin
  - `src/schema/openapi.yaml` - OpenAPI specification
  - `src/schema/openapi/generated/` - Generated server-side API code
  - `src/router.ts` - API route handlers
  - `src/services/` - Business logic services
  - `migrations/` - Database migrations
- `plugins/x2a-common/` - Shared code between frontend and backend
  - `client/src/schema/openapi/generated/` - Generated client-side API code

## CSV Bulk Project Import

See [CSV Bulk Project Import](./docs/csv-bulk-import.md) for the CSV file format, an example, repository URL conventions, and the `RepoAuthentication` scaffolder extension.
