# X2A Backend Plugin

The X2A (X to Ansible) backend plugin provides REST API endpoints and Kubernetes job orchestration for migrating applications to Ansible playbooks using LLM-powered conversion.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-x2a-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-x2a-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(import('@red-hat-developer-hub/backstage-plugin-x2a-backend'));
```

## Configuration

The X2A plugin requires configuration in your `app-config.yaml` file. All settings support environment variable substitution for easier deployment.

### Kubernetes Configuration

Configure how X2A jobs run in Kubernetes:

```yaml
x2a:
  kubernetes:
    # Kubernetes namespace where jobs will be created
    namespace: ${X2A_KUBERNETES_NAMESPACE:-default}
    # X2A convertor container image
    image: ${X2A_KUBERNETES_IMAGE:-quay.io/x2ansible/x2a-convertor}
    imageTag: ${X2A_KUBERNETES_IMAGE_TAG:-latest}
    # Auto-delete completed jobs after 24 hours (86400 seconds)
    ttlSecondsAfterFinished: ${X2A_KUBERNETES_TTL_SECONDS:-86400}
    # Resource requests and limits for job pods
    resources:
      requests:
        cpu: ${X2A_KUBERNETES_CPU_REQUEST:-500m}
        memory: ${X2A_KUBERNETES_MEMORY_REQUEST:-1Gi}
      limits:
        cpu: ${X2A_KUBERNETES_CPU_LIMIT:-2000m}
        memory: ${X2A_KUBERNETES_MEMORY_LIMIT:-4Gi}
```

### LLM Provider Credentials

Configure credentials for your LLM provider. The plugin supports generic key-value pairs that are passed as environment variables to the job container:

#### AWS Bedrock with IAM Credentials

```yaml
x2a:
  credentials:
    llm:
      LLM_MODEL: ${LLM_MODEL:-anthropic.claude-v2}
      AWS_REGION: ${AWS_REGION}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
```

#### AWS Bedrock with Bearer Token

```yaml
x2a:
  credentials:
    llm:
      LLM_MODEL: ${LLM_MODEL:-anthropic.claude-v2}
      AWS_REGION: ${AWS_REGION}
      AWS_BEARER_TOKEN_BEDROCK: ${AWS_BEARER_TOKEN_BEDROCK}
```

#### OpenAI

```yaml
x2a:
  credentials:
    llm:
      LLM_MODEL: ${LLM_MODEL:-gpt-4}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
```

**Note:** If `LLM_MODEL` is not provided, it defaults to `anthropic.claude-v2`.

### Ansible Automation Platform (AAP) Credentials

AAP credentials can be provided in two ways:

1. **System-wide configuration** in `app-config.yaml` (shared by all projects)
2. **User-provided** via API requests (overrides system-wide configuration)

At least one source must provide valid AAP credentials. You can use either OAuth token or username/password authentication, but not both.

#### System-Wide Configuration

##### OAuth Token Authentication

```yaml
x2a:
  credentials:
    aap:
      url: ${AAP_URL}
      orgName: ${AAP_ORG_NAME}
      oauthToken: ${AAP_OAUTH_TOKEN}
```

##### Username/Password Authentication

```yaml
x2a:
  credentials:
    aap:
      url: ${AAP_URL}
      orgName: ${AAP_ORG_NAME}
      username: ${AAP_USERNAME}
      password: ${AAP_PASSWORD}
```

**Important:** If the environment variables are not set, the configuration will have `undefined` values and will be treated as if no system-wide credentials are provided. In this case, users **must** provide AAP credentials in their API requests.

#### User-Provided AAP Credentials

Users can provide AAP credentials when creating jobs via the REST API. These credentials override any system-wide configuration:

```bash
# Example: Run job with user-provided AAP credentials
curl -X POST http://localhost:7007/api/x2a/projects/${PROJECT_ID}/modules/${MODULE_ID}/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "phase": "analyze",
    "sourceRepo": {"url": "...", "token": "...", "branch": "main"},
    "targetRepo": {"url": "...", "token": "...", "branch": "main"},
    "aapCredentials": {
      "url": "https://aap.example.com",
      "orgName": "MyOrg",
      "oauthToken": "your-token"
    }
  }'
```

#### AAP Credentials Validation

The plugin validates AAP credentials to ensure they are complete:

- ✅ **Valid**: OAuth token provided (`oauthToken` is set)
- ✅ **Valid**: Username AND password provided (both `username` and `password` are set)
- ❌ **Invalid**: Only username provided (password missing)
- ❌ **Invalid**: Only password provided (username missing)
- ❌ **Invalid**: Both OAuth token and username/password provided (mutually exclusive)
- ❌ **Invalid**: Neither authentication method provided

### Environment Variables

All configuration values can be provided via environment variables. Here's a complete example:

```bash
# Kubernetes Configuration
export X2A_KUBERNETES_NAMESPACE=x2a-jobs
export X2A_KUBERNETES_IMAGE=quay.io/x2ansible/x2a-convertor
export X2A_KUBERNETES_IMAGE_TAG=v1.0.0
export X2A_KUBERNETES_TTL_SECONDS=86400
export X2A_KUBERNETES_CPU_REQUEST=500m
export X2A_KUBERNETES_MEMORY_REQUEST=1Gi
export X2A_KUBERNETES_CPU_LIMIT=2000m
export X2A_KUBERNETES_MEMORY_LIMIT=4Gi

# LLM Provider (AWS Bedrock example)
export LLM_MODEL=anthropic.claude-v2
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key

# AAP Credentials (optional)
export AAP_URL=https://aap.example.com
export AAP_ORG_NAME=MyOrganization
export AAP_OAUTH_TOKEN=your-oauth-token
```

## Recent Changes

### AAP Credentials Handling Improvements

The plugin now properly handles AAP credentials from both system-wide configuration and user-provided sources:

- **Fixed validation logic**: Environment variables with `undefined` values are now correctly treated as "no credentials provided" rather than causing validation errors
- **Smart fallback**: The plugin checks if system-wide AAP credentials have valid authentication methods before using them as fallback
- **User override support**: Users can provide AAP credentials in API requests to override system defaults or provide credentials when none are configured
- **Type safety**: Fixed Kubernetes API type conversion for `ttlSecondsAfterFinished` to ensure proper int32 values

### API Endpoint Improvements

- **Fixed authentication**: All project lookup operations now properly pass user credentials for authorization checks
- **Consistent permissions**: The following endpoints now correctly validate user permissions:
  - `POST /projects/:projectId/run` (init phase)
  - `POST /projects/:projectId/modules` (create module)
  - `POST /projects/:projectId/modules/:moduleId/run` (analyze/migrate/publish phases)

## API Usage Examples

### Creating a Project

```bash
curl -X POST http://localhost:7007/api/x2a/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "My Chef Migration",
    "description": "Test migration",
    "abbreviation": "TEST"
  }'
```

### Running a Job with AAP Credentials

#### Option 1: Using System-Wide AAP Credentials (from app-config.yaml)

```bash
# Environment variables must be set: AAP_URL, AAP_ORG_NAME, AAP_OAUTH_TOKEN
curl -X POST http://localhost:7007/api/x2a/projects/${PROJECT_ID}/modules/${MODULE_ID}/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "phase": "analyze",
    "sourceRepo": {
      "url": "https://github.com/org/source",
      "token": "ghp_src123",
      "branch": "main"
    },
    "targetRepo": {
      "url": "https://github.com/org/target",
      "token": "ghp_tgt456",
      "branch": "main"
    }
  }'
```

#### Option 2: Providing AAP Credentials in Request

```bash
# No environment variables needed - credentials provided in request
curl -X POST http://localhost:7007/api/x2a/projects/${PROJECT_ID}/modules/${MODULE_ID}/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "phase": "analyze",
    "sourceRepo": {
      "url": "https://github.com/org/source",
      "token": "ghp_src123",
      "branch": "main"
    },
    "targetRepo": {
      "url": "https://github.com/org/target",
      "token": "ghp_tgt456",
      "branch": "main"
    },
    "aapCredentials": {
      "url": "https://aap.example.com",
      "orgName": "MyOrg",
      "oauthToken": "your-oauth-token"
    }
  }'
```

### Error Handling

Common errors and solutions:

| Error                                                                          | Cause                                | Solution                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------- |
| `AAP credentials must be provided either in app-config.yaml or by the user`    | No AAP credentials available         | Set AAP environment variables OR provide `aapCredentials` in request |
| `AAP credentials must include either oauthToken OR username+password`          | Incomplete authentication method     | Provide either `oauthToken` OR both `username` and `password`        |
| `AAP credentials should have either oauthToken OR username+password, not both` | Both authentication methods provided | Use only one authentication method                                   |

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
