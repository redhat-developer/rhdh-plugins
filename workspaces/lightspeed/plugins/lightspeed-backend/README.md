# Lightspeed Backend

This is the lightspeed backend plugin that enables you to interact with any LLM server running a model with OpenAI's API compatibility.

## Getting Started

### Installing the plugin

```bash
yarn add --cwd packages/backend  @red-hat-developer-hub/backstage-plugin-lightspeed-backend
```

### Configuring the Backend

Add the following to your `packages/backend/src/index.ts` file:

```ts title="packages/backend/src/index.ts"
const backend = createBackend();

// Add the following line
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-lightspeed-backend'),
);

backend.start();
```

### Plugin Configurations

Add the following lightspeed configurations into your `app-config.yaml` file:

```yaml
lightspeed:
  servers:
    - id: <server id>
      url: <serverURL>
      token: <api key>
      questionValidation: true # Optional - To disable question (prompt) validation set it to false.
```

Example local development configuration:

```yaml
lightspeed:
  servers:
    - id: 'my-llm-server'
      url: 'https://localhost:443/v1'
      token: 'js92n-ssj28dbdk902' # dummy token
```

`questionValidation` is default to be enabled with topic restriction on RHDH related topics.
If you want to disable the validation, set the value to be `false`.

Example configuration to disable `questionValidation`:

```yaml
lightspeed:
  questionValidation: false
  servers: ... ...
```

#### Permission Framework Support

The Lightspeed Backend plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access lightspeed backend API, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, lightspeed.conversations.read, read, allow
p, role:default/team_a, lightspeed.conversations.create, create, allow
p, role:default/team_a, lightspeed.conversations.delete, delete, allow

g, user:default/<your-user-name>, role:default/team_a

```

You can specify the path to this configuration file in your application configuration:

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: /some/path/rbac-policy.csv
    policyFileReload: true
```
