# Tasks: AiResource Agent Typed Schema

## 1. Locate schema home and baseline

- [ ] 1.1 Follow design D10: start from upstream `@backstage/catalog-model` alpha AiResource skill/rule types + validators (`SkillAiResourceEntityV1alpha1`, `skillAiResourceEntityV1alpha1Validator`, etc.) and the MCP `mcp-server` API extension (`McpServerApiEntity` / `mcpServerApiEntityValidator`) as the implementation pattern; choose RHDH package home by mirroring how those models are consumed in this workspace
- [x] 1.2 Correct sibling discovery OpenSpec plural `agents`/`skills` examples to singular `agent`/`skill`; confirm skill examples and remove “pending 1113” agent language where touched

## 2. Agent TypeScript schema

- [ ] 2.1 Add an agent AiResource typed variant (union member / local mirror) with `spec.type: 'agent'`, optional `instructions`, and optional fields from design D3—matching the skill/rule discriminated-type style (not an ad-hoc standalone interface)
- [ ] 2.2 Add `KindValidator` + type guard for agent (same shape as `skillAiResourceEntityV1alpha1Validator` / `isSkillAiResourceEntity`); no OpenAI Agents SDK import; opaque `string[]` for handoffs/tools
- [ ] 2.3 Wire validator into catalog model / backend module registration the way skill/rule (and MCP `mcp-server`) validators are registered; export public types from the chosen package entrypoint / API report as needed

## 3. Examples and fixtures

- [ ] 3.1 Add example `catalog-info.yaml` (under `examples/`) with at least one `kind: AiResource`, `spec.type: agent` (include `spec.instructions` in at least one example)
- [ ] 3.2 Include optional fields in the example/fixture set (at least `handoffs` or `modelSettings`; prefer a small router + specialist handoff shape)
- [ ] 3.3 Wire the example into local catalog locations or document how to register it (follow existing skill example pattern)

## 4. Schema / unit tests

- [ ] 4.1 Add tests that accept a minimal valid agent entity
- [ ] 4.2 Add tests that accept a valid agent with optional mapped fields populated
- [ ] 4.3 Add tests that accept omitted `spec.instructions`, reject wrong type discriminator (`agents`), and clearly wrong optional field types
- [ ] 4.4 Assert schema sources do not depend on OpenAI Agents SDK packages

## 5. Catalog processor validation (RHIDP-15868)

- [ ] 5.1 Add `AiResourceAgentProcessor` in `catalog-backend-module-ai-resource-agent` to validate agent-specific fields when `spec.type: agent`; do **not** extend `AiResourceExtensionsProcessor` (which remains scope/OCI only)
- [ ] 5.2 Accept omitted `spec.instructions`; reject wrong-type instructions and wrong optional agent field shapes with actionable errors
- [ ] 5.3 Do not enforce entity-ref format on `handoffs` / `tools`; do not add new owner/lifecycle processor rules
- [ ] 5.4 Add processor tests for accept and reject paths; ensure non-agent AiResources are unaffected
- [ ] 5.5 Register `AiResourceAgentProcessor` in the agent backend module alongside the model source

## 6. Docs and OpenSpec DoD

- [x] 6.1 Record field mapping in design.md (D3), thin schema + ingestion requirements, dual-track + RHDHPLAN-1507 ownership
- [ ] 6.2 Update related workspace docs that still imply agent typing is blocked only on RHDHPLAN-1113
- [ ] 6.3 Update package README (if present) with agent field table / link to examples
- [x] 6.4 Comment on RHIDP-15866 linking `openspec/changes/airesource-agent-typed-schema/` as spike deliverable

## 7. Verification

- [ ] 7.1 Run targeted unit/schema and processor tests for agent coverage
- [ ] 7.2 Run lint/typecheck for touched packages
- [ ] 7.3 Smoke-check that skill/rule AiResource examples and non-agent extension processor behavior remain unchanged
