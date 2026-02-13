# Konflux Plugin Workspace

The Konflux plugin is a Backstage integration plugin that connects Backstage with Konflux (Red Hat's application delivery platform). It aggregates and displays Kubernetes resources (Applications, Components, PipelineRuns, Releases) from multiple clusters and namespaces, providing a unified view of your Konflux resources within Backstage.

## Plugins

- [konflux](./plugins/konflux/README.md) - The frontend plugin for Konflux
- [konflux-backend](./plugins/konflux-backend/README.md) - The backend plugin for Konflux
- [konflux-common](./plugins/konflux-common/README.md) - A common library containing shared utilities to be used across Konflux plugins

## Local Development

To start the Backstage App, run:

```sh
yarn install
yarn start
```

For more detailed documentation, see the [main plugin README](./plugins/konflux/README.md).
