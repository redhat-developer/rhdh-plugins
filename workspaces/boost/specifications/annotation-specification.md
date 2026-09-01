# RHDH AI Asset Annotation Specification

> **Status: Draft** | **Last updated: 2026-08-31**
>
> **Epic:** RHIDP-15334 (Upstream Schema Alignment Readiness)
> **Story:** RHIDP-15346 (Annotation specification document)

## Overview

This document is the formal specification of all RHDH AI Asset annotations,
entity kind/`spec.type` pairings, and upstream Backstage entity kind mappings.
It covers all seven AI-asset categories per
[ai-catalog-entity-model/design.md Decision 1](../openspec/changes/ai-catalog-entity-model/design.md)
(the authoritative source of truth for current RHDH AI Asset entity mappings).

MCP servers are kind-aligned with upstream (`McpServerApiEntity`,
[backstage#34016](https://github.com/backstage/backstage/pull/34016));
remaining categories have varying upstream readiness. Actual migration is
explicitly framed as future work.

---

## 1. Annotations

### 1.1 `rhdh.io/ai-asset-category`

**Purpose:** Classifies a Backstage catalog entity as an AI asset and assigns
it to one of seven domain categories. The annotation is independent of the
entity's `kind` — the category is the semantic classification, while `kind` is
the structural Backstage type.

**Valid values (seven only):**

| Value          | Description                                      |
| -------------- | ------------------------------------------------ |
| `agent`        | An AI agent capable of autonomous task execution |
| `skill`        | A reusable AI skill invokable by agents          |
| `rule`         | An AI decision rule governing agent behavior     |
| `skill-bundle` | A curated collection of related skills           |
| `mcp-server`   | A Model Context Protocol server                  |
| `ai-model`     | An AI/ML model                                   |
| `model-server` | An inference endpoint serving one or more models |

**Format:** Lowercase kebab-case string, must be one of the seven values above.

**Example:**

```yaml
metadata:
  annotations:
    rhdh.io/ai-asset-category: skill
```

> **Out of scope:** `vector-store` and `ai-tool` are not AI asset categories.
> They appear in the `AI_ASSET_SPEC_TYPES` taxonomy for catalog browsing but
> are not part of the annotation scheme.

### 1.2 `rhdh.io/ai-asset-version`

**Purpose:** Records the version of the AI asset as reported by the source
registry. Used for display, sorting, and change detection.

**Format:** Free-form string. The SDK normalizes values to semver-compatible
format using the following rules (applied in order):

1. **Semver pass-through** — valid semver strings (e.g., `1.2.3`,
   `2.0.0-beta.1`) are stored unchanged.
2. **Date-based** — `YYYYMMDD` or `YYYY-MM-DD` is normalized to
   `0.0.0-YYYYMMDD` (compact form, dashes removed).
3. **Commit hash** — 7–12 character lowercase hex is normalized to
   `0.0.0-<hash>`.
4. **Fallback** — anything else becomes `0.0.0-unknown` with a warning.

**Example:**

```yaml
metadata:
  annotations:
    rhdh.io/ai-asset-version: 1.3.0
```

### 1.3 `rhdh.io/ai-asset-source`

**Purpose:** Records the provenance of the AI asset — which connector or
registry ingested it into the catalog.

**Format:** String identifier for the source connector or registry. Known
connectors:

| Source value   | Description                         |
| -------------- | ----------------------------------- |
| `kagenti`      | Kagenti agentic framework connector |
| `llamastack`   | Llama Stack connector               |
| `oci`          | OCI skill registry connector        |
| `mcp-registry` | MCP registry connector              |
| `rhoai`        | Red Hat OpenShift AI connector      |

Additional connector names may be registered as connectors are implemented.
The format is lowercase kebab-case.

**Example:**

```yaml
metadata:
  annotations:
    rhdh.io/ai-asset-source: kagenti
```

---

## 2. Entity Kind and `spec.type` Mapping

Each AI asset category maps to a Backstage entity kind and `spec.type` value.
This mapping is per
[ai-catalog-entity-model/design.md Decision 1](../openspec/changes/ai-catalog-entity-model/design.md).

| Category       | Backstage Kind   | `spec.type`       | Notes                                               |
| -------------- | ---------------- | ----------------- | --------------------------------------------------- |
| `agent`        | AiResource       | `agent`           | Pending RHDHPLAN-1113 (agent entity kind)           |
| `skill`        | AIResource       | `skill`           | AIResource per RHDHPLAN-1113                        |
| `rule`         | AIResource       | `rule`            | AIResource per RHDHPLAN-1113                        |
| `skill-bundle` | AIResource       | `ai-skill-bundle` | Curated skill collections; frontend browse category |
| `mcp-server`   | API              | `mcp-server`      | Ships in RHDH 2.1 via RHDHPLAN-1510                 |
| `ai-model`     | Resource         | `ai-model`        | Pending RHDHPLAN-404 (upstream entity schema)       |
| `model-server` | AiModelServerAPI | `ai-model-server` | Pending RHDHPLAN-404 (upstream entity schema)       |

> The annotation (`rhdh.io/ai-asset-category`) is the source of truth for
> classification, not the entity kind. Connectors MAY map differently based
> on their domain. See Decision 1 in the design document for rationale.

---

## 3. Upstream Mapping Scenarios

### 3.1 MCP Server — Confidence: High

| Field       | Current      | Target (upstream)                   |
| ----------- | ------------ | ----------------------------------- |
| `kind`      | `API`        | `API` (no change)                   |
| `spec.type` | `mcp-server` | `mcp-server` (`McpServerApiEntity`) |

**Status:** Kind already aligned. Upstream shipped `McpServerApiEntity` via
[backstage#34016](https://github.com/backstage/backstage/pull/34016)
(RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3).
**No kind rename required.**

**Remaining work:**

- Adopt `spec.remotes` instead of `spec.definition` for server endpoint
  configuration
- Opt in to `@backstage/plugin-catalog-backend-module-ai-model` module
- Flag fallback `Resource` entities (legacy) that need migration to `API` kind

**Confidence rationale:** Upstream kind shipped and stable; RHDH already uses
the same kind/type pairing.

### 3.2 Skills and Rules — Confidence: Medium–High

| Field       | Current          | Target (upstream)            |
| ----------- | ---------------- | ---------------------------- |
| `kind`      | `AIResource`     | `AiResource`                 |
| `spec.type` | `skill` / `rule` | `skill` / `rule` (unchanged) |

**Status:** Upstream shipped `AiResource` kind
(see [#33575](https://github.com/backstage/backstage/issues/33575) lineage).

**Transformations required:**

- Kind/name casing alignment: `AIResource` → `AiResource`
- Field alignment per upstream `AiResource` schema

**Confidence rationale:** Kind shipped upstream; field-level alignment work
remains but the structural mapping is stable.

### 3.3 Model Server — Confidence: Medium/Low

| Field       | Current            | Target (candidate)            |
| ----------- | ------------------ | ----------------------------- |
| `kind`      | `AiModelServerAPI` | `API` (candidate)             |
| `spec.type` | `ai-model-server`  | `ai-model-server` (unchanged) |

**Status:** Open upstream PR
[backstage#34476](https://github.com/backstage/backstage/pull/34476) proposes
`kind: API`, `spec.type: ai-model-server`. **Not** a new kind named
`ai-model-server`.

**Transformations required:**

- `AiModelServerAPI` → `API` kind change
- Field mapping for API-specific fields
- Related: [#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  (model-server API spec type)

**Confidence rationale:** Open PR, hedge accordingly. The target may change
before upstream merges.

### 3.4 AI Model — Confidence: Low

| Field       | Current    | Target                     |
| ----------- | ---------- | -------------------------- |
| `kind`      | `Resource` | No solid upstream kind yet |
| `spec.type` | `ai-model` | TBD                        |

**Status:** No solid upstream kind exists for AI models.

**Recommendation:** Continue using current mapping (`kind: Resource`,
`spec.type: ai-model`) until upstream stabilizes.

**Confidence rationale:** No upstream kind proposed; mapping is speculative.

### 3.5 Skill Bundle — Confidence: Low

| Field       | Current           | Target           |
| ----------- | ----------------- | ---------------- |
| `kind`      | `AIResource`      | No upstream kind |
| `spec.type` | `ai-skill-bundle` | TBD              |

**Status:** No upstream kind exists for skill bundles.

**Recommendation:** Stay on current mapping; track future upstream RFCs.

**Confidence rationale:** No upstream kind proposed.

### 3.6 Agent — Confidence: Low

| Field       | Current      | Target                          |
| ----------- | ------------ | ------------------------------- |
| `kind`      | `AiResource` | No upstream kind via RFC #32062 |
| `spec.type` | `agent`      | TBD                             |

**Status:** No upstream kind via RFC
[#32062](https://github.com/backstage/backstage/issues/32062) (that RFC is
MCP-only). Agent entity kind ownership tracked under RHDHPLAN-1113.

**Recommendation:** Continue using current mapping; track agent-kind ownership.

**Related:** [#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
(agent typed schema), RHIDP-15865.

**Confidence rationale:** No upstream kind proposed; agent-kind definition
depends on RHDHPLAN-1113.

---

## 4. Confidence Level Summary

| Confidence      | Categories                          | Meaning                                            |
| --------------- | ----------------------------------- | -------------------------------------------------- |
| **High**        | `mcp-server`                        | Upstream kind shipped and stable, kind aligned     |
| **Medium–High** | `skill`, `rule`                     | Upstream kind shipped, field/name alignment needed |
| **Medium/Low**  | `model-server`                      | Upstream target proposed in open PR, hedge         |
| **Low**         | `ai-model`, `agent`, `skill-bundle` | No solid upstream kind, mapping speculative        |

---

## 5. Fields Requiring Transformation

The following fields require transformation per entity type when migrating
to upstream kinds. These are documented for readiness assessment only —
actual migration is future work.

### MCP Server (High confidence)

- `spec.definition` → `spec.remotes` (endpoint configuration format change)
- Module opt-in: `@backstage/plugin-catalog-backend-module-ai-model`
- Legacy `Resource` kind entities → `API` kind

### Skills / Rules (Medium–High confidence)

- `kind`: `AIResource` → `AiResource` (casing alignment)
- Field alignment per upstream `AiResource` schema (field names, required vs
  optional)

### Model Server (Medium/Low confidence)

- `kind`: `AiModelServerAPI` → `API` (if upstream PR merges as proposed)
- API-specific field additions (`spec.lifecycle`, API definition fields)

### AI Model / Skill Bundle / Agent (Low confidence)

- No field transformations identified — upstream kinds not yet defined.
  Continue using current field structure.

---

## 6. Future Work

> **Important:** Actual entity migration is future work. This specification
> documents the mapping and readiness assessment only.

- **Actual catalog entity migration** — depends on upstream RFC finalization.
  No production catalog changes are part of this specification. Migration
  design and RHDH sign-off are tracked under RHIDP-15302
  ([#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042)).
- **Migration processor** — a catalog processor to perform automated
  transformations will be designed after upstream kinds stabilize.
- **Mapping updates** — this document will be updated as upstream RFCs evolve
  and confidence levels change.
- **Version fallback resolution** — whether to use `0.0.0-unknown` vs
  `"unknown"` for unrecognized version formats (currently `0.0.0-unknown`
  per SDK behavior).
- **Connector alignment** — expand `rhdh.io/ai-asset-source` vocabulary as
  new connectors are implemented (e.g., `mcp-registry-connector`,
  `rhoai-connector`).

---

## Cross-References

- **Source of truth (current entity mappings):**
  [ai-catalog-entity-model/design.md Decision 1](../openspec/changes/ai-catalog-entity-model/design.md)
- **Supplementary (catalog entity taxonomy):**
  `boost-common/src/aiAssetTaxonomy.ts` (`AI_ASSET_SPEC_TYPES`)
- **Annotation constants (SDK):**
  `boost-entity-provider-sdk/src/annotations.ts`
- **Upstream RFCs:**
  - MCP: [backstage#34016](https://github.com/backstage/backstage/pull/34016)
    / RFC [#32062](https://github.com/backstage/backstage/issues/32062)
  - AiResource: [#33575](https://github.com/backstage/backstage/issues/33575)
  - Model server: [backstage#34476](https://github.com/backstage/backstage/pull/34476)
    / RFC [#33060](https://github.com/backstage/backstage/issues/33060)
- **Related stories:**
  - RHDHPLAN-1507 / RHIDP-15302 — migration design + RHDH sign-off
    ([#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042))
  - RHDHPLAN-1513 / RHIDP-15347 — migration-readiness CLI
