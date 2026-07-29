## Context

RHIDP-15867 adds a typed `AiResource` agent schema in rhdh-plugins. The AiResource foundation (RHDHPLAN-1113 / workspace change `ai-resource-catalog-entity-kind`) already supports skill-shaped entities (`spec.type: skill`) with RHDH extensions such as `spec.scope` and OCI `source-location` validation. Agent typing was deferred pending a field-mapping spike (RHIDP-15866).

Spike research mapped OpenAI Agents SDK `AgentConfiguration` → Augment runtime config → Responses API. RHIDP-15866 and this change share one deliverable: the **decided catalog field mapping** below (in this design) plus thin schema requirements in `specs/ai-resource-agent-schema/spec.md`. Ownership of the agent type under program planning is RHDHPLAN-1507.

This change encodes the **catalog entity schema** for agents—not Augment runtime config and not catalog processor enforcement (RHIDP-15868). Upstream RFC + PR is a parallel track (RHIDP-15869), not a merge gate.

**Stakeholders**: RHDH AI team; platform engineers authoring catalog YAML; dual-track consumers (rhdh-plugins now, upstream Backstage later).

## Goals / Non-Goals

**Goals:**

- Define TypeScript types (and schema tests) for `kind: AiResource` with `spec.type: agent`
- Align agent fields to OpenAI Agents SDK `AgentConfiguration` **core** fields without importing the SDK
- Record the spike mapping (SDK → AiResource spec/metadata / OOS) as OpenSpec DoD for RHIDP-15866 + RHIDP-15867
- Provide example YAML / fixtures for a representative agent
- Document dual-track approach and clear pending-agent language in OpenSpec/design
- Use singular `spec.type: agent` consistent with `skill` / `rule`

**Non-Goals:**

- Catalog processor validation rules (RHIDP-15868)
- Upstream RFC + PR (RHIDP-15869)
- Agent runtime / SDK orchestration / Runner wiring
- Agent-specific entity detail UI
- `rhdh.io/ai-asset-*` annotation mapping updates
- Migration from interim `Component` + `ai-agent`
- Augment-only config fields (`mcpServers`, `asTools`, `enableRAG`, `guardrails`, etc.)
- Full `modelSettings` parity (`parallelToolCalls`, `reasoning`, `truncation`, penalties, prompt-cache, etc.)

## Decisions

### D1 — Discriminator is singular `spec.type: agent`

**Choice**: Use `spec.type: agent` (singular), matching upstream skill/rule style.

**Alternatives considered**: `agents` (plural) as in an older discovery example — rejected for inconsistency with `skill` / `rule`.

**Rationale**: Story AC and upstream alignment require singular type values for filtering and authorship.

### D2 — Field-align to SDK core; no SDK package dependency

**Choice**: Mirror OpenAI Agents SDK `AgentConfiguration` / `ModelSettings` names and shapes in our TypeScript interfaces (and any JSON-schema-like validators used in tests). Do **not** add `@openai/agents-core` as a dependency.

**Rationale**: Story explicitly forbids SDK import; catalog schema must stay portable for upstream contribution and avoid coupling to Augment’s runtime adapter stack.

### D3 — Spike mapping: SDK → AiResource (v1)

Standard AiResource fields remain as for other types (`type`, `owner`, `lifecycle`; optional RHDH `scope`; content via `backstage.io/source-location` when applicable).

Agent configuration fields live in **metadata/spec**, not in agent-specific annotations. Cross-cutting `rhdh.io/ai-asset-*` annotations are owned elsewhere (e.g. RHIDP-15258).

| SDK `AgentConfiguration`    | AiResource                       | Required | Notes                                                                        |
| --------------------------- | -------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `name`                      | `metadata.name`                  | Yes      | No `spec.name`; optional `metadata.title` for display                        |
| `instructions`              | `spec.instructions`              | Yes      | Non-empty string only (no function form in YAML)                             |
| `handoffDescription`        | `spec.handoffDescription`        | No       | string                                                                       |
| `model`                     | `spec.model`                     | No       | string model id                                                              |
| `handoffs`                  | `spec.handoffs`                  | No       | `string[]`, opaque at schema layer                                           |
| `tools`                     | `spec.tools`                     | No       | `string[]`, opaque at schema layer                                           |
| `toolUseBehavior`           | `spec.toolUseBehavior`           | No       | `'run_llm_again'` \| `'stop_on_first_tool'` \| `string[]`; function form OOS |
| `resetToolChoice`           | `spec.resetToolChoice`           | No       | boolean                                                                      |
| `modelSettings.temperature` | `spec.modelSettings.temperature` | No       |                                                                              |
| `modelSettings.maxTokens`   | `spec.modelSettings.maxTokens`   | No       |                                                                              |
| `modelSettings.toolChoice`  | `spec.modelSettings.toolChoice`  | No       |                                                                              |
| `outputType`                | `spec.outputSchema`              | No       | JSON Schema object and/or simple string type name                            |

**Explicitly OOS / follow-up** (not in v1 catalog schema): other `modelSettings` (`parallelToolCalls`, `reasoning`, `truncation`, penalties, prompt-cache, `providerData`, …), SDK `prompt` object, SDK guardrail hooks, MCP object graphs, Augment-only keys (`enableRAG`, `asTools`, `publishAs`, …), function-valued `instructions` / `toolUseBehavior`.

**Rationale**: Core SDK-aligned surface that runtime adapters already cover; keeps catalog authoring light; richer settings and ref-format enforcement deferred.

### D4 — Opaque `handoffs` / `tools` until processor story

**Choice**: Schema accepts `string[]` only. Do not require catalog entity-ref format in RHIDP-15867.

**Rationale**: Matches “string keys, resolve later” runtime patterns. RHIDP-15868 may tighten formats and relations.

### D5 — Schema layer in rhdh-plugins, not processor rules in this story

**Choice**: Deliver types, example YAML, fixtures, and schema/unit tests. Do not expand `AIResourceExtensionsProcessor` with agent-field rules here.

**Rationale**: Separates “schema + examples” DoD from ingestion validation (RHIDP-15868).

### D6 — Dual-track documentation (rhdh-plugins + upstream)

**Choice**: Agent typing lands first in rhdh-plugins under RHDHPLAN-1507 ownership, with upstream RFC/PR (RHIDP-15869) in parallel and **not** a merge gate. Remove “pending 1113” / deferred-agent wording for `spec.type: agent`.

**Rationale**: Explicit story DoD; avoids blocking local catalog progress on upstream merge.

### D7 — Examples model a multi-agent handoff shape

**Choice**: Provide at least one example (or fixture set) with a router-style agent (`handoffs` + `handoffDescription` on specialists) using only D3 fields—not Augment-only keys.

**Rationale**: Exercises required `instructions` and optional handoff/`modelSettings` fields in a realistic catalog authoring scenario.

### D8 — Correct plural `agents` filter examples in related docs

**Choice**: Where change-local or README examples filter on `spec.type=agents`, update to `agent` when touched by this work.

**Rationale**: Prevents discovery/doc drift against the singular discriminator (D1).

### D9 — Spike + schema share this OpenSpec

**Choice**: RHIDP-15866 DoD is this design’s mapping table (D3) plus the thin requirements in `specs/ai-resource-agent-schema/spec.md`, linked from a Jira comment on the spike. No separate spike markdown outside OpenSpec is required.

**Rationale**: One source of truth for schema story and upstream RFC inputs.

## Risks / Trade-offs

| Risk                                                 | Mitigation                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Upstream AiResource agent shape diverges             | Keep fields SDK-core and documented; dual-track notes that upstream may refine names                   |
| Authors confuse Augment YAML with catalog schema     | Examples use only D3 fields; design explicitly excludes Augment-only keys                              |
| `handoffs` / `tools` string semantics underspecified | Opaque at schema layer; processor story (RHIDP-15868) may tighten                                      |
| `outputSchema` typing too loose or too strict        | Accept object (JSON Schema) or simple string type name; tests cover both valid forms and clear rejects |
| Scope creep into processor / UI / annotations        | Non-goals + story OOS list; keep tasks schema-focused                                                  |

## Migration Plan

- Additive only: new agent type schema and examples; no migration of existing `Component` / `ai-agent` entities (OOS).
- Rollback: remove agent types/examples/tests; skill/rule AiResource paths unchanged.
- No catalog data migration required for this story.

## Open Questions

1. Exact package home for agent types (e.g. shared common package vs catalog module)—resolve during implementation by following where skill/rule entity types already live (or introduce a small shared types module if none exist).
2. UI / annotation-mapping / Component→AiResource migration ownership remain TBC and out of this change.
