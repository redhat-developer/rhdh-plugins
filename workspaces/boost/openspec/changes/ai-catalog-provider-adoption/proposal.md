## Why

[RHIDP-18843](https://redhat.atlassian.net/browse/RHIDP-18843), under
[RHIDP-18841](https://redhat.atlassian.net/browse/RHIDP-18841), needs a verified
inventory, adoption cohorts, and pilot for RHDHPLAN-1507.
Current providers differ in source protocols, entity identity, catalog mutation
mode, and recovery state; backend source services must not be mistaken for
catalog entity providers.

## What Changes

- Record current provider registration, configuration, identity, metadata,
  source capabilities, mutations, persistence, and ownership with implementation
  evidence in [provider-inventory.md](provider-inventory.md).
- Separate observed client behavior from source capabilities that still require
  upstream contract verification or deployment evidence. Q3 accepts the stated
  inventory limits; later profiles must verify relied-on guarantees or define
  accepted safe limitations before acceptance.
- Record the maintainer-selected adoption cohort: OGX model/agent, model-catalog,
  and MCP-registry, with skills outside the initial 2.2 shipping cohort and
  KServe retained as a supporting source service. The selected validation order is **OGX model smoke → OCI skills pilot →
  MCP-registry validation later**. OCI remains outside the 2.2 shipping cohort.
  Final designs depend on the shared contracts; this inventory does not deliver
  provider migration.
- Establish **eventual adoption and conformance coverage for every catalog entity
  provider across Boost and ai-integrations**, including the skills provider.
  The pilot sequence is the starting order, not a permanent subset; coverage and
  product shipping commitments are separate decisions.
- Feed the accepted inventory into RHIDP-18849 and RHIDP-18850. Those stories
  specify concrete adoption after the metadata/SDK and incremental-ingestion
  contracts from RHIDP-18839 and RHIDP-18840 are accepted.

This inventory-stage change is being authored incrementally. The
[design](design.md) records the accepted cohort and pilot selection;
the [behavioral specification](specs/ai-catalog-provider-adoption/spec.md)
defines planning acceptance. The [acceptance checklist](acceptance-checklist.md)
tracks planning verification and handoff; [tasks](tasks.md) is reserved for later
code, associated tests, and code documentation, with no implementation tasks
defined yet. File presence does not establish implementation readiness.

## Capabilities

### New Capabilities

- `ai-catalog-provider-adoption`: An evidence-backed provider inventory, explicit
  cohort/pilot decisions, and inputs to later provider adoption specifications.
  The initial stage defines planning acceptance, not new runtime behavior.

### Modified Capabilities

None in this initial inventory stage. Later adoption work must explicitly name
any implemented capability whose behavior it proposes to change.

## Canonical Touchpoints

Change type: **docs-only** planning.

- Product PRDs under `specifications/prd/`: **None** modified. The current
  [RHDHPLAN-1507](https://redhat.atlassian.net/browse/RHDHPLAN-1507) issue and
  RHIDP-18843 define this story's scope.
- ADRs under `specifications/adr/`: **None** modified. No shared-SDK or ingestion
  architecture decision is made here; cohort/pilot planning is change-local.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md) remains
  the Boost release behavior reference; inventory observations do not replace
  it with a future adoption contract.

## Non-goals

No production code, runtime migration, SDK API design, annotation naming,
incremental-ingestion engine, package publication, or coding Jira stories.
Experimental OCI/NPX skills work is an input, not an automatic RHDH 2.2
commitment. No registry product selection, Neo4j/SkillBundle contract, or
abandoned provider restoration is introduced.

## Impact

Planning references cover Boost OGX providers and ai-integrations model-catalog,
MCP-registry, and skills-catalog providers, together with their source-service
boundaries. Runtime packages, dependencies, dynamic-plugin wiring, and existing
entity identities remain unchanged. This work does not expand the RHDH 2.1
release boundary or duplicate the completed RHIDP-18759 baseline reconciliation.
