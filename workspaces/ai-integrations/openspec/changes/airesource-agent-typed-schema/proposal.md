# Proposal: AiResource Agent Typed Schema

## Why

Platform engineers need a first-class way to register AI agents in the Software Catalog with validated, discoverable metadata—same pattern as skills and rules. Today `AiResource` supports skill-shaped entities, but there is no typed `spec.type: agent` schema (with examples and catalog processor validation) so agent entities can be authored, schema-checked, and safely ingested in rhdh-plugins.

## What Changes

- Add a typed agent schema for `kind: AiResource` with `spec.type: agent` (TypeScript types / schema-style validation; no OpenAI Agents SDK package dependency).
- Encode the decided field mapping (RHIDP-15866) in OpenSpec design; `spec.instructions` is optional (agents may bake in a default prompt).
- Add example `catalog-info.yaml` and/or test fixtures covering a representative agent (required + optional fields).
- Add agent-specific catalog processor validation in the agent backend module (`catalog-backend-module-ai-resource-agent`) via `AiResourceAgentProcessor` (RHIDP-15868): reject missing/invalid agent-specific fields with actionable errors. `AiResourceExtensionsProcessor` remains scope/OCI only.
- Update in-repo OpenSpec/design docs for `AiResource` + agent ownership under RHDHPLAN-1507; remove “pending 1113” language for the agent type where it appears.
- Add unit/schema and processor tests for accept/reject paths.
- Align naming with upstream skill/rule style: singular `spec.type: agent` (not `agents`); correct sibling discovery examples accordingly.

## Capabilities

### New Capabilities

- `ai-resource-agent-schema`: Typed schema, examples/fixtures, and schema-layer validation for `AiResource` entities with `spec.type: agent`, using the field mapping in `design.md`.
- `ai-resource-agent-ingestion`: Catalog processor validation for agent-shaped `AiResource` entities (agent-specific fields only).

### Modified Capabilities

_(none promoted under `openspec/specs/` yet. Sibling change-local discovery examples that used plural `agents`/`skills` are corrected as part of this change.)_

## Non-goals

- Upstream RFC + PR (RHIDP-15869; parallel, not a merge gate)
- Agent runtime / orchestration
- Agent-specific entity detail UI
- `rhdh.io/ai-asset-*` annotation mapping updates
- Migration from interim `Component` + `ai-agent`
- Feature-level docs and QE
- Full `modelSettings` parity beyond the v1 mapping
- Catalog entity-ref format enforcement for `handoffs` / `tools` (deferred)
- Marketing or guaranteeing “OpenAI-compatible” agents (research provenance lives in design only)

## Canonical Touchpoints

- **Jira**: RHIDP-15865 (epic), RHIDP-15866 (spike), RHIDP-15867 (schema), RHIDP-15868 (processor), RHIDP-15869 (upstream, OOS)
- **Program**: RHDHPLAN-1507 (agent type ownership)
- **Foundation**: RHDHPLAN-1113 / `ai-resource-catalog-entity-kind` (AiResource kind; skills/rules)
- **Long-lived specs (`openspec/specs/`)**: None yet

**Change type**: feature-spec

## Impact

- **Schema / types**: New or extended TypeScript for agent-shaped `AiResource` in this workspace.
- **Catalog processor**: Agent-specific validation in the agent backend module (`AiResourceAgentProcessor`), not the extensions processor.
- **Examples / fixtures**: New catalog YAML under `examples/` (and/or test fixtures).
- **Tests**: Schema/unit and processor accept/reject coverage.
- **Docs / OpenSpec**: Dual-track (rhdh-plugins + upstream) and singular type discriminator docs.
