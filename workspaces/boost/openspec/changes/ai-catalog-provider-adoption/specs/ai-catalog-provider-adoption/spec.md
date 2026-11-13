# AI Catalog Provider Adoption

> **Status:** Planning specification. Defines verifiable acceptance
> scenarios for the provider inventory and adoption cohort plan.
> No production code or runtime behavior is specified.

This specification defines the acceptance criteria for RHIDP-18843 as
testable scenarios. The inventory and cohort plan are documentation
artifacts; the scenarios verify completeness and consistency rather than
runtime behavior.

## ADDED Requirements

### Requirement: Provider inventory completeness

The inventory MUST cover all entity providers and source connector
services across both workspaces with evidence from the codebase.

#### Scenario: Boost workspace coverage

- GIVEN the provider inventory document
- WHEN a reviewer checks Boost workspace entity providers
- THEN `OgxModelEntityProvider` is documented with package, class,
  entity kind, mutation mode, and SDK use
- AND `OgxAgentEntityProvider` is documented with the same fields
- AND `ai-catalog-entity-provider-sdk` is documented as a shared
  library with its exports and consumer list

#### Scenario: ai-integrations workspace coverage

- GIVEN the provider inventory document
- WHEN a reviewer checks ai-integrations workspace entity providers
- THEN `ModelCatalogResourceEntityProvider` is documented with package,
  class, entity kind, mutation mode, source service boundary, and SDK
  use (or lack thereof)
- AND `McpRegistryEntityProvider` is documented with pagination
  behavior, last-good retention, and in-memory state limitations
- AND `SkillsCatalogProvider` is documented with delta mutation mode,
  durable persistence (ReconciliationStore), and acknowledgment
  lifecycle

#### Scenario: Source connector coverage

- GIVEN the provider inventory document
- WHEN a reviewer checks source connector services
- THEN `kserve-kubeflow-connector-backend` is documented with its
  consumer relationship to `ModelCatalogResourceEntityProvider`
- AND `skill-image-connector-backend` is documented with its OCI
  discovery and D8 reconcile protocol
- AND `npx-skill-connector-backend` is documented with its consumer
  relationship to `SkillsCatalogProvider`

### Requirement: Cohort classification

The plan MUST separate providers into required-2.2, reference-only, and
deferred/experimental categories.

#### Scenario: Cohort 1 required-2.2

- GIVEN the cohort classification
- WHEN a reviewer checks required-2.2 providers
- THEN OGX model and agent providers are in Cohort 1
- AND `ModelCatalogResourceEntityProvider` is in Cohort 1
- AND `McpRegistryEntityProvider` is in Cohort 1
- AND each entry justifies why it is required for 2.2

#### Scenario: OCI is not a shipping commitment

- GIVEN the cohort classification
- WHEN a reviewer checks deferred/experimental work
- THEN the OCI skill connector pilot is classified as
  deferred/experimental
- AND the plan explicitly states OCI delivery is not a 2.2 shipping
  commitment

### Requirement: Pilot and rollout order

A representative pilot and rollout order MUST be justified with source
limitations having explicit acceptance or follow-up work.

#### Scenario: Validation sequence

- GIVEN the pilot and rollout order
- WHEN a reviewer checks the validation sequence
- THEN the order starts with OGX model smoke test
- AND proceeds to OCI skills pilot
- AND then MCP registry
- AND finishes with all remaining providers
- AND each step cites the source capability being validated

### Requirement: Ownership constraints

Ownership constraints for upstream-tracking providers MUST be documented
before proposing local API changes.

#### Scenario: Upstream dependencies documented

- GIVEN the design document
- WHEN a reviewer checks ownership constraints
- THEN `McpRegistryEntityProvider`'s dependency on
  `catalog-mcp-registry-server-mapping` is documented
- AND `ModelCatalogResourceEntityProvider`'s dependency on
  `@redhat-ai-dev/model-catalog-types` is documented
- AND the constraint that local API changes require approval is stated

### Requirement: No production code

The output MUST NOT include production code, package publication, or
coding stories.

#### Scenario: Documentation-only output

- GIVEN the complete change area
- WHEN a reviewer checks the diff
- THEN no files under `plugins/` or `packages/` are modified
- AND no `package.json` version changes are included
- AND `tasks.md` contains no numbered coding tasks or Jira story
  references for implementation work
