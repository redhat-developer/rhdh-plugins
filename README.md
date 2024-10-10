# Red Hat Developer Hub Plugins Repository

> [!WARNING]
> Under Construction

## What is this repository?

This repository hosts plugins developed by Red Hat. The processes, tooling, and workflows are based on those in [backstage/community-plugins](https://github.com/backstage/community-plugins).

Plugins in this repository will be published to the `@red-hat-developer-hub` public npm namespace.

## Contributing a plugin

Contributions are welcome! To contribute a plugin, please follow the guidelines outlined in [CONTRIBUTING.md](https://github.com/redhat-developer/rhdh-plugins/blob/main/CONTRIBUTING.md). You can choose to either contribute to the shared repository or self-host your plugin for full autonomy.

## Plugins Workflow

Plugins are grouped into workspaces based on their purpose. Each workspace operates independently, with its own release cycle and dependencies managed via npm. Upon adding a new changeset, a version update PR will be automatically generated, which triggers the release of the workspace upon merging.
