## MCP Registry Server Mapping

This capability defines the deterministic, idempotent transform from a single MCP registry `server.json` document (conforming to the draft [`server.schema.json`](https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json)) into a single Backstage `API` entity with `spec.type: mcp-server`.

The target entity shape follows the upstream Backstage mcp-server example ([`backstage-mcp-server-api.yaml`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml)): `apiVersion: backstage.io/v1alpha1`, `kind: API`, `metadata` (`name`, `title`, `description`, `tags`, `links`, `annotations`), and `spec` (`type: mcp-server`, `lifecycle`, `owner`, top-level `remotes[]` with `type` + `url`). No `spec.definition` is emitted — top-level `spec.remotes[]` replaces it.

`server.json` attributes without a native home in this shape are handed to `mcp-registry-annotation-projection`. This spec covers only the direct (native-field) mapping and the supply of catalog-required fields absent from the source.

---

## ADDED Requirements

### Requirement: Transform a server.json document into a valid mcp-server API entity

The mapping SHALL transform one `server.json` document into one `API` entity with `apiVersion: backstage.io/v1alpha1`, `kind: API`, and `spec.type: mcp-server`, such that the produced entity passes the upstream Backstage `mcp-server` `API` entity schema (`McpServerApiEntity`), which for `spec.type: mcp-server` requires `spec.remotes` and does not include `spec.definition` — overriding the generic base `API` schema. When the source omits a `server.json`-required field (`name`, `description`, or `version`), the mapping SHALL fail with an actionable error that names the missing field and references the MCP server schema, rather than emitting a partial entity.

#### Scenario: Minimal valid server.json produces a valid entity

- **WHEN** the mapping receives a `server.json` with `name`, `description`, `version`, and one `remotes` entry (`type: streamable-http`, valid `url`)
- **THEN** it produces an `API` entity with `kind: API`, `spec.type: mcp-server`, `spec.lifecycle` (`production` when no caller override is supplied), `spec.owner` (`unknown` when no caller override is supplied), and a top-level `spec.remotes` entry carrying that `type` and `url`, and the entity passes the upstream `mcp-server` `API` entity schema (`McpServerApiEntity`) validation

#### Scenario: Missing required source field fails the mapping

- **WHEN** the input `server.json` omits a required field such as `name`, `description`, or `version`
- **THEN** the mapping fails with an error that names the missing field and references the MCP server schema, and no entity is produced

### Requirement: Map remotes to top-level spec.remotes

The mapping SHALL copy each `server.json` `remotes[]` entry's `type` and `url` into a corresponding top-level `spec.remotes[]` entry on the `API` entity, preserving source order. When the source `remotes` is empty or unset, the mapping SHALL emit an empty `spec.remotes: []` array — never an omitted field — so the output stays deterministic and schema-conformant. The mapping SHALL NOT emit a `spec.definition` field. Remote sub-fields that are not part of the native `spec.remotes` shape (`headers`, `variables`) SHALL be handed to `mcp-registry-annotation-projection` rather than dropped.

#### Scenario: Remotes copied in order

- **WHEN** a `server.json` declares multiple `remotes` entries
- **THEN** `spec.remotes` contains one entry per source remote, in the same order, each with the source `type` and `url`, and no `spec.definition` is present

#### Scenario: Remote headers and variables are projected, not dropped

- **WHEN** a `remotes` entry carries `headers` or `variables`
- **THEN** the native `spec.remotes` entry contains only `type` and `url`, and the `headers`/`variables` are projected into `modelcontextprotocol.io/*` annotations keyed by the remote's index

#### Scenario: Server with no remotes

- **WHEN** a `server.json` declares no `remotes` (only local `packages`)
- **THEN** the entity is still produced with an empty `spec.remotes: []` (not omitted), remains valid, and the `packages` are projected into annotations

### Requirement: Derive a version-unique metadata.name and preserve the canonical name and version

A registry publishes one `server.json` per server version, and each version becomes its own `API` entity; a `metadata.name` derived from the canonical name alone would therefore collide across versions in the catalog. The `server.json` `name` is also a reverse-DNS identifier (`namespace/server`) that is not itself a valid Backstage `metadata.name`. The mapping SHALL derive `metadata.name` as `<name>__<version>` — the sanitized canonical name and the sanitized version joined by a double underscore (`__`) — conforming to the Backstage name character set (lowercase alphanumerics with `-`/`_`/`.`, beginning and ending alphanumeric, ≤63 characters). The mapping SHALL preserve the unmodified canonical name (without the version) in a `modelcontextprotocol.io/name` annotation, and SHALL map the `version` directly to its dedicated `modelcontextprotocol.io/version` annotation so it remains individually queryable.

#### Scenario: Two versions of the same server produce distinct entities

- **WHEN** two `server.json` documents share the canonical name `io.github.user/weather` but declare `version` `1.0.0` and `2.0.0`
- **THEN** the two produced entities have distinct `metadata.name` values (each incorporating its version), each carries the same `modelcontextprotocol.io/name: io.github.user/weather`, and each carries its own `modelcontextprotocol.io/version` (`1.0.0` and `2.0.0` respectively)

#### Scenario: Reverse-DNS name and version are sanitized into metadata.name

- **WHEN** `server.json` `name` is `io.github.user/weather` and `version` is `1.0.2`
- **THEN** `metadata.name` is the sanitized `<name>__<version>` form (e.g. `io.github.user-weather__1.0.2`), the original `io.github.user/weather` is preserved verbatim in `modelcontextprotocol.io/name`, and `1.0.2` is recorded in `modelcontextprotocol.io/version`

#### Scenario: Over-length or colliding names remain unique

- **WHEN** two distinct (name, version) pairs sanitize to the same `<name>__<version>`, or the combined value exceeds the 63-character limit after sanitization
- **THEN** the mapping produces a deterministic, unique `metadata.name` by truncating and appending a stable hash suffix derived from the canonical name and version

### Requirement: Map descriptive metadata to native Backstage fields

The mapping SHALL map `server.json` descriptive attributes to native Backstage `metadata` fields: `title` → `metadata.title`; `description` → `metadata.description`; `websiteUrl` → a `metadata.links` entry whose `url` is the `websiteUrl` and whose `title` is `Website`; and `repository.url` (combined with `repository.subfolder` when present) → a `metadata.links` entry whose `url` references the repository and whose `title` is `Source Code`. The mapping SHALL ALSO emit `repository.url` (combined with `repository.subfolder` when present) as a `backstage.io/source-location` annotation, so the repository is captured both as the canonical Backstage source-location annotation (for source-aware tooling) and as a human-visible source link. The mapping SHALL set `metadata.tags` to include the upstream mcp-server convention tags (`mcp`, `ai`).

#### Scenario: Descriptive fields lift to metadata

- **WHEN** a `server.json` provides `title`, `description`, and `websiteUrl`
- **THEN** the entity has `metadata.title` from `title`, `metadata.description` from `description`, and a `metadata.links` entry whose `url` is `websiteUrl` and whose `title` is `Website`

#### Scenario: Repository maps to a source link and a source-location annotation

- **WHEN** a `server.json` provides `repository.url` and `repository.subfolder`
- **THEN** the entity has a `metadata.links` entry whose `url` references the repository URL (and subfolder when present) and whose `title` is `Source Code`, a `backstage.io/source-location` annotation carrying the same repository URL (and subfolder when present) is also emitted, and the remaining `repository` sub-fields (`source`, `id`) are projected into `modelcontextprotocol.io/*` annotations

#### Scenario: mcp-server tags applied

- **WHEN** any `server.json` is mapped
- **THEN** `metadata.tags` includes `mcp` and `ai`

### Requirement: Supply catalog-required fields absent from server.json

`server.json` does not carry a Backstage owner or lifecycle. The mapping SHALL set `spec.owner` to the constant `unknown` when no caller override is supplied, and to a caller-provided default when one is supplied; the mapping SHALL NOT fail for a missing owner. The mapping SHALL set `spec.lifecycle` to the constant `production` when no caller override is supplied, and to a caller-provided default lifecycle when one is supplied; the mapping SHALL NOT fail for a missing lifecycle.

#### Scenario: Owner defaults to unknown

- **WHEN** the mapping is invoked without a caller-provided owner and `server.json` carries no owner information
- **THEN** `spec.owner` is set to `unknown` and the mapping succeeds

#### Scenario: Owner override supplied by caller

- **WHEN** the mapping is invoked with a caller-provided default owner
- **THEN** `spec.owner` is set to that owner value

#### Scenario: Lifecycle defaults to production

- **WHEN** the mapping is invoked without a caller-provided lifecycle
- **THEN** `spec.lifecycle` is set to `production` and the mapping succeeds

#### Scenario: Lifecycle override supplied by caller

- **WHEN** the mapping is invoked with a caller-provided default lifecycle
- **THEN** `spec.lifecycle` is set to that lifecycle value

### Requirement: Deterministic and idempotent mapping

The mapping SHALL be a pure function of its inputs (the `server.json` document and the caller-provided defaults): given identical inputs it SHALL produce a byte-identical entity, with stable ordering of `spec.remotes`, `metadata.tags`, and annotation keys, and SHALL NOT introduce timestamps, random values, or ingestion-source state.

#### Scenario: Same input yields identical output

- **WHEN** the mapping is run twice on identical inputs
- **THEN** the two produced entities are identical, including annotation key ordering and `spec.remotes` ordering
