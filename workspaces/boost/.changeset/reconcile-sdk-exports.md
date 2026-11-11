---
'@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk': minor
---

Reconcile SDK exports and category vocabulary to the agreed 2.2 minimum baseline. Remove `skill-bundle` from the Zod schema, `AIAssetCategory` type union, `AI_ASSET_CATEGORIES`, validation diagnostics, tests, README, and API report. The active category vocabulary is now `agent`, `skill`, `rule`, `mcp-server`, `ai-model`, and `model-server`. Replace obsolete Kagenti provider examples with current OGX references. Update entity fixtures to use `kind: AiResource` with `spec.type: agent`. Clarify delta sync JSDoc: consuming providers own durable persistence and cursor clearing does not initiate a full refresh.
