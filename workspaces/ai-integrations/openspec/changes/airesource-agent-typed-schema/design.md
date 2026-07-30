# Design: AiResource Agent Typed Schema

## Canonical Touchpoints

- RHDHPLAN-1507 — AI Asset Entity Model & Ingestion Framework (agent type ownership)
- RHIDP-15865 — Epic: AiResource agent type schema + upstream RFC/PR
- RHIDP-15866 — Spike: confirm agent catalog field set
- RHIDP-15867 — AiResource agent typed schema (examples/fixtures)
- RHIDP-15868 — Catalog processor validation for agent type
- RHIDP-15869 — Upstream RFC + PR (parallel; not a merge gate)
- RHDHPLAN-1113 — AiResource foundation (skills/rules; not agent ownership)

## Context

RHIDP-15867 / RHIDP-15868 add a typed `AiResource` agent schema and catalog processor validation in rhdh-plugins. The AiResource foundation (RHDHPLAN-1113 / workspace change `ai-resource-catalog-entity-kind`) already supports skill-shaped entities (`spec.type: skill`) with RHDH extensions such as `spec.scope` and OCI `source-location` validation. Agent typing was deferred pending a field-mapping spike (RHIDP-15866).

Field choices were informed by runtime/agent-config research (including OpenAI Agents SDK `AgentConfiguration` coverage in Augment). That research is **provenance for the mapping table below**, not a product claim that catalog agents are “OpenAI-compatible.”

This change covers schema + processor validation for agents. Upstream RFC + PR is a parallel track (RHIDP-15869), not a merge gate.

**Stakeholders**: RHDH AI team; platform engineers authoring catalog YAML; dual-track consumers (rhdh-plugins now, upstream Backstage later).

## Goals / Non-Goals

**Goals:**

- Define TypeScript types (and schema tests) for `kind: AiResource` with `spec.type: agent`
- Record the spike field mapping as OpenSpec DoD for RHIDP-15866 + RHIDP-15867
- Provide example YAML / fixtures for a representative agent
- Validate agent-specific fields in the catalog processor (RHIDP-15868)
- Document dual-track approach and clear pending-agent language in OpenSpec/design
- Use singular `spec.type: agent` consistent with `skill` / `rule`

**Non-Goals:**

- Upstream RFC + PR (RHIDP-15869)
- Agent runtime / orchestration / Runner wiring
- Agent-specific entity detail UI
- `rhdh.io/ai-asset-*` annotation mapping updates
- Migration from interim `Component` + `ai-agent`
- Augment-only config fields (`mcpServers`, `asTools`, `enableRAG`, `guardrails`, etc.)
- Full `modelSettings` parity (`parallelToolCalls`, `reasoning`, `truncation`, penalties, prompt-cache, etc.)
- Entity-ref format enforcement for `handoffs` / `tools`
- OpenAI compatibility as a marketed contract

## Decisions

### D1 — Discriminator is singular `spec.type: agent`

**Choice**: Use `spec.type: agent` (singular), matching upstream skill/rule style.

**Alternatives considered**: `agents` (plural) as in an older discovery example — rejected for inconsistency with `skill` / `rule`.

**Rationale**: Story AC and upstream alignment require singular type values for filtering and authorship.

### D2 — No OpenAI Agents SDK package dependency

**Choice**: Implement catalog types and validators in this workspace without importing `@openai/agents-core` (or related Agents SDK packages).

**Rationale**: Catalog model must stay portable for upstream contribution and must not couple to a runtime SDK.

### D3 — Spike mapping: research reference → AiResource (v1)

Standard AiResource fields remain as for other types (`type`, `owner`, `lifecycle`; optional RHDH `scope`; content via `backstage.io/source-location` when applicable).

Agent configuration fields live in **metadata/spec**, not in agent-specific annotations. Cross-cutting `rhdh.io/ai-asset-*` annotations are owned elsewhere (e.g. RHIDP-15258).

The “Research reference” column records where the catalog field was derived from during the spike; it is not a compatibility guarantee.

| Research reference (SDK `AgentConfiguration`) | AiResource                       | Required | Notes                                                                                                                         |
| --------------------------------------------- | -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `name`                                        | `metadata.name`                  | Yes      | No `spec.name`; optional `metadata.title` for display                                                                         |
| `instructions`                                | `spec.instructions`              | Yes      | Non-empty string only (no function form in YAML)                                                                              |
| `handoffDescription`                          | `spec.handoffDescription`        | No       | string                                                                                                                        |
| `model`                                       | `spec.model`                     | No       | string model id                                                                                                               |
| `handoffs`                                    | `spec.handoffs`                  | No       | `string[]`, opaque (no entity-ref format check)                                                                               |
| `tools`                                       | `spec.tools`                     | No       | `string[]`, opaque (no entity-ref format check)                                                                               |
| `toolUseBehavior`                             | `spec.toolUseBehavior`           | No       | `'run_llm_again'` \| `'stop_on_first_tool'` \| `string[]`; function/object callback forms OOS                                 |
| `resetToolChoice`                             | `spec.resetToolChoice`           | No       | boolean                                                                                                                       |
| `modelSettings.temperature`                   | `spec.modelSettings.temperature` | No       | number                                                                                                                        |
| `modelSettings.maxTokens`                     | `spec.modelSettings.maxTokens`   | No       | number                                                                                                                        |
| `modelSettings.toolChoice`                    | `spec.modelSettings.toolChoice`  | No       | string (`auto` / `none` / `required`) or structured object as typed in schema                                                 |
| `outputType`                                  | `spec.outputSchema`              | No       | **Deliberate adaptation**: catalog uses JSON Schema object and/or simple string type name, not a runtime type/class reference |

**Explicitly OOS / follow-up** (not in v1 catalog schema): other `modelSettings` (`parallelToolCalls`, `reasoning`, `truncation`, penalties, prompt-cache, `providerData`, …), prompt objects, guardrail hooks, MCP object graphs, Augment-only keys (`enableRAG`, `asTools`, `publishAs`, …), function-valued `instructions` / `toolUseBehavior`.

**Rationale**: Small, YAML-friendly agent surface for catalog authorship; richer settings and ref-format enforcement deferred.

### D4 — Opaque `handoffs` / `tools` (schema and processor)

**Choice**: Accept `string[]` only. Do not require catalog entity-ref format in RHIDP-15867 or RHIDP-15868.

**Rationale**: Matches “string keys, resolve later” patterns; entity-ref tightening deferred by agreement.

### D5 — Schema + processor in this OpenSpec; agent-only processor rules

**Choice**: Deliver types, examples, schema tests, **and** catalog processor validation for agent-specific fields. Processor does **not** re-validate core entity fields (`owner`, `lifecycle`, etc.) beyond existing catalog behavior.

**Rationale**: Epic cohesion (15867 + 15868 share one field set). Keep processor focused on agent fields.

### D6 — Dual-track documentation (rhdh-plugins + upstream)

**Choice**: Agent typing lands first in rhdh-plugins under RHDHPLAN-1507 ownership, with upstream RFC/PR (RHIDP-15869) in parallel and **not** a merge gate. Remove “pending 1113” / deferred-agent wording for `spec.type: agent`.

**Rationale**: Explicit story DoD; avoids blocking local catalog progress on upstream merge.

### D7 — Examples model a multi-agent handoff shape

**Choice**: Provide at least one example (or fixture set) with a router-style agent (`handoffs` + `handoffDescription` on specialists) using only D3 fields—not Augment-only keys.

**Rationale**: Exercises required `instructions` and optional handoff/`modelSettings` fields in a realistic catalog authoring scenario.

### D8 — Correct plural type examples in sibling discovery OpenSpec

**Choice**: Update `ai-resource-catalog-entity-kind` discovery scenarios from plural `agents` / `skills` to singular `agent` / `skill` as part of this change.

**Rationale**: Removes contradictory guidance against D1.

### D9 — Spike + schema + processor share this OpenSpec

**Choice**: RHIDP-15866 DoD is this design’s mapping table (D3) plus thin schema/ingestion requirements. No separate spike markdown outside OpenSpec is required.

**Rationale**: One source of truth for schema, processor, and later upstream RFC inputs.

### D10 — How to implement the agent schema (follow existing patterns)

**Choice**: Implement `spec.type: agent` the same way upstream models typed AiResource variants and typed API subtypes—do **not** invent a parallel schema style.

**Primary reference — AiResource skill/rule discriminated types** (in `@backstage/catalog-model` alpha / `@backstage/plugin-catalog-backend-module-ai-model`):

- `AiResourceEntityV1alpha1` union: default | `SkillAiResourceEntityV1alpha1` | `RuleAiResourceEntityV1alpha1`
- Per-type validators / guards: `skillAiResourceEntityV1alpha1Validator`, `ruleAiResourceEntityV1alpha1Validator`, `isSkillAiResourceEntity`, `isRuleAiResourceEntity`
- Kind registration via `aiResourceEntityModel` / `catalogModuleAiResourceEntityModel`

Agent should follow that pattern: add an `AgentAiResourceEntity…` (name TBD) member of the AiResource union (or an RHDH-local extension layer that mirrors it until upstream accepts agent), with a `KindValidator` + type guard keyed on `spec.type: 'agent'`.

**Secondary reference — MCP server API discriminated extension** (same catalog-model alpha surface):

- `McpServerApiEntity` with `spec.type: 'mcp-server'`, `mcpServerApiEntityValidator`, `isMcpServerApiEntity`, `mcpServerApiEntityModel`
- Shows how Backstage extends an existing kind with a typed `spec.type` branch (useful precedent for dual-track / upstream PR work)

**Local RHDH extension precedent**: this workspace’s `AIResourceExtensionsProcessor` for `spec.scope` / OCI checks—agent **field** validation (RHIDP-15868) should extend that processor path for agent-specific rules, while the **typed schema** itself follows the catalog-model validator pattern above.

**Rationale**: Without these pointers, implementers (human or coding agent) will invent ad-hoc types that diverge from skill/rule and force manual rework. Gabe’s review feedback on this PR.

## Risks / Trade-offs

| Risk                                                 | Mitigation                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Upstream AiResource agent shape diverges             | Keep fields documented; dual-track notes that upstream may refine names  |
| Authors confuse Augment YAML with catalog schema     | Examples use only D3 fields; design excludes Augment-only keys           |
| `handoffs` / `tools` string semantics underspecified | Opaque by design; entity-ref rules deferred                              |
| `outputSchema` typing too loose or too strict        | Accept object (JSON Schema) or simple string type name; tests cover both |
| Scope creep into UI / annotations / upstream         | Non-goals; 15869 remains parallel OOS                                    |

## Migration Plan

- Additive only: new agent type schema, examples, and processor rules; no migration of existing `Component` / `ai-agent` entities (OOS).
- Rollback: remove agent types/examples/tests/processor rules; skill/rule AiResource paths unchanged.
- No catalog data migration required for this change.

## Open Questions

1. Whether v1 ships only an RHDH-local agent validator/types mirroring upstream skill/rule, or also opens the upstream catalog-model PR in lockstep (RHIDP-15869 remains the formal upstream track either way).
2. UI / annotation-mapping / Component→AiResource migration ownership remain TBC and out of this change.
