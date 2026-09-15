# Extensions backend plugin

HTTP APIs for the Extensions catalog (plugins, packages, collections) and permission-gated install/configure operations. Pair this package with `@red-hat-developer-hub/backstage-plugin-extensions` (UI) and `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions` (catalog entities).

Local development, `dev/` harness, and scoped test commands: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-extensions-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-extensions-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-extensions-backend'),
);
```

### Plugin Configurations

Add the following extensions configuration in your `app-config.yaml` file:

```yaml
extensions:
  ### Example for how to enable installation to a file.
  installation:
    enabled: true
    saveToSingleFile:
      file: <path-to>/dynamic-plugins.yaml
```
