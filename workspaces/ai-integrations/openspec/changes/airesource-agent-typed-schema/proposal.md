## Why

Platform engineers need a first-class way to register AI agents in the Software Catalog with validated, discoverable metadata—same pattern as skills and rules. Today `AiResource` supports skill-shaped entities, but there is no typed `spec.type: agent` schema aligned to the OpenAI Agents SDK `AgentConfiguration` core fields. RHIDP-15867 delivers that schema (plus examples/fixtures and OpenSpec updates) so agent entities can be authored and schema-validated in rhdh-plugins without importing the SDK.

## What Changes

- Add a typed agent schema for `kind: AiResource` / `AIResource` with `spec.type: agent`, field-aligned to OpenAI Agents SDK `AgentConfiguration` **core** fields (TypeScript types / JSON schema style; **no** `@openai/agents-core` import).
- Encode the decided spike mapping (RHIDP-15866) in OpenSpec design: SDK `AgentConfiguration` core → AiResource `metadata`/`spec` fields; only agent-specific required field is non-empty `spec.instructions`.
- Add example `catalog-info.yaml` and/or test fixtures covering a representative agent (required + optional fields).
- Update in-repo OpenSpec/design docs for `AiResource` + agent ownership under RHDHPLAN-1507; remove “pending 1113” language for the agent type where it appears.
- Add unit/schema tests that accept valid agent entities and reject clearly invalid shapes at the schema layer.
- Align naming with upstream skill/rule style: singular `spec.type: agent` (not `agents`).

## Capabilities

### New Capabilities

- `ai-resource-agent-schema`: Typed schema, examples/fixtures, and schema-layer validation for `AiResource` entities with `spec.type: agent`, using the spike mapping in `design.md` (SDK-aligned, no SDK dependency).

### Modified Capabilities

_(none — long-lived `openspec/specs/` has no promoted capabilities yet; agent typing is net-new. Related change-local discovery examples that used `spec.type: agents` are corrected via this change’s design/docs, not a delta against a promoted spec.)_

## Impact

- **Schema / types**: New or extended TypeScript (and any colocated JSON schema) for agent-shaped `AiResource` in this workspace; no SDK package dependency.
- **Examples / fixtures**: New catalog YAML under `examples/` (and/or test fixtures) demonstrating agent entities.
- **Tests**: Schema/unit tests for valid and invalid agent shapes.
- **Docs / OpenSpec**: Design and change materials updated for dual-track (rhdh-plugins + upstream) and agent ownership (RHDHPLAN-1507).
- **Out of scope (separate stories)**: Catalog processor validation rules, upstream RFC+PR, agent runtime/SDK orchestration, agent entity detail UI, `rhdh.io/ai-asset-*` mapping updates, migration from interim `Component` + `ai-agent`, feature-level docs/QE.
- **Jira**: RHIDP-15867 (schema story); RHIDP-15866 (spike — DoD is this change’s design mapping + thin schema requirements); RHIDP-15868 / RHIDP-15869 (processor / upstream, OOS); program ownership RHDHPLAN-1507.
