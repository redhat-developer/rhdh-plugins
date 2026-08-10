# Annotation Specification Document

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Epic:** RHIDP-15334 (Upstream Schema Alignment Readiness). **Story:** RHIDP-15346 (Annotation specification document).

## Overview

Formal specification of all RHDH AI Asset annotations and entity kinds, with explicit mapping to upstream Backstage entity kind targets. Covers all seven AI-asset categories per [ai-catalog-entity-model/design.md Decision 1](../../design.md). MCP servers are kind-aligned with upstream (`McpServerApiEntity`, [backstage#34016](https://github.com/backstage/backstage/pull/34016)); remaining categories have varying upstream readiness. Published in a location accessible to platform engineers. Actual migration is explicitly framed as future work.

---

## Scenario: Specification covers all rhdh.io/ai-asset-\* annotations

**GIVEN** the RHDH AI Asset annotation scheme  
**WHEN** the specification document is published  
**THEN** all `rhdh.io/ai-asset-*` annotations are documented:

- `rhdh.io/ai-asset-category` values: `agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`, `model-server`
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
- `rule` (AIResource kind)
- `ai-skill-bundle` (AIResource kind)
- `mcp-server` (API kind)
- `ai-model` (Resource kind)
- `ai-model-server` (Resource kind)
- Each type includes: entity kind pairing, purpose, examples

---

## Scenario: MCP server mapping documented (kind-aligned)

**GIVEN** upstream Backstage shipped `McpServerApiEntity` via [backstage#34016](https://github.com/backstage/backstage/pull/34016) (RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3)  
**WHEN** the specification document is published  
**THEN** the mapping from RHDH MCP Server entities is documented:

- Current: `kind: API`, `spec.type: mcp-server`
- Target: Same — `kind: API`, `spec.type: mcp-server` (`McpServerApiEntity`). **No kind rename.**
- Confidence level: High (kind already aligned, upstream shipped)
- Remaining work: field/module gaps — adopt `spec.remotes` instead of `spec.definition`, opt in to `@backstage/plugin-catalog-backend-module-ai-model`
- Flag fallback `Resource` entities that need migration to `API` kind

---

## Scenario: Model server mapping documented (candidate)

**GIVEN** an open upstream PR [backstage#34476](https://github.com/backstage/backstage/pull/34476) proposes `kind: API`, `spec.type: ai-model-server`  
**WHEN** the specification document is published  
**THEN** the mapping from RHDH Model Server entities is documented:

- **Model Server:** Current `kind: Resource`, `spec.type: ai-model-server` → Candidate target `kind: API`, `spec.type: ai-model-server`. **Not** a new kind named `ai-model-server`.
- Confidence level: Medium/Low (open PR, hedge accordingly)
- Transformation: `Resource` → `API` kind change + field mapping

---

## Scenario: AI model mapping documented (no upstream kind)

**GIVEN** no solid upstream kind exists for AI models  
**WHEN** the specification document is published  
**THEN** the mapping documents explicit uncertainty:

- **AI Model:** Current `kind: Resource`, `spec.type: ai-model` → No solid upstream kind yet
- Confidence level: Low
- Recommendation: Continue using current mapping until upstream stabilizes

---

## Scenario: Skill and rule mapping documented (upstream shipped)

**GIVEN** upstream Backstage shipped `AiResource` kind (see [#33575](https://github.com/backstage/backstage/issues/33575) lineage)  
**WHEN** the specification document is published  
**THEN** the mapping from RHDH Skill and Rule entities is documented:

- **Skill:** Current `kind: AIResource`, `spec.type: skill` → `AiResource` (shipped upstream)
- **Rule:** Current `kind: AIResource`, `spec.type: rule` → `AiResource` (shipped upstream)
- Confidence level: Medium–High (kind shipped, field alignment work remains)
- Transformation: kind/name casing alignment (`AIResource` → `AiResource`) + field alignment

---

## Scenario: Skill bundle and agent mappings documented

**GIVEN** no upstream kinds exist for skill bundles or agents  
**WHEN** the specification document is published  
**THEN** the mappings document explicit uncertainty:

- **Skill Bundle:** Current `kind: AIResource`, `spec.type: ai-skill-bundle` → No upstream kind. Confidence: Low. Stay on current mapping; track future RFCs.
- **Agent:** Current `kind: Component`, `spec.type: ai-agent` → No upstream kind via RFC #32062 (that RFC is MCP-only). Confidence: Low. Track agent-kind ownership under RHDHPLAN-1113.

---

## Scenario: Confidence levels assigned per mapping

**GIVEN** the draft status of upstream RFCs  
**WHEN** the specification document includes entity mappings  
**THEN** each mapping includes a confidence level:

- **High:** Upstream kind shipped and stable, kind already aligned (e.g., MCP server)
- **Medium–High:** Upstream kind shipped, field/name alignment work remains (e.g., skills, rules)
- **Medium/Low:** Upstream target proposed in an open PR, hedge accordingly (e.g., model server)
- **Low:** No solid upstream kind yet, or mapping is speculative (e.g., AI model, agent, skill bundle)
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
