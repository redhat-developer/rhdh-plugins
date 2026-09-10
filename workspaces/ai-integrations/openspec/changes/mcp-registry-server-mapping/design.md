# Design: MCP Registry Server Mapping

## Canonical Touchpoints

Carried forward from the proposal:

- **PRDs (`specifications/prd/`)**: None
- **ADRs (`specifications/adr/`)**: None
- **Long-lived specs (`openspec/specs/`)**: None

No canonical document updates. This change introduces new capabilities only and does not modify any existing canonical document or long-lived spec.

## Context

MCP registries publish server entries as `server.json` documents conforming to the draft [`server.schema.json`](https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json). Backstage already supports cataloging MCP servers as `API` entities with `spec.type: mcp-server` (implemented upstream in `backstage/backstage`, not by RHDH). This change defines the pure transform between the two — one `server.json` in, one `API` entity out — and nothing else. Who fetches registry entries and when (an entity provider, a polling schedule) is explicitly out of scope.

Upstream Backstage defines a **dedicated `mcp-server` `API` entity schema** that overrides the base `API` schema for `spec.type: mcp-server`:

- The **dedicated mcp-server entity schema** [`McpServerApiEntity.ts`](https://github.com/backstage/backstage/blob/f91434377dc43cd64bef82344e3f2b539bfdaf11/packages/catalog-model/src/kinds/McpServerApiEntity.ts#L28-L36) (Backstage [PR #34016](https://github.com/backstage/backstage/pull/34016)) does `Omit<ApiEntityV1alpha1, 'spec'>` and redefines `spec` for `spec.type: mcp-server` as required `type`, `lifecycle`, `owner`, and `remotes[]` (with optional `system`). `spec.remotes` is **required** and `spec.definition` is **not part of this schema** — the dedicated schema replaces (not merely extends) the base `spec`.
- The **canonical example** [`backstage-mcp-server-api.yaml`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml) matches that schema: top-level `spec.remotes[]` (`type`, `url`) and no `spec.definition`.
- The committed **base API schema** [`API.v1alpha1.schema.json`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/src/schema/kinds/API.v1alpha1.schema.json) lists `definition` among the required `spec` fields and does not define `spec.remotes` — but that `definition` requirement does **not** apply to `spec.type: mcp-server`, which is governed by the dedicated schema above.

The mapping therefore targets the dedicated `mcp-server` entity shape: top-level `spec.remotes[]` in place of `spec.definition`. This aligns with the upstream-first principle — the shape is the one upstream ships, not an RHDH invention.

## Goals / Non-Goals

**Goals:**

- A deterministic, idempotent, side-effect-free transform: `server.json` (+ caller defaults) → one `mcp-server` `API` entity.
- Faithful adherence to the upstream mcp-server entity shape (top-level `spec.remotes[]`, no `spec.definition`).
- Collision-free entity identity across multiple versions of the same server.
- Lossless capture of source data: every non-null scalar leaf is recoverable from a native field or a `modelcontextprotocol.io/*` annotation.
- Catalog-valid output: every produced key/name passes Backstage validation.

**Non-Goals:**

- Registry HTTP client, polling, scheduling, or an entity provider/processor (separate future change).
- Modifying the upstream `mcp-server` entity contract or its validation.
- Reverse mapping (entity → `server.json`) beyond the scalar round-trip guarantee.
- Executing or health-checking mapped servers, or interpreting local `packages[]` runtime details.
- Deduplicating the same server across multiple registries.

## Decisions

### D1: Target the upstream example shape — top-level `spec.remotes[]`, no `spec.definition`

**Choice:** The entity carries `spec.type: mcp-server`, `spec.lifecycle`, `spec.owner`, and top-level `spec.remotes[]` (`type`, `url`). No `spec.definition` is emitted.

**Alternatives considered:** (a) Inline `spec.definition` MCP Server Specification string — rejected; the mcp-server entity uses `spec.remotes` instead. (b) Dual-write both `spec.definition` and `spec.remotes` for base-schema safety — rejected as redundant given the target shape uses `spec.remotes`.

**Rationale:** Aligns with the dedicated upstream `McpServerApiEntity` schema, which defines `spec.remotes` in place of `spec.definition`.

### D2: Two-tier mapping — native lift, then annotation projection fallback

**Choice:** Attributes with a native home lift into `metadata`/`spec` fields (`mcp-registry-server-mapping`); everything else is projected into `modelcontextprotocol.io/*` annotations (`mcp-registry-annotation-projection`).

**Alternative considered:** Stuff the entire `server.json` into a single annotation blob — rejected; opaque and not individually searchable/filterable.

**Rationale:** Keeps the entity idiomatic for catalog consumers while losing no source data.

### D3: Annotation key encoding — dot-separated path after the prefix

**Choice:** Nested paths are encoded as `modelcontextprotocol.io/attribute.tree.to.leaf` (object keys by name, array elements by zero-based index). Path segments are sanitized (illegal characters and leading `_` replaced) and over-length keys are truncated with a stable hash suffix; sanitization collisions are disambiguated by the same hash suffix.

**Alternatives considered:** Literal slashes (`.../attr/tree/leaf`) — rejected, invalid Backstage keys; hyphenated scalars + JSON blobs for arrays — rejected, less uniform and less queryable.

**Rationale:** Backstage annotation keys allow exactly one `/` and a ≤63-char name segment over a restricted character set, making dot-separated encoding the most uniform and queryable representation that fits within those constraints.

### D4: Entity identity — `metadata.name` = `<name>__<version>`

**Choice:** `metadata.name` is the sanitized canonical name and sanitized version joined by `__`. The bare canonical name is preserved in `modelcontextprotocol.io/name` and the version in `modelcontextprotocol.io/version`, so both remain individually queryable and the identity is reconstructable. Over-length/collision falls back to truncation + stable hash suffix.

**Alternative considered:** Encode the version in `metadata.namespace` — rejected; fragments entity references and complicates relationships.

**Rationale:** A registry publishes one `server.json` per version and each becomes its own entity, so a name derived from the canonical name alone would collide across versions.

### D5: Supplying fields absent from `server.json` — owner and lifecycle

**Choice:** `spec.owner` is set to the constant `unknown` by default; a caller MAY supply an override default, but the transform never fails for a missing owner (a placeholder owner keeps the output valid, and the future ingestion change can reassign ownership). `spec.lifecycle` is set to the constant `production` by default; a caller MAY supply an override default lifecycle value. Both fields use the same caller-override pattern for consistency.

**Alternatives considered:** (a) Require caller-provided owner/lifecycle and fail if absent — rejected; a pure transform should always yield a valid entity, and ownership/lifecycle assignment belongs to the ingestion layer. (b) Derive lifecycle from a `status` field — rejected; `status` is not part of the base `server.schema.json` (verified 2026-08-21 against the draft schema).

**Rationale:** `server.json` (per the base `server.schema.json`) has no owner or lifecycle fields. Defaults keep the output valid without requiring the caller to supply values that the ingestion layer should own.

### D6: Determinism and idempotency

**Choice:** The transform is a pure function of (`server.json`, caller defaults) with stable ordering of `spec.remotes`, `metadata.tags`, and annotation keys, and no timestamps or randomness.

**Rationale:** Makes the output safe as the identity for repeated ingestion and usable as a golden-file test oracle.

### D7: Fail-open to generic projection on schema drift

**Choice:** Native mappings are pinned to known fields; any field not recognized by a native rule is still captured by the generic annotation projection. New/unknown source fields are therefore never dropped — at worst they land in annotations rather than a native field.

**Rationale:** The draft `server.schema.json` evolves. Fail-open projection ensures no source data is lost as the schema changes.

### D8: Servers with no remotes emit an empty `spec.remotes: []`

**Choice:** A `server.json` that declares no `remotes` (e.g. a local-`packages`-only server) is mapped to an entity with an **empty array** `spec.remotes: []`, never an omitted field.

**Alternative considered:** Treat a no-remotes server as a mapping failure — rejected; such servers are valid registry entries and their `packages`/metadata are still worth cataloging (their runtime details are preserved via annotation projection).

**Rationale:** The upstream `McpServerApiEntity` schema requires `spec.remotes`. An empty array keeps the output both schema-conformant and deterministic (D6) — the no-remotes case has a single, stable representation.

**Dependency note:** This assumes `McpServerApiEntity` accepts an empty `remotes` array (no `minItems: 1`); if upstream later enforces a non-empty `remotes`, revisit this decision (emit a failure or a documented placeholder).

### D9: Redact secret-flagged input values from annotation projection

**Choice:** When an input object declares `isSecret: true`, the projection walker SHALL prune (omit) that object's `default` and `value` leaves; all non-secret sibling leaves (`name`, `description`, `format`, `isRequired`, `isSecret` itself, `choices`, …) continue to project. The redaction applies uniformly to every `isSecret`-bearing input, not only environment variables — redacting env vars while leaving remote `headers`/`variables` exposed would reintroduce the same leak.

**Alternatives considered:** (a) Hash/mask the value instead of omitting — rejected; a mask still advertises the secret's presence and length without adding catalog value, and a hash is neither reversible nor useful for discovery. (b) Project into a differently-prefixed "sensitive" annotation — rejected; catalog annotations are not a secret store, so any in-entity representation is unsafe.

**Rationale:** The `server.json` `Input` shape (used by `packages[].environmentVariables[]`, `remotes[].headers[]`, `remotes[].variables`, and package/runtime arguments) carries an `isSecret` flag alongside `default`/`value`. Because annotation projection (D2/D3) emits scalar leaves into **searchable, plaintext** catalog annotations, projecting the `default`/`value` of an `isSecret: true` input would publish a credential.

**Round-trip consequence:** This is a deliberate exception to the scalar round-trip fidelity guarantee (D-note below and the projection spec); a pruned secret leaf is intentionally _not_ recoverable from the entity.

### D10: Repository emits both `backstage.io/source-location` and a titled `metadata.links` entry; `websiteUrl` link titled "Website"

**Choice:** `repository.url` (combined with `repository.subfolder` when present) is emitted **both** as the canonical Backstage `backstage.io/source-location` annotation — the annotation source-aware Backstage tooling (source view, scaffolder, TechDocs) reads to locate an entity's repository — **and** as a human-visible `metadata.links` entry titled `Source Code`. `websiteUrl` is emitted as a `metadata.links` entry titled `Website`.

**Alternatives considered:** (a) Emit only the `metadata.links` source entry and omit `backstage.io/source-location` — rejected; without the canonical annotation, upstream source-location tooling cannot resolve the repository. (b) Emit only the annotation and no link — rejected; the annotation is not surfaced as a browsable link in the catalog UI.

**Rationale:** Emitting the source-location annotation in addition to the link keeps the entity idiomatic for both machine consumers (the annotation) and the catalog UI (the titled link). The `backstage.io/source-location` value is set by the direct mapping and is therefore a reserved annotation that the generic projection (D2/D3) must not overwrite or re-derive.

## Risks / Trade-offs

- **63-char truncation collisions** → Deterministic hash suffix on truncation and on sanitization collisions keeps keys unique; the hash is derived from the full source path so it is stable across runs.
- **`metadata.name` collisions across registries** (same name+version from two registries) → Out of scope here (no dedup); documented so the future ingestion change can namespace or dedup. Within a single source the `<name>__<version>` + hash-suffix rule guarantees uniqueness.
- **Draft schema drift** → D7 fail-open projection; the mapping table is versioned against the draft and revisited when the schema changes.
- **Lossy flattening of deep `packages[]` config** → Accepted; runtime package details are preserved as scalar-leaf annotations for discoverability, not interpreted. Round-trip fidelity is guaranteed only for scalar leaves.
- **Secret leakage into searchable annotations** (remote `headers`/`variables`, `environmentVariables` carrying `default`/`value`) → D9 prunes the `default`/`value` leaves of any `isSecret: true` input from projection. This is a deliberate carve-out from scalar round-trip fidelity — secret leaves are intentionally unrecoverable from the entity. Non-secret metadata on the same input still projects, so discoverability is preserved.
- **Upstream shape may change** (RFC #32062 could reintroduce `spec.definition` or formalize `spec.remotes` in the base schema) → The target shape is isolated to `mcp-registry-server-mapping`; a shape change is a localized spec/mapping update.

## Migration Plan

Not applicable — new capabilities with no existing data or behavior to migrate. The mapping is additive and has no runtime deployment surface of its own until a future ingestion change consumes it.

## Open Questions

- Should the mapping optionally map the reverse-DNS namespace (portion before `/` in `server.json` `name`) to `metadata.namespace`, or keep a single default namespace? Deferred to the ingestion change, where entity-ref implications are clearer.
- Cross-registry dedup/merge of the same server (same name+version from multiple registries) — deferred to the ingestion change.
