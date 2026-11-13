# Proposal: AI Catalog Provider Adoption and Migration

> **Workspace:** Boost (planning artifact). This change area inventories
> providers across Boost and ai-integrations and defines the RHDHPLAN-1507
> adoption cohorts and pilot order. No production code, package publication,
> or coding stories are included.

## Why

Both the Boost and ai-integrations workspaces contain entity providers
and backend source services that ingest AI assets into the Backstage
catalog. The OCI skill-image connector service and the skills catalog
entity provider have different responsibilities, and the OGX providers
serve a different source entirely. Before the 2.2 release can commit to
a migration scope, the team needs a verified inventory of what each
provider does, which SDK it uses, how it persists state, and what
source-side guarantees it relies on.

Without this inventory, adoption scope risks being driven by assumptions
rather than actual source capabilities. Existing experimental OCI
delivery must not become a 2.2 commitment through this plan.

## What Changes

This change area produces planning artifacts only:

- **Provider inventory** — documents every entity provider and source
  connector across both workspaces with verified evidence from the
  codebase at revision `8af3d2f`.
- **Adoption cohorts** — groups providers into required-2.2,
  reference-only, and deferred/experimental categories.
- **Pilot and rollout order** — justifies a representative pilot
  starting with OGX model smoke testing and defines the validation
  sequence.
- **Acceptance checklist** — verifiable criteria for planning
  completeness.

## Cohort classification

### Required 2.2 migrations (Cohort 1)

These providers have verified source capabilities and are on the 2.2
critical path:

1. **OGX model provider** (`OgxModelEntityProvider`) — smoke test pilot.
   Simple stateless provider with a single entity, full mutation, and
   direct API polling. Uses the entity-provider-sdk annotations.
2. **OGX agent provider** (`OgxAgentEntityProvider`) — config-driven,
   stateless, full mutation. Shares the same module registration.
3. **ModelCatalogResourceEntityProvider** — full mutation, stateless.
   Consumes KServe connector bridge. Does not use the shared SDK yet.
4. **McpRegistryEntityProvider** — full mutation with cursor-based
   pagination and in-memory last-good retention. Complex but
   production-ready pagination logic.

### Reference-only (Cohort 2)

5. **NPX skill connector** (`npx-skill-connector-backend`) — source
   connector service consumed by SkillsCatalogProvider. Reference-only
   for adoption planning; no entity provider migration required.

### Deferred/experimental (Cohort 3)

6. **OCI skill connector** (`skill-image-connector-backend`) — pilot
   for OCI discovery is included in validation order but is not a 2.2
   shipping commitment. The connector's D8 reconcile protocol is
   experimental.
7. **SkillsCatalogProvider** — delta mutations with durable
   ReconciliationStore. The most complex provider. Full adoption
   requires reconciling its store-backed delta approach with the SDK's
   `InMemoryCursorStore`.

### Source connector services (not providers)

KServe/Kubeflow connector supports its consumer
(`ModelCatalogResourceEntityProvider`) and does not require independent
adoption work. OCI and NPX connectors are classified above by their
consumer's cohort.

## Validation order

1. OGX model smoke test (simplest provider, one entity, full mutation)
2. OCI skills pilot (exercises connector-to-provider boundary)
3. MCP Registry (exercises pagination and last-good retention)
4. All remaining providers across both workspaces

## Non-goals

- Production code changes or runtime provider migration
- Package publication
- Creating coding stories or Jira tasks for implementation
- Shared contracts (deferred to RHIDP-18844 through RHIDP-18848)

## Impact

- **Jira:** RHIDP-18843 (this story), blocking RHIDP-18849 (OGX) and
  RHIDP-18850 (ai-integrations)
- **Workspaces:** Boost, ai-integrations
- **Dependencies:** Final adoption criteria consume RHIDP-18839
  (metadata/SDK contracts) and RHIDP-18840 (incremental ingestion
  contracts)
