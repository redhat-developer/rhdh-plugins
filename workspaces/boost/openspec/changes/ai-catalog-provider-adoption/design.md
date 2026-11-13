# Design: AI Catalog Provider Adoption

> **Scope:** Planning-only. This document records design decisions for
> provider adoption cohorts and pilot order. No production code or
> runtime migration decisions are included. Shared contracts belong to
> RHIDP-18844 through RHIDP-18848.

## Context

The AI Catalog ingests entities from five distinct entity providers
across two workspaces (Boost and ai-integrations), backed by three
source connector services. Each provider was built independently with
different SDK usage, mutation strategies, and persistence models.

The `ai-catalog-entity-provider-sdk` (Boost workspace, v2.0.0) provides
shared annotation constants, version normalization, validation, and a
delta sync framework. Currently only the OGX providers consume it. The
ai-integrations providers use workspace-local libraries and Backstage
primitives directly.

Provider adoption must be sequenced to minimize risk and validate the
SDK contract against real providers before committing the full 2.2
scope.

### Baseline evidence

All evidence is from revision `8af3d2f` unless noted. See
[provider-inventory.md](./provider-inventory.md) for the complete
inventory with source file paths, mutation modes, and persistence
behavior.

## Goals

- Verified inventory of all entity providers and source connectors with
  implementation evidence
- Clear separation of required-2.2, reference-only, and
  deferred/experimental work
- Justified pilot and rollout order based on provider complexity
- Documented ownership constraints for upstream-tracking providers
- Output that feeds provider-specific OpenSpecs (RHIDP-18849,
  RHIDP-18850) without creating coding stories

## Non-Goals

- Production code changes
- Runtime provider migration
- Package publication or version bumps
- Creating numbered coding tasks or Jira stories
- Shared contract definitions (RHIDP-18839, RHIDP-18840)

## Decisions

### Decision 1: Three-cohort classification

Providers are classified into three cohorts based on source capability
maturity and 2.2 release requirements.

**Cohort 1 — Required 2.2:** OGX model, OGX agent,
ModelCatalogResourceEntityProvider, McpRegistryEntityProvider. These
providers have verified source capabilities, are in active use, and
must adopt the shared SDK annotations for 2.2.

**Cohort 2 — Reference-only:** NPX skill connector. Serves as a
reference implementation for connector-to-provider integration patterns.
No entity provider migration required.

**Cohort 3 — Deferred/experimental:** OCI skill connector (pilot, not
a shipping commitment), SkillsCatalogProvider (complex delta/store
architecture). Full adoption requires reconciling the durable
ReconciliationStore with the SDK's cursor model.

**Why:** Grouping by complexity and source maturity minimizes the risk
of blocking 2.2 on experimental capabilities. OCI delivery remains
experimental and must not become a shipping commitment through this
plan.

### Decision 2: Pilot validation order

The validation order is: OGX model smoke → OCI skills pilot → MCP
registry → all remaining providers.

**Why:** OGX model is the simplest provider (single entity, stateless,
full mutation, already uses the SDK). It validates the annotation
contract with minimal risk. OCI skills pilot exercises the
connector-to-provider boundary without committing to shipping. MCP
registry validates pagination and last-good retention patterns. This
progression moves from simple to complex.

**Alternative considered:** Starting with MCP registry or
ModelCatalogResourceEntityProvider. Rejected because they do not use the
SDK yet — validating SDK adoption on a provider that already consumes it
produces faster feedback.

### Decision 3: OCI pilot is not a shipping commitment

The OCI skills pilot is included in the validation order to exercise the
connector-to-provider integration path. It validates that OCI discovery
pages internally and that the skills provider consumes one bounded
snapshot. However, this pilot does not commit OCI delivery to the 2.2
release.

**Why:** OCI discovery paging is internal to the connector. The D8
reconcile/acknowledgment protocol adds complexity (catalog visibility
verification, superseded revision handling). Committing this as a 2.2
deliverable without fully verifying the acknowledgment lifecycle would
risk a late-cycle regression.

### Decision 4: SDK adoption scope

Cohort 1 providers that do not yet use `ai-catalog-entity-provider-sdk`
must adopt the shared annotation constants (`AI_ASSET_CATEGORY_ANNOTATION`,
`AI_ASSET_SOURCE_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`) and version
normalization. Delta sync framework adoption is optional for providers
using full mutations.

**Why:** Annotation consistency is the minimum contract for the AI
Catalog browse UI to classify entities. Delta sync is orthogonal to
annotation adoption and should not gate Cohort 1 providers that use full
mutations.

**Unresolved:** Whether `ModelCatalogResourceEntityProvider` should
adopt the SDK annotations or continue using the `@redhat-ai-dev/model-catalog-types`
contract. This depends on RHIDP-18839 (metadata/SDK contracts).

### Decision 5: Ownership constraints

Upstream-tracking providers (McpRegistryEntityProvider uses
`catalog-mcp-registry-server-mapping`; ModelCatalogResourceEntityProvider
uses `@redhat-ai-dev/model-catalog-types`) have external ownership
constraints. Local API changes to these providers must be documented and
approved before proposing modifications to the entity construction path.

**Why:** Changing how entities are constructed in upstream-tracking
providers risks breaking the annotation projection contract or the
bridge format. The inventory documents the current source boundary for
each provider so that follow-up work can assess impact accurately.

### Decision 6: KServe supports its consumer

The KServe/Kubeflow connector is a source service, not an entity
provider. It does not require independent adoption work. Its role is to
supply the bridge API that `ModelCatalogResourceEntityProvider` consumes.
Migration work for the model-catalog provider (RHIDP-18850)
automatically covers the KServe connector's integration surface.

**Why:** The connector and provider are tightly coupled via Backstage
discovery. Changes to the provider's SDK adoption may require
adjustments to the bridge format, but these are scoped to the provider
migration story, not a separate connector story.
