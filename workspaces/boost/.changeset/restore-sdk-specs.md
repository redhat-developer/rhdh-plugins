---
'@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk': minor
---

Restore AI Catalog SDK source files, tests, and specification documents from the RHDH 2.1 archive into their active package paths for RHDH 2.2 reconciliation. Add public provider interfaces, the `AIAssetValidator` processor, `DeltaSyncManager` and cursor-store contracts, `validateAIAssetEntity`, `AIAssetCategory`, and `AI_ASSET_CATEGORIES`. Keep the Zod category schema internal and preserve the validator's processor methods in generated declarations. Restored helpers remain unregistered pending reconciliation.

Escape control characters in rejected category diagnostics without changing the
input used for validation.
