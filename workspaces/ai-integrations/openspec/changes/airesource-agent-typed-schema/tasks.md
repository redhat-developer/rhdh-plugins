## 1. Locate schema home and baseline

- [ ] 1.1 Find where AiResource / skill entity types (if any) live in this workspace, or choose a package home for agent types (prefer shared common / catalog-adjacent module)
- [ ] 1.2 Confirm current `spec.type` examples (`skill`) and any docs that still say `agents` (plural) or “pending 1113” for agent typing

## 2. Agent TypeScript schema

- [ ] 2.1 Add TypeScript types for agent-shaped AiResource (`spec.type: 'agent'`) with required `instructions` and optional fields from design D3 spike mapping (`handoffDescription`, `model`, `handoffs`, `tools`, `toolUseBehavior`, `resetToolChoice`, `modelSettings.{temperature,maxTokens,toolChoice}`, `outputSchema`)
- [ ] 2.2 Add a schema validator or type-guard helper used by tests (no `@openai/agents-core` import; opaque `string[]` for handoffs/tools)
- [ ] 2.3 Export public types from the chosen package entrypoint / API report as needed

## 3. Examples and fixtures

- [ ] 3.1 Add example `catalog-info.yaml` (under `examples/`) with at least one `kind: AiResource`, `spec.type: agent`, non-empty `spec.instructions`
- [ ] 3.2 Include optional fields in the example/fixture set (at least `handoffs` or `modelSettings`; prefer a small router + specialist handoff shape)
- [ ] 3.3 Wire the example into local catalog locations or document how to register it (follow existing skill example pattern)

## 4. Schema / unit tests

- [ ] 4.1 Add tests that accept a minimal valid agent entity
- [ ] 4.2 Add tests that accept a valid agent with optional SDK-aligned fields populated
- [ ] 4.3 Add tests that reject missing/empty `spec.instructions`, wrong type discriminator (`agents`), and clearly wrong optional field types
- [ ] 4.4 Assert schema sources do not depend on OpenAI Agents SDK packages

## 5. Docs and OpenSpec DoD

- [x] 5.1 Record spike mapping in design.md (D3) and thin schema requirements; dual-track + RHDHPLAN-1507 ownership documented
- [ ] 5.2 Update related workspace docs/examples that still use `spec.type: agents` or imply agent typing is blocked only on RHDHPLAN-1113
- [ ] 5.3 Update package README (if present) with agent field table / link to examples
- [x] 5.4 Comment on RHIDP-15866 linking `openspec/changes/airesource-agent-typed-schema/` as spike deliverable

## 6. Verification

- [ ] 6.1 Run targeted unit/schema tests for the new agent schema
- [ ] 6.2 Run lint/typecheck for touched packages
- [ ] 6.3 Smoke-check that skill/rule AiResource examples and existing extension processor behavior remain unchanged
