## MCP Registry Annotation Projection

This capability defines the fallback that captures every `server.json` attribute which has no native home in the `mcp-server` `API` entity shape (see `mcp-registry-server-mapping`). Such attributes are projected into entity annotations under the `modelcontextprotocol.io/` prefix, keyed by the attribute's path within the source document.

Attribute paths are encoded in **dot-separated** form as `modelcontextprotocol.io/attribute.tree.to.leaf`. Because Backstage annotation keys permit exactly one `/` (separating the DNS-style prefix from the name segment) and limit the name segment to a restricted character set and 63 characters, the name segment is sanitized and length-bounded so every produced key is catalog-valid.

---

## ADDED Requirements

### Requirement: Project unmapped server.json attributes into modelcontextprotocol.io annotations

Every scalar leaf in the `server.json` document that is not consumed by a native field mapping SHALL be projected into an entity annotation whose key is `modelcontextprotocol.io/<path>`, where `<path>` identifies the attribute's location in the source document. Attributes that the direct mapping already places in a native field or a dedicated annotation SHALL NOT be re-projected by this fallback.

#### Scenario: Unmapped scalar becomes an annotation

- **WHEN** a `server.json` carries a scalar with no native home, such as `icons[0].mimeType: image/png`
- **THEN** the entity has an annotation `modelcontextprotocol.io/icons.0.mimeType` with value `image/png`

#### Scenario: Natively-mapped attributes are not re-projected

- **WHEN** a `server.json` carries `remotes[].type`/`url` (mapped to `spec.remotes`), `name` (mapped to `modelcontextprotocol.io/name` and `metadata.name`), `version` (mapped to `modelcontextprotocol.io/version`), `title`/`description` (mapped to `metadata`), and `websiteUrl`/`repository.url` (mapped to `metadata.links`, with `repository.url` also to the `backstage.io/source-location` annotation)
- **THEN** those attributes are not additionally emitted as generic `modelcontextprotocol.io/*` projected annotations, and the generic projection does not overwrite or re-derive the direct-mapping `backstage.io/source-location` annotation

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

Every projected annotation key SHALL be valid for the Backstage catalog: the name segment SHALL contain only allowed characters (alphanumerics plus `-`, `_`, `.`), SHALL begin and end with an alphanumeric character, and SHALL be at most 63 characters. Path segments containing characters outside this set (for example `/`, `$`, `@`, whitespace, or a leading `_` as in `_meta`) SHALL be sanitized deterministically, and keys whose name segment would exceed 63 characters SHALL be truncated and suffixed with a stable hash so they remain valid and unique.

#### Scenario: Illegal characters in a path are sanitized

- **WHEN** a `server.json` carries a `_meta` object whose nested key contains a `/` (e.g. `_meta."io.modelcontextprotocol.registry/publisher-provided".x`)
- **THEN** the projected annotation key replaces the leading underscore and the embedded `/` with allowed characters so the resulting `modelcontextprotocol.io/<segment>` key is catalog-valid

#### Scenario: Over-length key is truncated with a stable suffix

- **WHEN** a projected path's name segment would exceed 63 characters
- **THEN** the mapping truncates it and appends a deterministic hash suffix derived from the full path, keeping the key ≤63 characters

#### Scenario: Sanitization collisions are disambiguated

- **WHEN** two distinct source paths sanitize to the same annotation key
- **THEN** the mapping appends a deterministic hash suffix so each source path maps to a distinct key

### Requirement: Do not overwrite reserved or previously-set annotations

Projection SHALL NOT overwrite annotations set by the direct mapping (for example `modelcontextprotocol.io/name`, `modelcontextprotocol.io/version`) or any other reserved annotation. If a generic projected key would collide with such an annotation, the direct-mapping value SHALL win and the projection SHALL be skipped or disambiguated.

#### Scenario: Direct-mapping annotation wins

- **WHEN** a generic projection would produce a `modelcontextprotocol.io/name` key that collides with the canonical-name annotation set by the direct mapping
- **THEN** the direct-mapping value is retained and the generic projection does not overwrite it

### Requirement: Redact secret-flagged input values

An `Input` object in `server.json` (as used by `packages[].environmentVariables[]`, `remotes[].headers[]`, `remotes[].variables`, and package/runtime arguments) MAY declare `isSecret: true`. When an input object declares `isSecret: true`, the projection SHALL prune (omit) that object's `default` and `value` leaves — those values SHALL NOT appear in any `modelcontextprotocol.io/*` annotation. All non-secret sibling leaves of the same input (for example `name`, `description`, `format`, `isRequired`, `isSecret`, `choices`) SHALL continue to project normally. This redaction applies uniformly to every `isSecret: true` input regardless of location, not only environment variables.

#### Scenario: Secret environment variable value is pruned

- **WHEN** a `server.json` carries `packages[0].environmentVariables[0]` with `isSecret: true` and a populated `default` (or `value`)
- **THEN** no `modelcontextprotocol.io/*` annotation carries that `default`/`value`, while the input's non-secret leaves (e.g. `packages.0.environmentVariables.0.name`, `.isSecret`, `.description`) are still projected

#### Scenario: Secret remote header/variable value is pruned

- **WHEN** a `remotes[].headers[]` or `remotes[].variables` input declares `isSecret: true` with a populated `default`/`value`
- **THEN** that `default`/`value` is omitted from all annotations, and the redaction behaves identically to the environment-variable case (uniform across input locations)

#### Scenario: Non-secret input value is retained

- **WHEN** an input object has `isSecret: false` or omits `isSecret`, with a populated `default`/`value`
- **THEN** that `default`/`value` is projected into a `modelcontextprotocol.io/*` annotation as normal

### Requirement: Scalar round-trip fidelity

Every scalar leaf present in the source `server.json` SHALL be recoverable from the produced entity — either from a native field or from a projected annotation — **except** the `default`/`value` leaves of `isSecret: true` inputs, which are intentionally redacted per "Redact secret-flagged input values". Null values and empty containers MAY be omitted per a documented rule; every non-null, non-redacted scalar SHALL be represented.

#### Scenario: All scalar leaves are recoverable

- **WHEN** a `server.json` with populated `packages`, `repository`, `icons`, and `_meta` is mapped
- **THEN** every non-null, non-redacted scalar leaf from those sections is present either in a native entity field or in a `modelcontextprotocol.io/*` annotation, so the source values can be reconstructed

#### Scenario: Redacted secret leaves are exempt from round-trip

- **WHEN** a `server.json` carries an `isSecret: true` input with a populated `default`/`value`
- **THEN** the absence of that `default`/`value` from the entity does NOT violate round-trip fidelity, because secret redaction is a documented exception

#### Scenario: Nulls and empty containers follow the documented omission rule

- **WHEN** a `server.json` attribute is `null` or an empty array/object
- **THEN** it is omitted from the annotations per the documented rule, and its omission does not cause the mapping to fail
