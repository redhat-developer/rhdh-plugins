---
'@red-hat-developer-hub/backstage-plugin-ai-catalog': minor
'@red-hat-developer-hub/backstage-plugin-ai-catalog-common': minor
'@red-hat-developer-hub/backstage-plugin-ai-catalog-connector-utils': minor
'@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk': minor
'@red-hat-developer-hub/backstage-plugin-ogx-entity-provider': minor
'@red-hat-developer-hub/backstage-plugin-boost-backend': patch
'@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti': patch
'@red-hat-developer-hub/backstage-plugin-boost-backend-module-ogx': patch
'@red-hat-developer-hub/backstage-plugin-boost-node': patch
'@red-hat-developer-hub/backstage-plugin-boost-responses-api-toolkit': patch
'@red-hat-developer-hub/backstage-plugin-boost-migration-readiness': patch
'@red-hat-developer-hub/backstage-plugin-boost-toolscope': patch
---

Rename the first-release AI Catalog package family and update consumers to the new public package identities.

Move standalone OGX configuration to `ai-catalog.entityProviders.ogx`; the old
Boost configuration paths are no longer read by this module. Update frontend
extension IDs to the `ai-catalog` namespace and translation overrides to
`plugin.ai-catalog`. See the workspace README's consumer migration instructions.
