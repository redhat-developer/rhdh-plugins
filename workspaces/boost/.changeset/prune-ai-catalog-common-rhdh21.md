---
'@red-hat-developer-hub/backstage-plugin-ai-catalog-common': major
---

Prune ai-catalog-common to the RHDH 2.1 public surface.

Removed exports:

- `ingestion-health.ts` types (`HealthStatus`, `ErrorType`, `ErrorSummary`, `SyncMetrics`, `ConnectorHealthStatus`, `SyncAttemptRecord`)
- `types.ts` interfaces (`ProviderDescriptor`, `ProviderCapabilities`, `InputItem`, `ConversationSummary`, `ConversationDetails`, `ConversationMessage`, `NormalizedStreamEvent` and variants, `FeedbackRecord`, `LifecycleStage`, `AgentRecord`, `ToolRecord`, `McpTransport`, `McpAuthType`, `McpServerRecord`, `ChatOptions`, `AgenticProvider`, `ApprovalStatus`, `ApprovalRequest`)
- `BOOST_PLUGIN_ID` constant
- All `boost.*` permissions and aggregates (`boostAgentPermissions`, `boostToolPermissions`, `boostEntityPermissions`, `boostFunctionalPermissions`, `boostPermissions`, etc.)
- All `boost-agent` and `boost-tool` resource types and their permission constants
- All conditional rule name constants (`BOOST_RULE_IS_OWNER`, etc.)
- `aiCatalogAdminPermission`, `aiCatalogAssetAccessPermission`, `aiCatalogPermissions`, `aiCatalogResourcePermissions`

Retained exports:

- `AI_CATALOG_ASSET_RESOURCE_TYPE`
- `aiCatalogAssetAccessUsageDocsPermission`
- `AI_ASSET_SPEC_TYPES` (narrowed: removed `resource` entry with `ai-tool` and `vector-store`)
- `isAiAsset`
- `buildAiAssetCatalogFilter`
