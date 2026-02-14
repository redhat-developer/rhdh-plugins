# Red Hat Developer Hub Plugins Repository

## What is this repository?

This repository hosts plugins developed by Red Hat. The processes, tooling, and workflows are based on those in [backstage/community-plugins](https://github.com/backstage/community-plugins).

Plugins in this repository will be published to the `@red-hat-developer-hub` public npm namespace.

## Contributing a plugin

Contributions are welcome! To contribute a plugin, please follow the guidelines outlined in [CONTRIBUTING.md](https://github.com/redhat-developer/rhdh-plugins/blob/main/CONTRIBUTING.md). You can choose to either contribute to the shared repository or self-host your plugin for full autonomy.

## Plugins Workflow

The `rhdh-plugins` repository is organized into multiple workspaces, with each workspace containing a plugin or a set of related plugins. Each workspace operates independently, with its own release cycle and dependencies managed via npm. When a new changeset is added (each workspace has its own `.changeset` directory), a "Version packages ($workspace_name)" PR is automatically generated. Merging this PR triggers the release of all plugins in the workspace and updates the corresponding `CHANGELOG` files.
