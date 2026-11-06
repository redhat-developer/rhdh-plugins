## Audit Report: ai-catalog-entity-model

**Last audited:** 2026-08-14T20:15:00Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 0       | 0          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 1          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- **[D] `openspec/changes/ai-catalog-entity-model/tasks.md:52-54`** — Tasks 5.2 and 5.4 reference "LlamaStack provider" (`plugins/boost-backend-module-llamastack`), but this module was renamed to OGX (`plugins/boost-backend-module-ogx`). The "LlamaStack" name also appears in proposal.md, design.md, annotation-scheme/spec.md, and entity-provider-sdk/spec.md within this change, plus several sibling changes (agent-creation-discovery, pluggable-ai-platform-architecture, platform-operations-deployment). **Recommendation:** Coordinate a cross-change LlamaStack → OGX rename.
- **[G] `openspec/changes/ai-catalog-entity-model/specs/annotation-scheme/spec.md:70`** — `normalizeAIAssetVersion` described as "a function accepting `sourceVersion: string`" but the implementation accepts an optional second `options` parameter (for entity context and custom warning callback). Design.md D6 and tasks.md 1.4 were already updated to reflect this. The spec describes behavioral contract (which is still satisfied) — the `options` param is additive. **Recommendation:** Consider adding "and optional `options` for entity context" to the spec for completeness.

### Fixes Applied (Pass 1)

- **[B] proposal.md:37** — Updated "five defined values" → "seven defined values" and added `rule`, `skill-bundle` to match design.md D1 and implementation.
- **[D] proposal.md:92-96** — Updated Impact section paths: `plugins/boost-entity-provider-sdk/` (was `plugins/boost-backend/src/entity-provider-sdk/`), `AIAssetValidator.ts` path, `kagenti-entity-provider` and `ogx-entity-provider` (was `boost-backend-module-kagenti/llamastack`).
- **[G] annotation-scheme/spec.md:21-27** — Split combined "Missing or invalid category rejected" scenario into two: "Missing category rejected" (uses `"Invalid or missing …"` message) and "Invalid category rejected with value shown" (uses `"Invalid … value 'foo'. Allowed: …"` message), matching entity-provider-sdk spec and implementation.

### Recovery follow-up, 2026-11-05 (limited check)

The delta-sync cursor-store scenario's example now names `locationKey`, matching
the `CursorStore` parameter and the scenario's existing storage-key requirement.
This terminology correction does not change cursor behavior or resolve the
conceptual `DeltaSyncCursor.providerId` design. The full audit timestamp and
findings above remain historical; broader reconciliation belongs to RHIDP-18761.

The shared-validator missing-category scenario now includes the allowed-values
suffix emitted by `validateAIAssetEntity`, matching the companion annotation
scenario. This records the diagnostic correction without changing annotation
policy, categories, or the broader SDK design. The recovered processor methods
also have descriptive public documentation; regenerated declarations retain both
methods.

The rejected-category diagnostics now escape Unicode control characters and
line/paragraph separators as literal `\uXXXX` sequences in both validators.
Validation still uses the original value. Regression cases cover newline, tab,
terminal escape, NUL, carriage return, DEL, C1, Unicode separators, and a control
character embedded in an otherwise valid category. Missing-category assertions
also compare the complete error message, including the allowed-values hint.

### RHIDP-18761 reconciliation, 2026-11-06

Reconciled recovered RHDHPLAN-1507 specifications with the agreed 2.2 minimum
scope. Changes applied:

- Removed Neo4j adapter interface (Decision 7), SkillBundle metadata contract
  (Decision 8), and their task groups (3, 4) from the minimum baseline.
- Archived `neo4j-knowledge-graph`, `oci-skill-registry`, and
  `oci-skill-connector` change directories.
- Removed `skill-bundle` from the mandatory annotation category values
  (seven → six).
- Removed the `air-gapped-deployment` spec from active minimum specs
  (configuration examples preserved in `connector-shared-infrastructure`).
- Separated 5,000-entity load/SLA acceptance requirements as stretch.
- Noted deferred items in delta-sync-framework (durable storage,
  invalid-cursor orchestration, incremental entity providers).
- Updated migration-readiness mappings: removed skill-bundle rows,
  updated category counts. Sign-off remains pending.
