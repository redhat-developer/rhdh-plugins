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

- The **dedicated mcp-server entity schema** [`McpServerApiEntity.ts`](https://github.com/backstage/backstage/blob/f91434377dc43cd64bef82344e3f2b539bfdaf11/packages/catalog-model/src/kinds/McpServerApiEntity.ts#L28-L36) (Backstage [PR #34016](https://github.com/backstage/backstage/pull/34016)) does `Omit<ApiEntityV1alpha1, 'spec'>` and redefines `spec` for `spec.type: mcp-server` as required `type`, `lifecycle`, `owner`, and `remotes[]` (with optional `system`). `spec.remotes` is **required** and `spec.definition` is **not part of this schema** — the dedicated schema replaces (not merely extends) the base `spec`. Validation uses [`API.v1alpha1.mcp-server.schema.json`](https://github.com/backstage/backstage/blob/f91434377dc43cd64bef82344e3f2b539bfdaf11/packages/catalog-model/src/schema/kinds/API.v1alpha1.mcp-server.schema.json), which sets `spec.remotes` **`minItems: 1`** — an empty `remotes` array is not catalog-valid.
- The **canonical example** [`backstage-mcp-server-api.yaml`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml) matches that schema: top-level `spec.remotes[]` (`type`, `url`) and no `spec.definition`.
- The committed **base API schema** [`API.v1alpha1.schema.json`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/src/schema/kinds/API.v1alpha1.schema.json) lists `definition` among the required `spec` fields and does not define `spec.remotes` — but that `definition` requirement does **not** apply to `spec.type: mcp-server`, which is governed by the dedicated schema above.

The mapping therefore targets the dedicated `mcp-server` entity shape: top-level `spec.remotes[]` in place of `spec.definition`. This aligns with the upstream-first principle — the shape is the one upstream ships, not an RHDH invention.

### Upstream references

Anchors for the mapping target (`backstage/backstage`):

- **Canonical example** — [`backstage-mcp-server-api.yaml`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml): reference `mcp-server` `API` entity (`spec.remotes[]`, no `spec.definition`):

  ```yaml
  apiVersion: backstage.io/v1alpha1
  kind: API
  metadata:
    name: backstage-mcp-server
    description: An MCP server that exposes tools related to the Backstage ecosystem
    tags: [mcp, ai]
  spec:
    type: mcp-server
    lifecycle: experimental
    owner: team-a
    remotes:
      - type: streamable-http
        url: http://localhost:7007/api/mcp/v1
  ```

- **Base API schema** — [`API.v1alpha1.schema.json`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/src/schema/kinds/API.v1alpha1.schema.json): generic `API` requires `spec.definition`; that requirement does **not** apply to `spec.type: mcp-server`.
- **RFC** — [#32062](https://github.com/backstage/backstage/issues/32062): MCP servers as `API` with `spec.type: mcp-server`.
- **Dedicated schema** — [`McpServerApiEntity.ts`](https://github.com/backstage/backstage/blob/f91434377dc43cd64bef82344e3f2b539bfdaf11/packages/catalog-model/src/kinds/McpServerApiEntity.ts#L28-L36) ([PR #34016](https://github.com/backstage/backstage/pull/34016)): requires `spec.remotes[]`; omits `spec.definition`.

**Mapping consequence:** emit `spec.type: mcp-server`, `spec.lifecycle`, `spec.owner`, `metadata` (`name`/`title`/`description`/`tags`/`links`), and top-level `spec.remotes[]` (`type`, `url`) only. Project everything else (`packages`, `icons`, remote `headers`/`variables`, `_meta`, remaining `repository` sub-fields, …) via `mcp-registry-annotation-projection`, with dedicated `modelcontextprotocol.io/name`, `modelcontextprotocol.io/version`, and (when D11 passes) `modelcontextprotocol.io/repository.url` from the direct mapping.

### Source schema scope

The draft `server.json` top-level surface this mapping is written against includes `name`, `title`, `description`, `version`, `websiteUrl`, `icons[]`, `repository` (`url`, `source`, `id`, `subfolder`), `packages[]` (nested runtime/package arguments, environment variables, transport), `remotes[]` (`type`, `url`, `headers[]`, `variables`), and `_meta`. The draft evolves; native mappings pin known fields and unknown fields fail-open into annotations (D7).

### Deliverables

Implementation tasks produce a version-pinned `mapping-reference.md` under `openspec/changes/mcp-registry-server-mapping/` (field-mapping table and annotation-key rules; see tasks 1.1), user-facing mapping documentation, and input→expected-output conformance fixtures as the golden oracle.

## Goals / Non-Goals

**Goals:**

- A deterministic, idempotent, side-effect-free transform: `server.json` (+ caller defaults) → one `mcp-server` `API` entity.
- Faithful adherence to the upstream mcp-server entity shape (top-level `spec.remotes[]`, no `spec.definition`).
- Collision-free entity identity across multiple versions of the same server (`<prefix>__<name>__<version>`, prefix default `mcp.registry`).
- Lossless capture of source data: every non-null scalar leaf is recoverable from a native field or a `modelcontextprotocol.io/*` annotation, except D9-redacted `isSecret` `default`/`value`/`choices` leaves and D11-refused URL scalars (not copied into emitted URL fields and not projected as annotations).
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

**Choice:** Attributes with a native home lift into `metadata`/`spec` fields or dedicated annotations (`mcp-registry-server-mapping`); everything else is projected into `modelcontextprotocol.io/*` annotations (`mcp-registry-annotation-projection`). Dedicated annotations include `modelcontextprotocol.io/name`, `modelcontextprotocol.io/version`, and the unnormalized `modelcontextprotocol.io/repository.url` when that URL passes D11. A URL that D11 refuses is not copied into any emitted URL field and is not projected as an annotation.

**Alternative considered:** Stuff the entire `server.json` into a single annotation blob — rejected; opaque and not individually searchable/filterable.

**Rationale:** Keeps the entity idiomatic for catalog consumers while losing no source data.

### D3: Annotation key encoding — dot-separated path after the prefix

**Choice:** Nested paths are encoded as `modelcontextprotocol.io/attribute.tree.to.leaf` (object keys by name, array elements by zero-based index). Each **object-key segment** in the dot path is sanitized before the segments are joined; array index segments are unchanged decimal numerals. Sanitization per segment: lowercase; replace every character outside `a-z`, `0-9`, `.`, `_`, and `-` with a single ASCII hyphen (`-`); if the segment still begins with `_`, replace that leading `_` with `x` (for example `_meta` → `xmeta`, and `io.modelcontextprotocol.registry/publisher-provided` → `io.modelcontextprotocol.registry-publisher-provided`). **Boundary normalization (per segment):** while the segment's first character is not alphanumeric (`a-z`/`0-9`), replace that character with `x`; while the segment's last character is not alphanumeric, replace that character with `x` (for example a segment that sanitizes to `-` alone becomes `x`). Join sanitized segments with `.` into the annotation **name segment**, then apply the same boundary normalization on the joined name segment (so a key cannot start or end with `.`, `-`, `_`, or any other non-alphanumeric). Over-length name segments are truncated with a stable hash suffix; sanitization collisions are disambiguated by the same hash suffix.

**Alternatives considered:** Literal slashes (`.../attr/tree/leaf`) — rejected, invalid Backstage keys; hyphenated scalars + JSON blobs for arrays — rejected, less uniform and less queryable.

**Rationale:** Backstage annotation keys allow exactly one `/` and a ≤63-char name segment over a restricted character set, making dot-separated encoding the most uniform and queryable representation that fits within those constraints.

**Reserved-key collisions:** Generic projection never overwrites direct-mapping annotations. Scalars already lifted by the direct mapping are not re-projected. When a distinct source path sanitizes to the same key as a reserved annotation, apply the same D3 hash-suffix disambiguation used for sanitization collisions so the scalar still projects without clobbering the reserved value.

### D4: Entity identity — `metadata.name` = `<prefix>__<name>__<version>`

**Choice:** `metadata.name` is the sanitized prefix, sanitized canonical name, and sanitized version joined by `__`. Each of those three strings is sanitized **independently** with the D3 per-segment algorithm (lowercase; illegal chars → `-`; leading `_` → `x`; per-segment boundary normalization so each segment begins and ends alphanumeric) before joining — not by splitting on `.` like annotation dot paths. After joining with `__`, apply the same boundary normalization on the full candidate stem so `metadata.name` begins and ends alphanumeric before hash/truncation logic runs. The prefix is the constant `mcp.registry` by default; a caller MAY supply an override default (same caller-override pattern as owner and lifecycle in D5). If the override is unset, empty, or sanitizes to empty, the mapping uses `mcp.registry` — it never fails for a missing prefix, and the produced name never starts with `_`. The bare canonical name is preserved in `modelcontextprotocol.io/name` and the version in `modelcontextprotocol.io/version`, so both remain individually queryable and the identity is reconstructable together with the effective prefix. A stable hash suffix derived from the prefix, canonical name, and version is appended whenever sanitization mutates any identity segment or the joined candidate exceeds 63 characters (truncate the stem as needed). An already catalog-valid candidate that is ≤63 characters is emitted with no hash. The rule is per-input; it does not observe other documents.

**Alternatives considered:** (a) Encode the version in `metadata.namespace` — rejected; fragments entity references and complicates relationships. (b) `<name>__<version>` with no prefix — rejected; leaves registry-mapped entities without a caller-controllable namespacing token in `metadata.name` (they would collide with any other `mcp-server` API that sanitizes to the same name+version).

**Rationale:** A registry publishes one `server.json` per version and each becomes its own entity, so a name derived from the canonical name alone would collide across versions. The prefix distinguishes registry-mapped entities in a shared catalog and lets the future ingestion layer pass a per-source override without changing the transform.

### D5: Supplying fields absent from `server.json` — owner and lifecycle

**Choice:** `spec.owner` is set to the constant `unknown` by default; a caller MAY supply an override default, but the transform never fails for a missing owner (a placeholder owner keeps the output valid, and the future ingestion change can reassign ownership). `spec.lifecycle` is set to the constant `production` by default; a caller MAY supply an override default lifecycle value. Both fields use the same caller-override pattern as the identity prefix in D4.

**Alternatives considered:** (a) Require caller-provided owner/lifecycle and fail if absent — rejected; a pure transform should always yield a valid entity, and ownership/lifecycle assignment belongs to the ingestion layer. (b) Derive lifecycle from a `status` field — rejected; `status` is not part of the base `server.schema.json` (verified 2026-08-21 against the draft schema).

**Rationale:** `server.json` (per the base `server.schema.json`) has no owner or lifecycle fields. Defaults keep the output valid without requiring the caller to supply values that the ingestion layer should own.

**Caller defaults interface:** The transform is invoked as a pure function of (`server.json`, caller defaults). Caller defaults are **not** fields in `server.json`; they are a separate optional object whose supported keys are:

| Caller default | Affects                                 | When omitted   |
| -------------- | --------------------------------------- | -------------- |
| `prefix`       | Identity prefix in `metadata.name` (D4) | `mcp.registry` |
| `owner`        | `spec.owner` (D5)                       | `unknown`      |
| `lifecycle`    | `spec.lifecycle` (D5)                   | `production`   |

Unset, empty, or sanitizes-to-empty `prefix` falls back to `mcp.registry` (D4). Missing `owner` or `lifecycle` never fails the mapping (D5).

**Sibling [`mcp-registry-provider`](../mcp-registry-provider/):** the first catalog entity provider consumer maps `catalog.providers.mcpRegistry.defaultOwner` → caller `owner` and, when configured, `catalog.providers.mcpRegistry.baseName` → caller `prefix`. When `baseName` is omitted, the provider does not supply a `prefix` override. The provider does not currently pass a `lifecycle` override. Provider config schema and runtime behavior remain owned by `mcp-registry-provider`; this change only documents the mapping-side contract those values satisfy.

Required `server.json` fields (`name`, `description`, `version`) are unrelated to caller defaults — omitting them still fails the mapping with an actionable error (see mapping spec).

### D6: Determinism and idempotency

**Choice:** The transform is a pure function of (`server.json`, caller defaults) with stable ordering of `spec.remotes`, `metadata.tags`, and annotation keys, and no timestamps or randomness.

**Rationale:** Makes the output safe as the identity for repeated ingestion and usable as a golden-file test oracle.

### D7: Fail-open to generic projection on schema drift

**Choice:** Native mappings are pinned to known fields; any field not recognized by a native rule is still captured by the generic annotation projection **unless** D11 refuses it as a URL. New/unknown source fields are therefore never dropped except D11-refused URL scalars — at worst they land in annotations rather than a native field.

**Rationale:** The draft `server.schema.json` evolves. Fail-open projection ensures no source data is lost as the schema changes, except URL scalars D11 refuses.

### D8: No native remotes — documented placeholder `spec.remotes` entry

**Choice:** Upstream `API.v1alpha1.mcp-server.schema.json` requires `spec.remotes` with **`minItems: 1`**. When `server.json` has **no** `remotes` (unset or empty array) — e.g. a local-`packages`-only server — the mapping SHALL emit exactly one **placeholder** remote: `type: undefined` (literal string, unknown transport) and `url` set to `websiteUrl` (the server's public base URL in `server.json`; decision shorthand **`<baseUrl>`**) when that value passes D11. This placeholder is synthetic catalog metadata, not an MCP transport discovered from `remotes[]`; consumers must not treat it as a guaranteed MCP endpoint. When `websiteUrl` is absent, null, or fails D11, the mapping SHALL **fail** with an actionable error that at least one native remote or a D11-valid `websiteUrl` is required to satisfy upstream `minItems: 1`.

When the source declares `remotes` but **every** entry is omitted from `spec.remotes` because D11 refused each `url`, apply the same placeholder rule (single `type: undefined` + D11-valid `websiteUrl`); otherwise fail with the same error.

**Alternatives considered:** (a) Emit `spec.remotes: []` — rejected; violates upstream `minItems: 1`. (b) Unconditional mapping failure for packages-only servers — rejected; registry entries without remotes are still worth cataloging when `websiteUrl` supplies a stable placeholder URL.

**Rationale:** Keeps packages-only (and similar) registry documents catalogable while staying valid against the pinned upstream JSON schema. The placeholder is deterministic (D6) and explicitly labeled via `type: undefined` so agents can distinguish it from real transport entries.

### D9: Redact secret-flagged input values from annotation projection

**Choice:** When an input object declares `isSecret: true`, the projection walker SHALL prune (omit) that object's `default`, `value`, and `choices` leaves (including every `choices[]` element); those values SHALL NOT appear in any `modelcontextprotocol.io/*` annotation. Non-secret sibling leaves (`name`, `description`, `format`, `isRequired`, `isSecret` itself, `placeholder`, …) continue to project. The redaction applies uniformly to every `isSecret`-bearing input, not only environment variables — redacting env vars while leaving remote `headers`/`variables` exposed would reintroduce the same leak.

**Alternatives considered:** (a) Hash/mask the value instead of omitting — rejected; a mask still advertises the secret's presence and length without adding catalog value, and a hash is neither reversible nor useful for discovery. (b) Project into a differently-prefixed "sensitive" annotation — rejected; catalog annotations are not a secret store, so any in-entity representation is unsafe. (c) Keep projecting `choices` on `isSecret: true` inputs and document that they cannot be secrets — rejected; the MCP `Input.choices` field is "a list of possible values for the input," the same class of data as `default`/`value`. Enumerating those values in the catalog would publish the secret's allowed set.

**Rationale:** The `server.json` `Input` shape (used by `packages[].environmentVariables[]`, `remotes[].headers[]`, `remotes[].variables`, and package/runtime arguments) carries an `isSecret` flag alongside `default`/`value`/`choices`. Because annotation projection (D2/D3) emits scalar leaves into **searchable, plaintext** catalog annotations, projecting those leaves of an `isSecret: true` input would publish a credential (or its enumerated possible values). `placeholder` is guidance about expected form, not a value list, and still projects.

**Round-trip consequence:** This is a deliberate exception to the scalar round-trip fidelity guarantee in the projection spec; pruned `default`/`value`/`choices` leaves are intentionally _not_ recoverable from the entity.

### D10: Repository emits both `backstage.io/source-location` and a titled `metadata.links` entry; `websiteUrl` link titled "Website"

**Choice:** `repository.url` combined with `repository.subfolder` when present is emitted **both** as the canonical Backstage `backstage.io/source-location` annotation — whose value MUST use the `url:` format (`url:<combined-url>`), the format source-aware Backstage tooling (source view, scaffolder, TechDocs) reads to locate an entity's repository — **and** as a human-visible `metadata.links` entry titled `Source Code`, **only when** the original `repository.url` passes D11. Independently, when that URL passes D11, the original `repository.url` scalar is copied **verbatim** (no trailing-`/` or `.git` strip, no subfolder join) into a dedicated `modelcontextprotocol.io/repository.url` annotation so the source value remains recoverable after combination-base normalization. When D11 refuses `repository.url`, the mapping omits the Source Code link, `backstage.io/source-location`, **and** `modelcontextprotocol.io/repository.url`, and does not project the refused URL. `websiteUrl` is emitted as a `metadata.links` entry titled `Website` only when it passes D11; a refused `websiteUrl` is not projected.

The combined URL is computed by the SCM-aware algorithm in `mcp-registry-server-mapping`: strip trailing `/` and a trailing `.git` from a **copy** of `repository.url` used only as the combination `base`; if `subfolder` is unset, null, or whitespace-only after trim the result is that base URL; otherwise select a browse-path template from `repository.source` (`github` → `{base}/tree/HEAD/{subfolder}`, `gitlab` → `{base}/-/tree/HEAD/{subfolder}`, `bitbucket` → `{base}/src/HEAD/{subfolder}`, `azure-devops` → `{base}?path=/{subfolder}`) and fall back to `{base}/{subfolder}` for any other source. The mapping never invents a branch name such as `main` — `server.json` has no ref field, so templates that need a ref use the git symbolic ref `HEAD`. Normalization of the combination `base` SHALL NOT rewrite `modelcontextprotocol.io/repository.url`.

**Alternatives considered:** (a) Emit only the `metadata.links` source entry and omit `backstage.io/source-location` — rejected; without the canonical annotation, upstream source-location tooling cannot resolve the repository. (b) Emit only the annotation and no link — rejected; the annotation is not surfaced as a browsable link in the catalog UI. (c) Expect `repository.url` to already include a tree/branch path when a subfolder is relevant — rejected; the MCP schema defines `url` as the repository root and `subfolder` as a separate relative path (see the [monorepo example](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md)). (d) Always path-join `url` and `subfolder` with no SCM template — rejected; GitHub/GitLab/Bitbucket/Azure DevOps each use a different subdirectory browse URL, so a naive join is not a valid browse URL on those hosts. (e) Insert a guessed default branch (`main`) into the path — rejected; the default branch is not in `server.json` and is often not `main`. (f) Treat the normalized combined URL as the recoverable `repository.url` and skip a dedicated annotation — rejected; stripping `.git`/`/` (and folding in `subfolder`) would make the original scalar unrecoverable.

**Rationale:** Emitting the source-location annotation in addition to the link keeps the entity idiomatic for both machine consumers (the annotation) and the catalog UI (the titled link). Keying the join on `repository.source` keeps subdirectory links valid across SCMs without requiring a branch that the schema does not provide. When D11 passes, the original `repository.url` is a dedicated annotation so scalar round-trip still holds after combination-base normalization. `backstage.io/source-location` and `modelcontextprotocol.io/repository.url` (when emitted) are set by the direct mapping and are therefore reserved annotations that the generic projection (D2/D3) must not overwrite or re-derive. D11 gates the dedicated annotation as well as the link and source-location so a `javascript:`/`data:` `repository.url` cannot land in any URL-shaped field.

### D11: Allowlist `http`/`https` on every emitted or projected URL; do not classify hosts; do not fetch

**Choice:** Before copying a URL into `metadata.links[].url`, `backstage.io/source-location` (the target after `url:`), `spec.remotes[].url`, `modelcontextprotocol.io/repository.url`, **or any generic `modelcontextprotocol.io/*` annotation whose value is that URL**, the mapping parses the candidate as an absolute URL with no base (trim whitespace; WHATWG `URL` parse). The candidate is copied only when parse succeeds and the scheme is `http` or `https` (case-insensitive). `javascript:`, `data:`, `file:`, `vbscript:`, `blob:`, relative paths, scheme-relative `//host`, and scp-like `git@host:path` are refused. A refusal omits that emitted field (and omits a refused remote from `spec.remotes`) but does **not** fail the transform.

Generic projection SHALL NOT emit a D11-refused URL under any key. That includes refused `websiteUrl`, refused `remotes[].url`, refused `repository.url`, refused `icons[].src`, and any other URL-typed leaf (known fields such as `websiteUrl` / `*.url` / `*.src`, and any scalar that WHATWG-parses as a URL whose protocol is not `http:` or `https:`). Non-URL siblings still project (`remotes[].type`, `icons[].mimeType`, `repository.source` / `id` / `subfolder`). D11-refused URL scalars are a deliberate round-trip exception. Plain non-URL strings (package identifiers, descriptions) are unchanged: a failed absolute-URL parse is not a reason to drop them.

The scheme gate does **not** classify hosts as public vs private and does not treat “internal-looking” as a special case. Fixtures such as `http://localhost:7007/api/mcp/v1` (upstream mcp-server example), `http://10.0.0.5:8080/mcp` (a private-looking IPv4 literal; not a guarantee of operator-internality), and `https://gitlab.internal/org/repo` pass **because** they are absolute `http`/`https`, the same as `https://example.com`. The mapping does not DNS-resolve, fetch, or otherwise dereference any URL. Catalog click-through and later source-location fetches are ingestion/runtime concerns; operators must trust the configured registry. A TEST-NET address (RFC 5737, e.g. `192.0.2.1`) may be used in docs as a reserved example that will not collide with a real VPC; it is not RFC 1918 and is not required by this mapping.

**Alternatives considered:** (a) Denylist only `javascript:`/`data:` — rejected; `file:`/`vbscript:`/`blob:` remain executable or local-file vectors in a catalog UI. (b) Fail the whole mapping on a bad scheme — rejected; one poisoned `websiteUrl` must not drop an otherwise valid server. (c) Block hosts that look private or loopback — rejected; that would require a host classifier this transform does not have, would break the upstream `http://localhost` example, and would still not guarantee operator-internality. (d) Allowlist plus fetch/HEAD to verify the URL — rejected; the transform is side-effect-free (D6) and must not become an SSRF client. (e) Keep a refused `repository.url` on `modelcontextprotocol.io/repository.url` for round-trip — rejected; that annotation is URL-shaped and consumers may treat it as a link. (f) Re-project a refused URL under a different key — rejected; it would still publish `javascript:`/`data:` into searchable annotations. (g) Fall through refused `websiteUrl` / `remotes[].url` to generic projection — rejected; those annotations are still links.

**Rationale:** Emitted URL fields and projected URL annotations are both catalog-visible, searchable strings that consumers may treat as hyperlinks. An allowlist on **every** such emission is the smallest rule that keeps `javascript:`/`data:` (and cousins) out of the entity. Host appearance is out of scope because this is a pure function of registry JSON, not a browser, crawler, or network classifier. `data:` icon URIs are omitted as a consequence of the same allowlist.

### D12: Omit null scalars and empty containers from projection

**Choice:** The annotation projection walker emits only non-null scalar leaves. A scalar whose value is JSON `null` produces no `modelcontextprotocol.io/*` annotation. An empty array (`[]`) or empty object (`{}`) produces no annotations for that subtree and no placeholder annotation for the container itself — the walker does not descend because there are no child nodes. Object properties absent from the source document are not visited. Scalar leaves with value `false`, numeric `0`, or empty string `""` **are** projected, serialized as `"false"`, `"0"`, and `""` respectively. This omission rule does not fail the mapping.

**Alternative considered:** Emit explicit sentinel annotations for `null` or empty containers — rejected; catalog annotations are flat string metadata, and sentinels would bloat entities without aiding discovery.

**Rationale:** Aligns round-trip fidelity with “every **present** non-null scalar leaf” while keeping output sparse. Empty containers carry no scalar leaves to recover. Native-field rules (for example D8’s placeholder `spec.remotes` entry) are separate from this projection rule.

**Round-trip consequence:** Deliberate exception alongside D9 and D11 — `null` scalars and empty containers are not recoverable from the entity.

## Risks / Trade-offs

- **63-char truncation collisions** → Deterministic hash suffix on truncation and on sanitization collisions keeps keys unique; the hash is derived from the full source path so it is stable across runs.
- **`metadata.name` collisions across registries** (same name+version from two registries under the default prefix) → Out of scope here (no dedup). The caller-overridable prefix is the ingestion-layer lever for per-source namespacing; documented so the future ingestion change can supply distinct prefixes or otherwise dedup. Within a single `(prefix, name, version)` the per-input hash-suffix rule (lossy sanitization or truncation) keeps that identity stable and distinct from a different unsanitized triple that happens to share a sanitized stem.
- **Draft schema drift** → D7 fail-open projection; the mapping table is versioned against the draft and revisited when the schema changes.
- **Lossy flattening of deep `packages[]` config** → Accepted; runtime package details are preserved as scalar-leaf annotations for discoverability, not interpreted. Round-trip fidelity is guaranteed only for scalar leaves.
- **Secret leakage into searchable annotations** (remote `headers`/`variables`, `environmentVariables` carrying `default`/`value`/`choices`) → D9 prunes the `default`/`value`/`choices` leaves of any `isSecret: true` input from projection. This is a deliberate carve-out from scalar round-trip fidelity — those leaves are intentionally unrecoverable from the entity. Non-secret metadata on the same input still projects, so discoverability is preserved.
- **Upstream shape may change** (RFC #32062 could reintroduce `spec.definition` or formalize `spec.remotes` in the base schema) → The target shape is isolated to `mcp-registry-server-mapping`; a shape change is a localized spec/mapping update.
- **Unknown or exotic SCM browse URLs** → Hosts not in the `github`/`gitlab`/`bitbucket`/`azure-devops` template set get a path-join fallback that may 404 as a web browse URL; `repository.source` and `repository.subfolder` are still projected so a later ingestion change can specialize. `HEAD` is used instead of guessing `main`; a host that does not honor `HEAD` in browse URLs still has a deterministic, ref-correct target.
- **Catalog UI click-through to `http`/`https` URLs** → D11 copies every passing `http`/`https` URL, including hosts that look private (`localhost`, `10.0.0.5`, `gitlab.internal`). The mapping does not know or guarantee internality and never fetches those URLs; a later provider or the catalog UI might. Operators must treat the configured registry as trusted. `javascript:`/`data:` never land in native URL fields **or** projected annotations. D11-refused URL scalars are a round-trip exception.

## Migration Plan

Not applicable — new capabilities with no existing data or behavior to migrate. The mapping is additive and has no runtime deployment surface of its own until a future ingestion change consumes it.

## Open Questions

- Should the mapping optionally map the reverse-DNS namespace (portion before `/` in `server.json` `name`) to `metadata.namespace`, or keep a single default namespace? Deferred to the ingestion change, where entity-ref implications are clearer. Cross-registry uniqueness can already be approached via a per-source prefix override (D4) without introducing `metadata.namespace`.
- Cross-registry dedup/merge of the same server (same name+version from multiple registries) — deferred to the ingestion change.
