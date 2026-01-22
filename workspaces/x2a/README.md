# X2Ansible Backstage Plugin

This is a Backstage plugin workspace providing web UI for the [X2Ansible](https://github.com/x2ansible/x2a-convertor) project.

## Development Environment Setup

### Prerequisites

- Node.js 18 or 20
- Yarn package manager
- Kubernetes cluster access (optional, for Kubernetes features)

### Installation

1. Install dependencies:

   ```sh
   yarn install
   ```

2. Start the development environment:

   ```sh
   yarn dev
   ```

   This command runs both the frontend and backend plugins in parallel. The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:7007`.

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

Additional methods are planed to be implemented later.

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

## Additional Commands

- `yarn test` - Run tests
- `yarn lint` - Run linter
- `prettier:fix` - Fix by prettier
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
