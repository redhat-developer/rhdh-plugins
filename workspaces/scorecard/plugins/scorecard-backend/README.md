# Scorecard backend plugin

Provides customizable metrics and scoring capabilities from various data sources for software components in the Backstage catalog.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-scorecard-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);
```

## Metric Providers

The Scorecard plugin collects metrics from third-party data sources using metric providers. The Scorecard node plugin provides `scorecardMetricsExtensionPoint` extension point that is used to connect your backend plugin module that exports custom metrics via metric providers to the Scorecard backend plugin. For detailed information on creating metric providers, see [providers.md](./docs/providers.md).

## Thresholds

Thresholds define conditions that determine which category a metric value belongs to (`error`, `warning`, or `success`). The Scorecard plugin provides multiple ways to configure thresholds:

- **Provider Defaults**: Metric providers define default thresholds
- **App Configuration**: Override defaults through `app-config.yaml`
- **Entity Annotations**: Override specific thresholds per entity using catalog annotations

Thresholds are evaluated in order, and the first matching rule determines the category. The plugin supports various operators for number metrics (`>`, `>=`, `<`, `<=`, `==`, `!=`, `-` (range)) and boolean metrics (`==`, `!=`).

For comprehensive threshold configuration guide, examples, and best practices, see [thresholds.md](./docs/thresholds.md).

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
