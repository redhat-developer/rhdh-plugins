# RHDH AI Asset Annotation Specification

> **Status: Draft** | **Last updated: 2026-09-02**
>
> **Epic:** RHIDP-15334 (Upstream Schema Alignment Readiness)
> **Story:** RHIDP-15346 (Annotation specification document)

> **Workspace scope:** This is follow-on schema-alignment planning. It is not
> a current RHDH 2.1 Boost frontend/OGX release deliverable.

## Overview

This document is the formal specification of all RHDH AI Asset annotations,
entity kind/`spec.type` pairings, and upstream Backstage entity kind mappings.
It covers five minimum feature categories plus existing `rule` compatibility per
[ai-catalog-entity-model/design.md Decision 1](../openspec/changes/ai-catalog-entity-model/design.md#decision-1-annotation-independence-from-entity-kinds)
(the authoritative source of truth for current RHDH AI Asset entity mappings,
after RHIDP-18761 reconciliation removed `skill-bundle`).

MCP servers are kind-aligned with upstream (`McpServerApiEntity`,
[backstage#34016](https://github.com/backstage/backstage/pull/34016));
remaining categories have varying upstream readiness. Actual migration is
explicitly framed as future work.

---

## 1. Annotations

### 1.1 `rhdh.io/ai-asset-category`

**Purpose:** Classifies a Backstage catalog entity as an AI asset and assigns
it to one of six documented values: five minimum categories plus existing `rule` compatibility. The annotation is independent of the
entity's `kind` — the category is the semantic classification, while `kind` is
the structural Backstage type.

**Reconciled values (five minimum categories plus `rule` compatibility):**

| Value          | Description                                      |
| -------------- | ------------------------------------------------ |
| `agent`        | An AI agent capable of autonomous task execution |
| `skill`        | A reusable AI skill invokable by agents          |
| `rule`         | Existing AI decision-rule compatibility only     |
| `mcp-server`   | A Model Context Protocol server                  |
| `ai-model`     | An AI/ML model                                   |
| `model-server` | An inference endpoint serving one or more models |

**Format:** Lowercase kebab-case string, must be one of the six values above.

The five minimum feature categories are `agent`, `skill`, `mcp-server`,
`ai-model`, and `model-server`. Retaining `rule` does not add discovery,
provider, or frontend obligations for rules. RHIDP-18762 reconciles the SDK's
`AIAssetCategory` union, validation schema, category list, README, and API
report to these six values. `skill-bundle` is excluded from the active SDK
vocabulary. Further metadata and provider-adoption design remains separate.

**Example:**

```yaml
metadata:
  annotations:
    rhdh.io/ai-asset-category: skill
```

> **Out of scope:** `vector-store`, `ai-tool`, and `skill-bundle` are not
> part of the minimum baseline annotation scheme. `vector-store` and `ai-tool`
> were also retired from the `AI_ASSET_SPEC_TYPES` taxonomy for catalog
> browsing. `skill-bundle` was removed from the
> minimum scope by RHIDP-18761.

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

**Purpose:** Records the provenance of the AI asset — which connector and
registry instance ingested it into the catalog.

**Format:** A provider-defined provenance identifier. A provider may use
`connector-name/registry-instance-id` when it needs to distinguish registry
instances; `registry-instance-id` is then the app-config provider instance key.
The current OGX provider emits the value
`ogx` because its release configuration has no registry-instance component.
Known `connector-name` values include:

| Token          | Connector                           |
| -------------- | ----------------------------------- |
| `ogx`          | OGX connector (formerly LlamaStack) |
| `mcp-registry` | MCP Registry connector              |
| `rhoai`        | Red Hat OpenShift AI connector      |

Additional connector names may be added when new connectors ship. The
CatalogProcessor/SDK today only requires a non-empty string.

> **Policy note:** Conditional policy matching must use the annotation value
> actually emitted by the provider. For providers that emit a connector and
> registry instance, the full value (e.g., `rhoai/default`) is distinct from
> the bare connector name. The current OGX provider emits `ogx`, so policies
> for OGX entities must match `ogx` unless the provider contract changes.

The current OGX provider uses the following value:

```yaml
metadata:
  annotations:
    rhdh.io/ai-asset-source: ogx
```

---

## 2. Entity Kind and `spec.type` Mapping

Each AI asset category maps to a Backstage entity kind and `spec.type` value.
The table below reflects the **actual entity model as implemented** by
connectors. It is based on
[ai-catalog-entity-model/design.md Decision 1](../openspec/changes/ai-catalog-entity-model/design.md#decision-1-annotation-independence-from-entity-kinds)
and matches the current connector-emitted kind for
`model-server` after Decision 1's reconciliation.

| Category       | Backstage Kind   | `spec.type`       | Notes                                                                                                                    |
| -------------- | ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `agent`        | AiResource       | `agent`           | Settled RHDH mapping, matching Decision 1; future upstream agent-schema alignment remains under RHDHPLAN-1113            |
| `skill`        | AiResource       | `skill`           | AiResource per RHDHPLAN-1113                                                                                             |
| `rule`         | AiResource       | `rule`            | AiResource per RHDHPLAN-1113                                                                                             |
| `mcp-server`   | API              | `mcp-server`      | Tracked by broader RHDHPLAN-1510 work; not a current Boost release deliverable                                           |
| `ai-model`     | Resource         | `ai-model`        | Pending RHDHPLAN-404 (upstream entity schema)                                                                            |
| `model-server` | AiModelServerAPI | `ai-model-server` | Current dedicated kind, matching Decision 1 and connector emission. Future upstream alignment remains under RHDHPLAN-404 |

> The annotation (`rhdh.io/ai-asset-category`) is the source of truth for
> classification, not the entity kind. Agent providers use `AiResource` /
> `agent`; other category mappings MAY differ based on connector domain.
> See Decision 1 in the design document for rationale.
> Decision 1's table is a reference mapping — this table documents the
> current reality.

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

The casing transformation below applies to historical `AIResource` inputs.
Current providers use `AiResource`; this table does not claim a pending
kind change for those entities. Field-level alignment remains separate.

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

### 3.5 Agent — Confidence: Low

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

| Confidence      | Categories          | Meaning                                            |
| --------------- | ------------------- | -------------------------------------------------- |
| **High**        | `mcp-server`        | Upstream kind shipped and stable, kind aligned     |
| **Medium–High** | `skill`, `rule`     | Upstream kind shipped, field/name alignment needed |
| **Medium/Low**  | `model-server`      | Upstream target proposed in open PR, hedge         |
| **Low**         | `ai-model`, `agent` | No solid upstream kind, mapping speculative        |

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

The casing example below describes historical inputs; current `AiResource`
entities need no casing migration.

- `kind`: `AIResource` → `AiResource` (casing alignment)
- Field alignment per upstream `AiResource` schema (field names, required vs
  optional)

### Model Server (Medium/Low confidence)

- `kind`: `AiModelServerAPI` → `API` (if upstream PR merges as proposed)
- API-specific field additions (`spec.lifecycle`, API definition fields)

### AI Model / Agent (Low confidence)

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
- **Version fallback — resolved.** `0.0.0-unknown` is the single
  fallback for missing or unrecognized version formats, produced by
  `normalizeAIAssetVersion()` (SDK). All connector OpenSpecs are
  aligned; connectors MUST NOT use a local `"unknown"` fallback.
  See [#4531](https://github.com/redhat-developer/rhdh-plugins/issues/4531).

---

## Cross-References

- **Source of truth (current entity mappings):**
  [ai-catalog-entity-model/design.md Decision 1](../openspec/changes/ai-catalog-entity-model/design.md#decision-1-annotation-independence-from-entity-kinds)
- **Supplementary (catalog entity taxonomy):**
  `ai-catalog-common/src/aiAssetTaxonomy.ts` (`AI_ASSET_SPEC_TYPES`)
- **Annotation constants (SDK):**
  `ai-catalog-entity-provider-sdk/src/annotations.ts`
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
