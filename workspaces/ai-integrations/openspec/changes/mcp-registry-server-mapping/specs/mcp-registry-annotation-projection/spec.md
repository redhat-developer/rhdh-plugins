## MCP Registry Annotation Projection

This capability defines the fallback that captures every `server.json` attribute which has no native home in the `mcp-server` `API` entity shape (see `mcp-registry-server-mapping`). Such attributes are projected into entity annotations under the `modelcontextprotocol.io/` prefix, keyed by the attribute's path within the source document.

Attribute paths are encoded in **dot-separated** form as `modelcontextprotocol.io/attribute.tree.to.leaf`. Because Backstage annotation keys permit exactly one `/` (separating the DNS-style prefix from the name segment) and limit the name segment to a restricted character set and 63 characters, the name segment is sanitized and length-bounded so every produced key is catalog-valid.

---

## ADDED Requirements

### Requirement: Project unmapped server.json attributes into modelcontextprotocol.io annotations

Every scalar leaf in the `server.json` document that is not consumed by a native field mapping SHALL be projected into an entity annotation whose key is `modelcontextprotocol.io/<path>`, where `<path>` identifies the attribute's location in the source document. Attributes that the direct mapping already places in a native field or a dedicated annotation SHALL NOT be re-projected by this fallback. Projection SHALL NOT emit a URL that fails the emitted-URL scheme policy (D11) under any key — including refused `websiteUrl`, `repository.url`, `remotes[].url`, `icons[].src`, and any other URL-typed leaf. Non-URL siblings of a refused URL (for example `remotes[].type`, `icons[].mimeType`, `repository.source`) SHALL still project.

#### Scenario: Unmapped scalar becomes an annotation

- **WHEN** a `server.json` carries a scalar with no native home, such as `icons[0].mimeType: image/png`
- **THEN** the entity has an annotation `modelcontextprotocol.io/icons.0.mimeType` with value `image/png`

#### Scenario: Natively-mapped attributes are not re-projected

- **WHEN** a `server.json` carries `remotes[].type`/`url` that were copied into `spec.remotes`, `name` (mapped to `modelcontextprotocol.io/name` and `metadata.name`), `version` (mapped to `modelcontextprotocol.io/version`), `title`/`description` (mapped to `metadata`), `websiteUrl` that was copied into `metadata.links`, and `repository.url` that was copied into `metadata.links`, `backstage.io/source-location`, and the dedicated `modelcontextprotocol.io/repository.url` annotation
- **THEN** those attributes are not additionally emitted as generic `modelcontextprotocol.io/*` projected annotations, and the generic projection does not overwrite or re-derive the direct-mapping `backstage.io/source-location` or `modelcontextprotocol.io/repository.url` annotations

#### Scenario: Refused URLs are not projected

- **WHEN** `websiteUrl`, `remotes[].url`, `repository.url`, or `icons[].src` is refused by the emitted-URL scheme policy (for example `javascript:` or `data:`)
- **THEN** no `modelcontextprotocol.io/*` annotation carries that URL, and non-URL siblings of the same object still project

#### Scenario: Refused repository.url is not re-projected onto the dedicated key

- **WHEN** `repository.url` is refused by the emitted-URL scheme policy (for example `javascript:`, `data:`, or `git@github.com:org/repo.git`)
- **THEN** no `modelcontextprotocol.io/repository.url` annotation is emitted, generic projection does not recreate that key, and remaining `repository` sub-fields (`source`, `id`, `subfolder`) still project

### Requirement: Encode nested paths as dot-separated segments within a single-slash key

Nested object keys and array indices SHALL be encoded as dot-separated segments in the annotation key's name portion, appended to the single `modelcontextprotocol.io/` prefix. Object keys contribute their key name; array elements contribute their zero-based numeric index. Only scalar leaves are emitted as annotation values, serialized as strings; container nodes (objects, arrays) are traversed rather than emitted.

#### Scenario: Nested object key path

- **WHEN** a `server.json` carries `repository.source: github`
- **THEN** the entity has an annotation `modelcontextprotocol.io/repository.source` with value `github`

#### Scenario: Array element index path

- **WHEN** a `server.json` carries `packages[0].identifier: "@scope/pkg"`
- **THEN** the entity has an annotation `modelcontextprotocol.io/packages.0.identifier` with value `@scope/pkg`

#### Scenario: Deeply nested leaf under an array

- **WHEN** a `server.json` carries `remotes[1].headers[0].name: Authorization`
- **THEN** the entity has an annotation `modelcontextprotocol.io/remotes.1.headers.0.name` with value `Authorization`

#### Scenario: Scalar values are serialized as strings

- **WHEN** a projected leaf is a non-string scalar such as a boolean or number (e.g. `packages[0].environmentVariables[0].isSecret: true`)
- **THEN** the annotation value is the string form of that scalar (e.g. `true`)

### Requirement: Produce catalog-valid annotation keys

Every projected annotation key SHALL be valid for the Backstage catalog: the name segment SHALL contain only allowed characters (alphanumerics plus `-`, `_`, `.`), SHALL begin and end with an alphanumeric character, and SHALL be at most 63 characters. Sanitization SHALL be applied to each object-key segment in the dot path before segments are joined (array index segments are unchanged decimal numerals). For each object-key segment the mapping SHALL lowercase the segment; replace every character outside `a-z`, `0-9`, `.`, `_`, and `-` with a single ASCII hyphen (`-`); and if the segment begins with `_`, replace that leading `_` with `x`. Keys whose full name segment would exceed 63 characters SHALL be truncated and suffixed with a stable hash so they remain valid and unique.

#### Scenario: Illegal characters in a path are sanitized

- **WHEN** a `server.json` carries a `_meta` object whose nested key contains a `/` (e.g. `_meta."io.modelcontextprotocol.registry/publisher-provided".x`)
- **THEN** the projected annotation key is `modelcontextprotocol.io/xmeta.io.modelcontextprotocol.registry-publisher-provided.x` (leading `_` on `_meta` → `xmeta`; `/` in the nested key → `-`)

#### Scenario: Over-length key is truncated with a stable suffix

- **WHEN** a projected path's name segment would exceed 63 characters
- **THEN** the mapping truncates it and appends a deterministic hash suffix derived from the full path, keeping the key ≤63 characters

#### Scenario: Sanitization collisions are disambiguated

- **WHEN** two distinct source paths sanitize to the same annotation key
- **THEN** the mapping appends a deterministic hash suffix so each source path maps to a distinct key

### Requirement: Do not overwrite reserved or previously-set annotations

Projection SHALL NOT overwrite annotations set by the direct mapping (for example `modelcontextprotocol.io/name`, `modelcontextprotocol.io/version`, `modelcontextprotocol.io/repository.url`, `backstage.io/source-location`) or any other reserved annotation. When a source scalar was already consumed by the direct mapping, generic projection SHALL NOT emit a second annotation for that same source path (the direct-mapping value wins; no overwrite). When a **distinct** source path sanitizes to the same annotation key as a reserved or direct-mapping annotation, the direct-mapping (or reserved) value SHALL remain unchanged and the distinct path SHALL still project under a D3 hash-suffix-disambiguated key derived from the full source path so scalar round-trip fidelity is preserved.

#### Scenario: Direct-mapping annotation wins without re-projection

- **WHEN** generic projection would re-emit a scalar already consumed by the direct mapping (for example the top-level `name` leaf that produced `modelcontextprotocol.io/name`)
- **THEN** the direct-mapping annotation is retained, generic projection does not overwrite it, and no duplicate `modelcontextprotocol.io/*` annotation is emitted for that source path

#### Scenario: Distinct path that sanitizes to a reserved key is hash-disambiguated

- **WHEN** a scalar at a source path distinct from any natively-mapped field would sanitize to the same annotation key as a reserved direct-mapping annotation (for example `modelcontextprotocol.io/name`)
- **THEN** the reserved annotation value is unchanged, and the distinct source scalar is projected under a hash-suffix-disambiguated `modelcontextprotocol.io/*` key so it remains recoverable

### Requirement: Redact secret-flagged input values

An `Input` object in `server.json` (as used by `packages[].environmentVariables[]`, `remotes[].headers[]`, `remotes[].variables`, and package/runtime arguments) MAY declare `isSecret: true`. When an input object declares `isSecret: true`, the projection SHALL prune (omit) that object's `default`, `value`, and `choices` leaves (including every `choices[]` element) — those values SHALL NOT appear in any `modelcontextprotocol.io/*` annotation. All non-secret sibling leaves of the same input (for example `name`, `description`, `format`, `isRequired`, `isSecret`, `placeholder`) SHALL continue to project normally. This redaction applies uniformly to every `isSecret: true` input regardless of location, not only environment variables.

#### Scenario: Secret environment variable value is pruned

- **WHEN** a `server.json` carries `packages[0].environmentVariables[0]` with `isSecret: true` and a populated `default` (or `value`)
- **THEN** no `modelcontextprotocol.io/*` annotation carries that `default`/`value`, while the input's non-secret leaves (e.g. `packages.0.environmentVariables.0.name`, `.isSecret`, `.description`) are still projected

#### Scenario: Secret input choices are pruned

- **WHEN** a `server.json` carries an `isSecret: true` input with a populated `choices` array (for example `["tok_live_aaa", "tok_live_bbb"]`)
- **THEN** no `modelcontextprotocol.io/*` annotation carries any `choices` element, while non-secret siblings such as `name` and `isSecret` still project

#### Scenario: Secret remote header/variable value is pruned

- **WHEN** a `remotes[].headers[]` or `remotes[].variables` input declares `isSecret: true` with a populated `default`/`value` or `choices`
- **THEN** that `default`/`value`/`choices` is omitted from all annotations, and the redaction behaves identically to the environment-variable case (uniform across input locations)

#### Scenario: Non-secret input value is retained

- **WHEN** an input object has `isSecret: false` or omits `isSecret`, with a populated `default`/`value` or `choices`
- **THEN** that `default`/`value`/`choices` is projected into a `modelcontextprotocol.io/*` annotation as normal

### Requirement: Omit null scalars and empty containers from projection

The projection walker SHALL NOT emit a `modelcontextprotocol.io/*` annotation for a scalar whose value is JSON `null`. When an array or object node is empty (`[]` or `{}`), the walker SHALL NOT emit annotations for that subtree and SHALL NOT synthesize a placeholder annotation for the empty container. Object properties absent from the source document are not visited. Scalar leaves with value `false`, numeric `0`, or empty string `""` SHALL be projected and serialized as `"false"`, `"0"`, and `""` respectively. Omission under this rule SHALL NOT cause the mapping to fail.

#### Scenario: Null scalar is not projected

- **WHEN** a `server.json` carries a scalar leaf with value `null` (for example `repository.id: null`)
- **THEN** no `modelcontextprotocol.io/*` annotation is emitted for that leaf and the mapping still succeeds

#### Scenario: Empty array or object produces no annotations

- **WHEN** a `server.json` carries an empty array or empty object (for example `icons: []` or `packages[0].environmentVariables: []`)
- **THEN** no `modelcontextprotocol.io/*` annotations are emitted for that container or its descendants, and the mapping still succeeds

#### Scenario: Falsy but present scalars are still projected

- **WHEN** a projected scalar leaf is `false`, `0`, or `""`
- **THEN** the annotation value is the string form of that scalar (`"false"`, `"0"`, or `""`)

### Requirement: Scalar round-trip fidelity

Every scalar leaf present in the source `server.json` SHALL be recoverable from the produced entity — either from a native field or from a projected annotation — **except** the `default`/`value`/`choices` leaves of `isSecret: true` inputs, which are intentionally redacted per "Redact secret-flagged input values"; any URL refused by the emitted-URL scheme policy, which is omitted from emitted URL fields and from all `modelcontextprotocol.io/*` annotations; and scalars or containers omitted per "Omit null scalars and empty containers from projection". Every other non-redacted, non-D11-refused-URL scalar leaf SHALL be represented.

#### Scenario: All scalar leaves are recoverable

- **WHEN** a `server.json` with populated `packages`, `repository`, `icons`, and `_meta` is mapped and those URL leaves pass the emitted-URL scheme policy
- **THEN** every non-null, non-redacted, non-D11-refused scalar leaf from those sections is present either in a native entity field or in a `modelcontextprotocol.io/*` annotation, so the source values can be reconstructed

#### Scenario: Original repository.url is recoverable unnormalized

- **WHEN** a `server.json` provides `repository.url` `https://github.com/org/repo.git/`
- **THEN** that exact scalar is recoverable from `modelcontextprotocol.io/repository.url`; reconstructing it from the normalized Source Code link or `backstage.io/source-location` is not required and MUST NOT be the only representation

#### Scenario: Refused URLs are exempt from round-trip

- **WHEN** a `server.json` provides `websiteUrl` `javascript:alert(1)`, `repository.url` `data:text/html,x`, or `icons[0].src` `javascript:alert(1)`
- **THEN** the absence of those scalars from `metadata.links`, `backstage.io/source-location`, `spec.remotes`, and all `modelcontextprotocol.io/*` annotations does NOT violate round-trip fidelity, because D11 refusal of URL scalars is a documented exception

#### Scenario: Redacted secret leaves are exempt from round-trip

- **WHEN** a `server.json` carries an `isSecret: true` input with a populated `default`/`value` or `choices`
- **THEN** the absence of that `default`/`value`/`choices` from the entity does NOT violate round-trip fidelity, because secret redaction is a documented exception

#### Scenario: Nulls and empty containers are omitted from round-trip

- **WHEN** a `server.json` attribute is `null` or an empty array/object
- **THEN** it is omitted from annotations per "Omit null scalars and empty containers from projection", its absence from the entity does not violate scalar round-trip fidelity, and the mapping does not fail
