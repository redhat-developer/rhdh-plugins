---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': minor
---

Add common skills catalog entity provider (OpenSpec task 4.1).

One provider consumes normalized v1 snapshots from OCI and npx connectors
using the same implementation. Each source has independent configuration,
location keys, and polling schedule. The provider resolves connector URLs
through Backstage discovery and obtains service tokens targeted to the
receiving plugin ID.
