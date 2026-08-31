---
'@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk': minor
'@red-hat-developer-hub/backstage-plugin-ogx-entity-provider': minor
---

Add DeltaSyncManager class to the entity-provider SDK for cursor-based incremental sync via Backstage's `applyMutation({ type: 'delta' })` API. Update OGX agent and model entity providers to emit the three required AI asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`).
