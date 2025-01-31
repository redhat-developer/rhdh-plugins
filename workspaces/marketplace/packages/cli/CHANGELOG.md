# @red-hat-developer-hub/marketplace-cli

## 0.0.1

### Patch Changes

- 3c12103: Added new `marketplace-cli` and implement `generate` command.

  This command generates Plugin entities based on the information from the [dynamic-plugins.default.yaml](https://github.com/redhat-developer/rhdh/blob/main/dynamic-plugins.default.yaml) and wrapper's `package.json`. It assumes that all `packages` in the config files are wrappers.
