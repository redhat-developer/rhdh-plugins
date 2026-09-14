# Boost current status

Release map as of 2026-09-10. After this file exists, treat it as the
workspace map for what is in this release. Implemented frontend behavior
lives in `openspec/specs/`. Active work lives in `openspec/changes/`.
PRDs and Jira analysis are background, not current truth.

## This release

- `plugins/boost` — AI Catalog frontend
- `plugins/ogx-entity-provider`

The `boost-backend` plugin and Kagenti packages are development scaffolding;
they are not released for RHDH 2.1. Browse and entity cards use
`catalogApiRef` only and do not call a Boost backend.

The unreleased backend and the current Usage tab still contain project-specific
permission checks, currently named `ai-catalog.*`. These checks are not the
RHDH 2.1 entity-visibility contract; the current browse experience uses the
Catalog API, and any future backend release must reconcile its selected
permission names with the Catalog `catalog.entity.read` model.

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

The provider now accepts per-provider TLS settings, `caData` and
`skipTLSVerify`, on both supported configuration paths, and the package
declares a `config.d.ts` schema so Backstage validates these keys and enforces
`@visibility secret` on `apiKey`. This shape was patched directly into the
`ogx-entity-provider` spec rather than routed through a new OpenSpec change,
because the `openspec/changes/` content is being reset.

## Open question for the backend team

`boost.providers.ogx` was never released, and the Boost backend is outside the
RHDH 2.1 release. Should the OGX entity provider stop supporting that fallback
and use only `boost.entityProviders.ogx`?

The TLS work extended the fallback rather than retiring it: `caData` and
`skipTLSVerify` are read on both paths, and `config.d.ts` declares the full
schema for both. That raises the cost of removal — the fallback code, its
tests, the declared schema, and the OGX spec would all have to be updated
together.

## Active remaining frontend work (`openspec/changes/`)

| Change                             | Status              |
| ---------------------------------- | ------------------- |
| `ai-catalog-frontend-translations` | 1/11 — locale files |

Playwright coverage from PR #4501 is implemented. Its test-infrastructure
change is archived without adding a product-behavior spec.

## RBAC follow-on work

The `ai-catalog-asset-governance` proposal, design, behavioral specs, and tasks
now describe the follow-on RBAC model built on the current Catalog and OGX
baseline. The model uses built-in `catalog.entity.read`, RHDH conditional
policies, API-level field redaction where required, and the existing RBAC audit
and administration surfaces. This is not part of the RHDH 2.1 release.

## Status of the remaining OpenSpecs

The child specs under these changes are planning material. They do not expand
the current release unless this table says so. A child spec marked
consolidated or moved keeps that disposition even when its parent change is
listed below.

| Change                               | Status and scope                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `ai-catalog-entity-model`            | Follow-on entity-model and SDK planning; the archived `ogx-entity-provider` spec remains the current OGX release source of truth. |
| `agent-creation-discovery`           | Follow-on agent, MCP, and catalog-entity capabilities; not current-release behavior.                                              |
| `ai-chat-interaction-experience`     | Follow-on chat and interaction capabilities; not current-release behavior.                                                        |
| `pluggable-ai-platform-architecture` | Follow-on provider/backend architecture; not current-release behavior.                                                            |
| `platform-operations-deployment`     | Follow-on backend, configuration, deployment, and administration work; not current-release behavior.                              |
| `security-safety-governance`         | Follow-on backend security and authorization work; not current-release behavior.                                                  |
| `connector-shared-infrastructure`    | Follow-on shared connector infrastructure; not current-release behavior.                                                          |
| `connector-config-hot-reload`        | Follow-on connector administration and backend configuration work; not current-release behavior.                                  |
| `ingestion-audit-metrics`            | Consolidated/follow-on ingestion and analytics work; not current-release behavior.                                                |
| `ingestion-health-dashboard`         | Follow-on backend/admin health dashboard work; not current-release behavior.                                                      |
| `neo4j-knowledge-graph`              | Follow-on graph synchronization work; not current-release behavior.                                                               |
| `oci-skill-connector`                | Follow-on OCI connector implementation; not current-release behavior.                                                             |
| `oci-skill-registry`                 | Follow-on OCI registry ingestion framework; not current-release behavior.                                                         |
| `mcp-registry-connector`             | Follow-on MCP Registry productization; not current-release behavior.                                                              |
| `rhoai-connector`                    | Follow-on RHOAI MCP connector; not current-release behavior.                                                                      |
| `upstream-schema-alignment`          | Follow-on upstream-kind alignment and migration-readiness work; not current-release behavior.                                     |

RBAC governance is tracked separately in `ai-catalog-asset-governance` as
follow-on design work. Its examples build on the current Catalog/OGX model but
do not add RBAC behavior to this release.

## Cleanup progress

Done: inventory; archive implemented frontend, OGX, and E2E work; classify the
remaining OpenSpecs; and align workspace documentation with the current code.

Remaining current-release OpenSpec work: frontend translations.
