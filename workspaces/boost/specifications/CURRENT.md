# Boost current status

Release map as of 2026-09-07. After this file exists, treat it as the
workspace map for what is in this release. Implemented frontend behavior
lives in `openspec/specs/`. Active work lives in `openspec/changes/`.
PRDs and Jira analysis are background, not current truth.

## This release

- `plugins/boost` — AI Catalog frontend
- `plugins/ogx-entity-provider`

The `boost-backend` plugin and Kagenti packages are development scaffolding;
they are not released for RHDH 2.1. Browse and entity cards use
`catalogApiRef` only and do not call a Boost backend.

The two release packages currently require supporting packages:
`boost-common` for the frontend taxonomy and permissions, and
`boost-entity-provider-sdk` for OGX entity annotations and version
normalization. These are support dependencies, not additional Boost release
features.

## Implemented frontend (`openspec/specs/`)

Archived from `ai-catalog-frontend` (snapshot:
`openspec/changes/archive/2026-09-07-ai-catalog-frontend/`).

| Spec ID                           | What                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `ai-catalog-browse-view`          | `/ai-catalog` card/table, search, pagination                 |
| `ai-catalog-filter-customization` | NFS `AiCatalogFilterBlueprint` (type, provider, owner, tags) |
| `ai-catalog-entity-extensions`    | Summary, Adoption, Version cards; Usage tab                  |
| `ai-catalog-dynamic-plugin`       | Overlay export in `rhdh-plugin-export-overlays`              |

On `main` today: Usage tab is a Boost entity-content tab (it may link to
TechDocs; it is not the Catalog TechDocs tab). There is no Boost API client
and no catalog download proxy.

## OGX provider status

The OGX model and agent entity providers are implemented and tested. Their
current behavior is captured in the focused `ogx-entity-provider` spec archived
under `openspec/specs/`. The broader `ai-catalog-entity-model` change remains
active and deferred; it is not the release behavior source of truth.

## Open question for the backend team

`boost.providers.ogx` was never released, and the Boost backend is outside the
RHDH 2.1 release. Should the OGX entity provider stop supporting that fallback
and use only `boost.entityProviders.ogx`? If yes, the fallback code, tests, and
the archived OGX spec should be updated together.

## Active remaining frontend work (`openspec/changes/`)

| Change                             | Status                 |
| ---------------------------------- | ---------------------- |
| `ai-catalog-frontend-translations` | 1/11 — locale files    |
| `ai-catalog-frontend-e2e`          | 0/7 — Playwright suite |

## Other OpenSpecs

Keep active. Not reviewed yet. Not this catalog-frontend cleanup.

- `ai-catalog-entity-model`
- `ai-catalog-asset-governance`
- `agent-creation-discovery`
- `ai-chat-interaction-experience`
- `pluggable-ai-platform-architecture`
- `platform-operations-deployment`
- `security-safety-governance`
- `connector-shared-infrastructure`
- `connector-config-hot-reload`
- `ingestion-audit-metrics`
- `ingestion-health-dashboard`
- `neo4j-knowledge-graph`
- `oci-skill-connector`
- `oci-skill-registry`
- `mcp-registry-connector`
- `rhoai-connector`
- `upstream-schema-alignment`

## Cleanup progress

Done: inventory; split translations and e2e; archive implemented catalog
frontend; prefix implemented spec IDs with `ai-catalog-*`.

Not done: review the other OpenSpecs; plugin README / AGENTS.md pointers; docs
PR.

Part 2 (later): implement translations and e2e, then archive each.
OGX code stays a separate track.
