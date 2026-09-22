---
'@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk': major
---

Prune ai-catalog-entity-provider-sdk to the RHDH 2.1 public surface.

Remove unused exports (AIAssetEntityProvider, AIAssetValidator, DeltaSyncManager,
Neo4jSyncAdapter, SkillBundleMetadata, validateAIAssetEntity) and their
dependencies (@backstage/catalog-model, @backstage/plugin-catalog-node, zod).
The package now exports only annotation constants and normalizeAIAssetVersion.
