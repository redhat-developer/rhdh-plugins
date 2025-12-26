# marketplace

This plugin backend was templated using the Backstage CLI. You should replace this text with a description of your plugin backend.

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

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
