# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider

## 0.2.0

### Minor Changes

- 20b4a8a: Add common skills catalog entity provider (OpenSpec tasks 4.1 and 4.2).

  One provider consumes normalized v1 snapshots from OCI and npx connectors
  using the same implementation. Each source has independent configuration,
  location keys, and polling schedule. The provider resolves connector URLs
  through Backstage discovery and obtains service tokens targeted to the
  receiving plugin ID.
