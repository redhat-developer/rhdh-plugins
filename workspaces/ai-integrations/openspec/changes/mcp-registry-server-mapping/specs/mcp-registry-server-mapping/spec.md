## MCP Registry Server Mapping

This capability defines the deterministic, idempotent transform from a single MCP registry `server.json` document (conforming to the draft [`server.schema.json`](https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json)) into a single Backstage `API` entity with `spec.type: mcp-server`.

The target entity shape follows the upstream Backstage mcp-server example ([`backstage-mcp-server-api.yaml`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml)): `apiVersion: backstage.io/v1alpha1`, `kind: API`, `metadata` (`name`, `title`, `description`, `tags`, `links`, `annotations`), and `spec` (`type: mcp-server`, `lifecycle`, `owner`, top-level `remotes[]` with `type` + `url`). No `spec.definition` is emitted — top-level `spec.remotes[]` replaces it.

`server.json` attributes without a native home in this shape are handed to `mcp-registry-annotation-projection`. This spec covers only the direct (native-field) mapping and the supply of catalog-required fields absent from the source.

The authoritative **attribute → entity target** table (native field, dedicated annotation, or projected annotation) lives in the change's `mapping-reference.md` deliverable (see `tasks.md`); requirements below define behavior per concern rather than duplicating that table.

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

The mapping SHALL copy each `server.json` `remotes[]` entry's `type` and `url` into a corresponding top-level `spec.remotes[]` entry on the `API` entity, preserving source order of the entries that are copied. A remote `url` is copied only when it passes the "Emitted URL scheme policy" requirement; a refused remote is omitted from `spec.remotes` (it is not copied with a blank `url`). The refused `url` SHALL NOT be projected; non-URL siblings (`type`, `headers`, `variables`) SHALL still be handed to `mcp-registry-annotation-projection`. When the source `remotes` is empty, unset, or every remote is refused, the mapping SHALL emit an empty `spec.remotes: []` array — never an omitted field — so the output stays deterministic and schema-conformant. The mapping SHALL NOT emit a `spec.definition` field. Remote sub-fields that are not part of the native `spec.remotes` shape (`headers`, `variables`) SHALL be handed to `mcp-registry-annotation-projection` rather than dropped, including on remotes that were copied.

#### Scenario: Remotes copied in order

- **WHEN** a `server.json` declares multiple `remotes` entries
- **THEN** `spec.remotes` contains one entry per source remote whose `url` passes the emitted-URL scheme policy, preserving source order among those copied entries, each with the source `type` and `url`, and no `spec.definition` is present

#### Scenario: Remote headers and variables are projected, not dropped

- **WHEN** a `remotes` entry carries `headers` or `variables`
- **THEN** the native `spec.remotes` entry contains only `type` and `url`, and the `headers`/`variables` are projected into `modelcontextprotocol.io/*` annotations keyed by the remote's index

#### Scenario: Server with no remotes

- **WHEN** a `server.json` declares no `remotes` (only local `packages`)
- **THEN** the entity is still produced with an empty `spec.remotes: []` (not omitted), remains valid, and the `packages` are projected into annotations

#### Scenario: Disallowed remote URL scheme is omitted from spec.remotes

- **WHEN** a `remotes` entry has `url` `javascript:alert(1)` (or another non-`http`/`https` scheme such as `data:`)
- **THEN** that entry is omitted from `spec.remotes`, the mapping still succeeds, the refused `url` is not projected, and non-URL siblings such as `type` are projected into `modelcontextprotocol.io/*` annotations

#### Scenario: http(s) URLs with private-looking hosts are still copied

- **WHEN** a `remotes` entry has `url` `http://localhost:7007/api/mcp/v1` or `http://10.0.0.5:8080/mcp`
- **THEN** `spec.remotes` contains that `type` and `url` unchanged; the mapping copies them because the scheme is `http`, not because it classified the host as internal or RFC 1918

### Requirement: Derive a version-unique metadata.name and preserve the canonical name and version

A registry publishes one `server.json` per server version, and each version becomes its own `API` entity; a `metadata.name` derived from the canonical name alone would therefore collide across versions in the catalog. The `server.json` `name` is also a reverse-DNS identifier (`namespace/server`) that is not itself a valid Backstage `metadata.name`. The mapping SHALL derive `metadata.name` as `<prefix>__<name>__<version>` — the sanitized prefix, the sanitized canonical name, and the sanitized version joined by a double underscore (`__`) — conforming to the Backstage name character set (lowercase alphanumerics with `-`/`_`/`.`, beginning and ending alphanumeric, ≤63 characters). Each identity segment (prefix, canonical `name`, `version`) SHALL be sanitized with the same algorithm as annotation object-key segments: lowercase; replace every character outside `a-z`, `0-9`, `.`, `_`, and `-` with `-`; if the segment begins with `_`, replace that leading `_` with `x` (for example `/` in `io.github.user/weather` → `-`). The prefix SHALL be the constant `mcp.registry` when no caller override is supplied; a caller MAY supply an override default prefix. When the override is unset, empty, or sanitizes to empty, the mapping SHALL use `mcp.registry` and SHALL NOT fail. After joining, the mapping SHALL append a stable hash suffix derived from the effective prefix, the unmodified canonical name, and the unmodified version whenever **either** sanitization mutates any identity segment (the sanitized segment differs from the source segment) **or** the joined candidate exceeds 63 characters. When the hash is applied, the mapping SHALL truncate the candidate stem as needed so the final `metadata.name` remains ≤63 characters. When sanitization does not mutate any segment and the candidate is ≤63 characters, the mapping SHALL emit the candidate with no hash suffix. This rule is a pure function of one document plus caller defaults; it does not observe other documents. The mapping SHALL preserve the unmodified canonical name (without the version) in a `modelcontextprotocol.io/name` annotation, and SHALL map the `version` directly to its dedicated `modelcontextprotocol.io/version` annotation so it remains individually queryable.

#### Scenario: Two versions of the same server produce distinct entities

- **WHEN** two `server.json` documents share the canonical name `io.github.user/weather` but declare `version` `1.0.0` and `2.0.0`, and no caller prefix override is supplied
- **THEN** the two produced entities have distinct `metadata.name` values (each incorporating the default prefix, its version, and a hash suffix because sanitization replaced `/` in the canonical name), each carries the same `modelcontextprotocol.io/name: io.github.user/weather`, and each carries its own `modelcontextprotocol.io/version` (`1.0.0` and `2.0.0` respectively)

#### Scenario: Reverse-DNS name and version are sanitized into metadata.name with the default prefix

- **WHEN** `server.json` `name` is `io.github.user/weather`, `version` is `1.0.2`, and no caller prefix override is supplied
- **THEN** `metadata.name` is the sanitized `<prefix>__<name>__<version>` stem `mcp.registry__io.github.user-weather__1.0.2` plus a stable hash suffix (sanitization changed the identity), the original `io.github.user/weather` is preserved verbatim in `modelcontextprotocol.io/name`, and `1.0.2` is recorded in `modelcontextprotocol.io/version`

#### Scenario: Already catalog-valid identity is emitted without a hash

- **WHEN** `server.json` `name` is `weather`, `version` is `1.0.2`, and no caller prefix override is supplied
- **THEN** `metadata.name` is `mcp.registry__weather__1.0.2` with no hash suffix (no segment was mutated and the candidate is ≤63 characters)

#### Scenario: Caller prefix override is applied

- **WHEN** the mapping is invoked with a caller-provided default prefix `com.example.registry` and `server.json` `name` is `io.github.user/weather` with `version` `1.0.2`
- **THEN** `metadata.name` is the sanitized stem `com.example.registry__io.github.user-weather__1.0.2` plus a stable hash suffix (sanitization changed the identity)

#### Scenario: Empty prefix override falls back to the default

- **WHEN** the mapping is invoked with a caller-provided prefix that is empty or sanitizes to empty
- **THEN** `metadata.name` uses the default prefix `mcp.registry` and the mapping succeeds

#### Scenario: Over-length identity is truncated with a hash

- **WHEN** the sanitized `<prefix>__<name>__<version>` candidate exceeds 63 characters
- **THEN** the mapping truncates the stem and appends a stable hash suffix derived from the prefix, canonical name, and version so the final `metadata.name` is ≤63 characters

### Requirement: Map descriptive metadata to native Backstage fields

The mapping SHALL map `server.json` descriptive attributes to native Backstage `metadata` fields: `title` → `metadata.title`; `description` → `metadata.description`; `websiteUrl` → a `metadata.links` entry whose `url` is the `websiteUrl` and whose `title` is `Website`, **only when** `websiteUrl` passes the "Emitted URL scheme policy" requirement; and `repository.url` combined with `repository.subfolder` when present (per the repository URL combination algorithm below) → a `metadata.links` entry whose `url` is that combined URL and whose `title` is `Source Code`, **only when** the original `repository.url` passes that policy. The mapping SHALL ALSO emit the same combined URL as a `backstage.io/source-location` annotation whose value MUST use the `url:` format (`url:<combined-url>`), so the repository is captured both as the canonical Backstage source-location annotation (for source-aware tooling) and as a human-visible source link — again only when `repository.url` passes the policy. Independently of that combination, when `repository.url` is present **and** passes the policy, the mapping SHALL copy the original `repository.url` scalar **verbatim** (no trailing-`/` or `.git` strip, no subfolder join, no scheme rewrite) into a dedicated `modelcontextprotocol.io/repository.url` annotation so the source value remains recoverable after combination-base normalization. A refused `websiteUrl` SHALL NOT produce a Website `metadata.links` entry and SHALL NOT be projected. A refused `repository.url` SHALL NOT produce a Source Code link, a `backstage.io/source-location` annotation, or a `modelcontextprotocol.io/repository.url` annotation, and SHALL NOT be re-projected onto that annotation key. The mapping SHALL set `metadata.tags` to include the upstream mcp-server convention tags (`mcp`, `ai`).

The [`server.json` `repository` object](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/draft/server.schema.json) supplies a repository-root `url` (browse and git clone), a hosting-service `source` identifier, and an optional `subfolder` that is a clean relative path from the repository root. It does not supply a git branch or ref. The mapping therefore MUST NOT invent a branch name such as `main`. The mapping SHALL compute the combined repository URL as follows:

1. **Normalize the base URL (for combination only).** Let `base` be `repository.url` with any trailing `/` removed and with a trailing `.git` suffix removed when present. This normalization applies only to the combined Source Code / `backstage.io/source-location` URL; it SHALL NOT alter the dedicated `modelcontextprotocol.io/repository.url` annotation.
2. **Absent subfolder.** When `repository.subfolder` is unset or empty after trimming whitespace, the combined URL is `base`. No tree/src/browse segment is inserted.
3. **Normalize the subfolder.** Let `subfolder` be `repository.subfolder` with leading and trailing `/` characters removed. The mapping SHALL treat it as `/`-separated relative path segments and SHALL NOT resolve `.` or `..` segments.
4. **Select a browse-path template from `repository.source`** (compared case-insensitively) so subdirectory URLs remain valid across SCMs. Templates that require a ref SHALL use the git symbolic ref `HEAD` (the repository default branch):
   - `github` → `{base}/tree/HEAD/{subfolder}`
   - `gitlab` → `{base}/-/tree/HEAD/{subfolder}`
   - `bitbucket` → `{base}/src/HEAD/{subfolder}`
   - `azure-devops` → `{base}` with query parameter `path=/{subfolder}` (use `?` when `base` has no query string, otherwise `&`; do not invent a `version`/`GB*` ref)
   - any other or unset `source` → `{base}/{subfolder}` (path join). This fallback MAY not be a clickable browse URL on the hosting platform; `repository.source` and `repository.subfolder` remain projected as `modelcontextprotocol.io/*` annotations so a consumer can reconstruct a host-specific URL.
5. **Emit (when the original `repository.url` passes the emitted-URL scheme policy).** The `Source Code` `metadata.links` entry `url` is the combined URL. The `backstage.io/source-location` value is `url:` concatenated with the combined URL. The dedicated `modelcontextprotocol.io/repository.url` annotation is the original `repository.url` scalar, unnormalized. When the policy fails, none of those three fields are emitted.

`repository.url` is treated as the repository root, matching the MCP schema; the mapping SHALL NOT parse or strip an existing `/tree/<ref>/` (or equivalent) prefix from it.

#### Scenario: Descriptive fields lift to metadata

- **WHEN** a `server.json` provides `title`, `description`, and `websiteUrl` that passes the emitted-URL scheme policy
- **THEN** the entity has `metadata.title` from `title`, `metadata.description` from `description`, and a `metadata.links` entry whose `url` is `websiteUrl` and whose `title` is `Website`

#### Scenario: GitHub repository subfolder uses the GitHub tree path with HEAD

- **WHEN** a `server.json` provides `repository.url` `https://github.com/modelcontextprotocol/servers`, `repository.source` `github`, and `repository.subfolder` `src/everything`
- **THEN** the entity has a `metadata.links` entry whose `url` is `https://github.com/modelcontextprotocol/servers/tree/HEAD/src/everything` and whose `title` is `Source Code`, a `backstage.io/source-location` annotation `url:https://github.com/modelcontextprotocol/servers/tree/HEAD/src/everything`, a dedicated `modelcontextprotocol.io/repository.url` annotation equal to the original `https://github.com/modelcontextprotocol/servers`, and the remaining `repository` sub-fields (`source`, `id`, `subfolder`) projected into `modelcontextprotocol.io/*` annotations

#### Scenario: GitLab repository subfolder uses the GitLab tree path with HEAD

- **WHEN** a `server.json` provides `repository.url` `https://gitlab.com/group/repo`, `repository.source` `gitlab`, and `repository.subfolder` `servers/weather`
- **THEN** the `Source Code` link URL and the `backstage.io/source-location` target (the portion after `url:`) are both `https://gitlab.com/group/repo/-/tree/HEAD/servers/weather`

#### Scenario: Bitbucket repository subfolder uses the Bitbucket src path with HEAD

- **WHEN** a `server.json` provides `repository.url` `https://bitbucket.org/org/repo`, `repository.source` `bitbucket`, and `repository.subfolder` `src/server`
- **THEN** the `Source Code` link URL and the `backstage.io/source-location` target are both `https://bitbucket.org/org/repo/src/HEAD/src/server`

#### Scenario: Azure DevOps repository subfolder uses a path query parameter

- **WHEN** a `server.json` provides `repository.url` `https://dev.azure.com/org/project/_git/repo`, `repository.source` `azure-devops`, and `repository.subfolder` `src/server`
- **THEN** the `Source Code` link URL and the `backstage.io/source-location` target are both `https://dev.azure.com/org/project/_git/repo?path=/src/server`

#### Scenario: Unknown SCM falls back to path join

- **WHEN** a `server.json` provides `repository.url` `https://git.example.com/org/repo`, `repository.source` `gerrit`, and `repository.subfolder` `src/server`
- **THEN** the `Source Code` link URL and the `backstage.io/source-location` target are both `https://git.example.com/org/repo/src/server`

#### Scenario: Repository without subfolder uses the base URL

- **WHEN** a `server.json` provides `repository.url` `https://github.com/org/repo` and no `repository.subfolder`
- **THEN** the `Source Code` link URL and the `backstage.io/source-location` target are both `https://github.com/org/repo`, with no `/tree/HEAD` segment inserted, and `modelcontextprotocol.io/repository.url` is `https://github.com/org/repo`

#### Scenario: Original repository.url is preserved unnormalized

- **WHEN** a `server.json` provides `repository.url` `https://github.com/org/repo.git/` (trailing `.git` and `/`)
- **THEN** `modelcontextprotocol.io/repository.url` is exactly `https://github.com/org/repo.git/`, while the `Source Code` link URL and the `backstage.io/source-location` target use the normalized base `https://github.com/org/repo`

#### Scenario: javascript: websiteUrl is not copied into metadata.links or annotations

- **WHEN** a `server.json` provides `websiteUrl` `javascript:alert(1)`
- **THEN** no `metadata.links` entry titled `Website` is emitted, the mapping still succeeds, and `websiteUrl` is not projected into a `modelcontextprotocol.io/*` annotation

#### Scenario: data: repository.url is not copied into URL-shaped fields

- **WHEN** a `server.json` provides `repository.url` `data:text/html,<script>alert(1)</script>`
- **THEN** no Source Code `metadata.links` entry, no `backstage.io/source-location` annotation, and no `modelcontextprotocol.io/repository.url` annotation are emitted

#### Scenario: https repository URL with an internal-looking hostname is still copied

- **WHEN** a `server.json` provides `repository.url` `https://gitlab.internal/org/repo` and no `repository.subfolder`
- **THEN** the Source Code link URL, the `backstage.io/source-location` target, and `modelcontextprotocol.io/repository.url` are all `https://gitlab.internal/org/repo`; the mapping copies them because the scheme is `https`, not because it classified the host as internal

#### Scenario: mcp-server tags applied

- **WHEN** any `server.json` is mapped
- **THEN** `metadata.tags` includes `mcp` and `ai`

### Requirement: Emitted URL scheme policy

Before copying a source URL into an **emitted URL field** or projecting it as a `modelcontextprotocol.io/*` annotation, the mapping SHALL gate the candidate on scheme. Emitted URL fields are: `metadata.links[].url`, the target of `backstage.io/source-location` (the substring after `url:`), `spec.remotes[].url`, and `modelcontextprotocol.io/repository.url`. Projection of URL-typed leaves (`websiteUrl`, `repository.url`, `remotes[].url`, `icons[].src`, and any other scalar that WHATWG-parses as a URL whose protocol is not `http:` or `https:`) SHALL use the same gate.

The mapping SHALL trim leading and trailing whitespace, then parse the candidate as an **absolute** URL **without a base URL** (relative paths, scheme-relative `//host`, and scp-like `git@host:path` SHALL fail). The candidate passes only when parse succeeds and the scheme is `http` or `https` (case-insensitive; equivalent to a WHATWG `URL` whose `protocol` is `http:` or `https:`). Schemes such as `javascript:`, `data:`, `file:`, `vbscript:`, and `blob:` SHALL NOT pass. The mapping SHALL NOT fail the transform solely because a candidate was refused. A refused URL SHALL NOT be copied into an emitted URL field and SHALL NOT be projected under any annotation key. Non-URL scalars whose absolute-URL parse fails (for example package identifiers) SHALL still project.

Host appearance SHALL NOT affect the scheme gate. Candidates such as `http://localhost:7007/api/mcp/v1`, `http://10.0.0.5:8080/mcp` (a private-looking IPv4 literal; not a guarantee of operator-internality), and `https://gitlab.internal/org/repo` SHALL pass if and only if they are absolute `http`/`https`, the same as any other host. The mapping SHALL NOT classify hosts as public vs private, SHALL NOT DNS-resolve, fetch, or otherwise dereference any URL, and SHALL NOT omit an emitted URL field because a host looks internal. Trust of registry-supplied URLs is an ingestion-operator concern (the registry is a trusted input to this transform), not a mapping concern. Docs MAY use a TEST-NET address (RFC 5737, e.g. `192.0.2.1`) as a reserved example that will not collide with a real VPC; TEST-NET is not RFC 1918.

#### Scenario: javascript: and data: schemes are refused for emitted URL fields and projection

- **WHEN** a candidate URL uses scheme `javascript:` or `data:` (any casing, including with surrounding whitespace)
- **THEN** that candidate is not copied into `metadata.links`, `backstage.io/source-location`, `spec.remotes[].url`, `modelcontextprotocol.io/repository.url`, or any other `modelcontextprotocol.io/*` annotation

#### Scenario: Non-absolute and scp-like URLs are refused for URL-typed leaves

- **WHEN** a URL-typed leaf (`websiteUrl`, `repository.url`, `remotes[].url`, `icons[].src`) is `/relative/path`, `//evil.example/path`, or `git@github.com:org/repo.git`
- **THEN** that candidate is not copied into an emitted URL field and is not projected as an annotation; remaining non-URL siblings still project

#### Scenario: http(s) URLs with private-looking hosts pass the same scheme gate

- **WHEN** a candidate is `http://localhost:7007/api/mcp/v1`, `http://10.0.0.5:8080/mcp`, or `https://gitlab.internal/org/repo`
- **THEN** the candidate passes the scheme policy because it is absolute `http`/`https`, and is eligible to be copied into the corresponding emitted URL field

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
