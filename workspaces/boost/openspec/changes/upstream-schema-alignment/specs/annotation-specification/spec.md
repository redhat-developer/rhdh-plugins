# Annotation Specification Document

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Epic:** RHIDP-15334 (Upstream Schema Alignment Readiness). **Story:** RHIDP-15346 (Annotation specification document).

## Overview

Formal specification of all RHDH AI Asset annotations and entity kinds, with explicit mapping to draft Backstage RFCs #32062 (McpServer entity kind) and #33060 (ai-model/ai-model-server kinds). Published in a location accessible to platform engineers. Actual migration is explicitly framed as future work.

---

## Scenario: Specification covers all rhdh.io/ai-asset-\* annotations

**GIVEN** the RHDH AI Asset annotation scheme  
**WHEN** the specification document is published  
**THEN** all `rhdh.io/ai-asset-*` annotations are documented:

- `rhdh.io/ai-asset-category` values: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`
- `rhdh.io/ai-asset-version` format and normalization rules
- `rhdh.io/ai-asset-source` format
- Each annotation includes: purpose, valid values, format constraints, examples

---

## Scenario: Specification covers all spec.type values

**GIVEN** the RHDH AI Asset entity type conventions  
**WHEN** the specification document is published  
**THEN** all `spec.type` values for AI Assets are documented:

- `ai-agent` (Component kind)
- `skill` (AIResource kind)
- `mcp-server` (API kind)
- `ai-model` (Resource kind)
- `model-server` (Resource kind)
- Each type includes: entity kind pairing, purpose, examples

---

## Scenario: Mapping to RFC #32062 documented

**GIVEN** draft Backstage RFC #32062 proposes `McpServer` entity kind  
**WHEN** the specification document is published  
**THEN** the mapping from RHDH MCP Server entities to RFC #32062 is documented:

- Current: `kind: API`, `spec.type: mcp-server`
- Target: `kind: McpServer` (RFC #32062)
- Transformation requirements: migrate kind from API → McpServer
- Confidence level: Medium (RFC active but schema may evolve)
- Fields requiring transformation listed explicitly

---

## Scenario: Mapping to RFC #33060 documented

**GIVEN** draft Backstage RFC #33060 proposes `ai-model` and `ai-model-server` entity kinds  
**WHEN** the specification document is published  
**THEN** the mapping from RHDH AI Model and Model Server entities to RFC #33060 is documented:

- **AI Model:** Current `kind: Resource`, `spec.type: ai-model` → Target `kind: ai-model` (RFC #33060)
- **Model Server:** Current `kind: Resource`, `spec.type: ai-model-server` → Target `kind: ai-model-server` (RFC #33060). Note: if the upstream Backstage API extension ([backstage/backstage#34476](https://github.com/backstage/backstage/pull/34476)) becomes available, the Model Server mapping will pivot to that upstream kind.
- Transformation requirements listed per entity type
- Confidence level: Medium (RFC active but schema may evolve)

---

## Scenario: Confidence levels assigned per mapping

**GIVEN** the draft status of upstream RFCs  
**WHEN** the specification document includes entity mappings  
**THEN** each mapping includes a confidence level:

- **High:** RFC schema stable, unlikely to change
- **Medium:** RFC active, schema may evolve
- **Low:** No corresponding RFC yet, or mapping is speculative
- Confidence level rationale documented per mapping

---

## Scenario: Migration explicitly framed as future work

**GIVEN** the specification document maps current entities to draft RFC kinds  
**WHEN** the document is published  
**THEN** a "Future Work" section explicitly states:

- Actual entity migration is future work
- Migration depends on RFC finalization
- The mapping document will update as RFCs evolve
- No production catalog changes are part of this specification

---

## Scenario: Spec accessible to platform engineers

**GIVEN** the annotation specification document is complete  
**WHEN** it is published  
**THEN** it is accessible in a location where platform engineers can find it:

- Published in `workspaces/boost/specifications/` directory
- Follows the same structure as existing Boost specifications
- Includes a last-updated date and draft status header
- Cross-references `ai-catalog-entity-model/design.md` Decision 1 as the authoritative entity mapping source

---

## Scenario: Spec references authoritative entity mapping

**GIVEN** the `ai-catalog-entity-model` change defined the entity mapping table (Decision 1)  
**WHEN** the annotation specification document is written  
**THEN** it cross-references `ai-catalog-entity-model/design.md` Decision 1 as the source of truth for current RHDH AI Asset entity mappings (covers all 7 category values including `skill`, `rule`, `skill-bundle`, and `model-server`)
