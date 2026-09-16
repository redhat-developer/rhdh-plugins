# MCP Registry Server Mapping Reference

## Source Schema Version

This mapping targets the **draft** MCP Registry `server.json` schema:

- **URL:** <https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json>
- **Retrieval date:** 2026-09-16
- **Status:** Draft (pre-1.0)

## Field Mapping Table

Each `server.json` attribute is mapped to one of:

- **Native field** — lifted into `metadata` or `spec` on the Backstage `API` entity
- **Dedicated annotation** — a named `modelcontextprotocol.io/*` annotation set by the direct mapping
- **Projected annotation** — a generic `modelcontextprotocol.io/<dot.path>` annotation set by `mcp-registry-annotation-projection`

| `server.json` attribute | Target               | Entity field / annotation key                                                                                                                                                         | Notes                                                               |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `name`                  | Native + dedicated   | `metadata.name` (sanitized `<prefix>__<name>__<version>`) + `modelcontextprotocol.io/name` (original)                                                                                 | D3 sanitization; D4 identity; hash suffix when mutated or >63 chars |
| `version`               | Dedicated annotation | `modelcontextprotocol.io/version`                                                                                                                                                     | Original value, individually queryable                              |
| `title`                 | Native               | `metadata.title`                                                                                                                                                                      | Verbatim when present                                               |
| `description`           | Native               | `metadata.description`                                                                                                                                                                | Required field                                                      |
| `websiteUrl`            | Native               | `metadata.links[]` `{ url, title: "Website" }`                                                                                                                                        | Only when D11 passes; refused URLs not projected                    |
| `repository.url`        | Native + dedicated   | `metadata.links[]` `{ url, title: "Source Code" }` (combined) + `backstage.io/source-location` (`url:<combined>`) + `modelcontextprotocol.io/repository.url` (original, unnormalized) | Only when D11 passes                                                |
| `repository.source`     | Projected annotation | `modelcontextprotocol.io/repository.source`                                                                                                                                           | Used by SCM-aware combination algorithm; still projected            |
| `repository.id`         | Projected annotation | `modelcontextprotocol.io/repository.id`                                                                                                                                               |                                                                     |
| `repository.subfolder`  | Projected annotation | `modelcontextprotocol.io/repository.subfolder`                                                                                                                                        | Used in combination algorithm; still projected                      |
| `remotes[].type`        | Native               | `spec.remotes[].type`                                                                                                                                                                 | Consumed by direct mapping (type always copied)                     |
| `remotes[].url`         | Native               | `spec.remotes[].url`                                                                                                                                                                  | Only when D11 passes; always consumed (symmetric with websiteUrl)   |
| `remotes[].headers`     | Projected annotation | `modelcontextprotocol.io/remotes.<i>.headers.*`                                                                                                                                       | Projected, not dropped; D9 secret redaction applies                 |
| `remotes[].variables`   | Projected annotation | `modelcontextprotocol.io/remotes.<i>.variables.*`                                                                                                                                     | Projected, not dropped; D9 secret redaction applies                 |
| `packages[]`            | Projected annotation | `modelcontextprotocol.io/packages.*`                                                                                                                                                  | Full subtree projected; D9 secret redaction applies                 |
| `icons[]`               | Projected annotation | `modelcontextprotocol.io/icons.*`                                                                                                                                                     | `icons[].src` gated by D11                                          |
| `_meta`                 | Projected annotation | `modelcontextprotocol.io/xmeta.*`                                                                                                                                                     | Leading `_` → `x` per D3                                            |
| _(convention)_          | Native               | `metadata.tags`: `["mcp", "ai"]`                                                                                                                                                      | Not a `server.json` field; always emitted                           |
| _(absent)_              | Native               | `spec.type`: `"mcp-server"`                                                                                                                                                           | Constant                                                            |
| _(absent)_              | Native               | `spec.owner`                                                                                                                                                                          | Default `"unknown"`; caller override via `owner`                    |
| _(absent)_              | Native               | `spec.lifecycle`                                                                                                                                                                      | Default `"production"`; caller override via `lifecycle`             |

## Annotation Key Rules (D3)

Annotation keys use the `modelcontextprotocol.io/` prefix followed by a dot-separated path encoding:

### Path encoding

- **Object keys** contribute their key name as a segment
- **Array elements** contribute their zero-based numeric index as a segment
- Segments are joined with `.` to form the annotation name segment

### Per-segment sanitization

1. **Lowercase** the segment
2. **Replace** every character outside `a-z`, `0-9`, `.`, `_`, `-` with `-`
3. **Leading `_`** → replace with `x` (e.g., `_meta` → `xmeta`)
4. **Boundary normalization** (per segment): while the segment's first character is not alphanumeric (`a-z`/`0-9`), replace with `x`; while the last character is not alphanumeric, replace with `x`

### Post-join processing

1. **Boundary normalization** on the joined name segment (cannot start or end with `.`, `-`, `_`, or other non-alphanumeric)
2. **Length limit**: name segment ≤63 characters; truncate with stable hash suffix when exceeded
3. **Collision disambiguation**: when a distinct source path sanitizes to the same key, append the same D3 hash suffix

### Worked examples

| Source path                                                                      | Sanitized key                                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `repository.source`                                                              | `modelcontextprotocol.io/repository.source`                                   |
| `packages[0].identifier`                                                         | `modelcontextprotocol.io/packages.0.identifier`                               |
| `_meta.revision`                                                                 | `modelcontextprotocol.io/xmeta.revision`                                      |
| `icons[0].mimeType`                                                              | `modelcontextprotocol.io/icons.0.mimetype`                                    |
| `remotes[0].headers[0].name`                                                     | `modelcontextprotocol.io/remotes.0.headers.0.name`                            |
| Key containing `/` (e.g., `io.modelcontextprotocol.registry/publisher-provided`) | `modelcontextprotocol.io/io.modelcontextprotocol.registry-publisher-provided` |

## Caller Defaults (D4/D5)

| Caller default | Mapping target                          | When omitted   |
| -------------- | --------------------------------------- | -------------- |
| `prefix`       | Identity prefix in `metadata.name` (D4) | `mcp.registry` |
| `owner`        | `spec.owner` (D5)                       | `unknown`      |
| `lifecycle`    | `spec.lifecycle` (D5)                   | `production`   |

The sibling `mcp-registry-provider` maps:

- `catalog.providers.mcpRegistry.baseName` → caller `prefix`
- `catalog.providers.mcpRegistry.defaultOwner` → caller `owner`

Unset, empty, or sanitizes-to-empty `prefix` falls back to `mcp.registry`. Missing `owner` or `lifecycle` never fails the mapping.

## D12 Null/Empty Omission Rules

- `null` scalars: omitted from projection (no annotation produced)
- Empty array `[]`: no subtree annotations (no placeholder)
- Empty object `{}`: no subtree annotations (no placeholder)
- `false`, `0`, `""`: **still projected** as string values `"false"`, `"0"`, `""`

## D11 Emitted-URL Scheme Policy

**Applies to:** `metadata.links[].url`, `backstage.io/source-location` (target after `url:`), `spec.remotes[].url`, `modelcontextprotocol.io/repository.url`, and every projected URL annotation.

**Algorithm:**

1. Trim leading/trailing whitespace
2. Parse as absolute URL (WHATWG `URL`, no base URL)
3. **Pass** only when scheme is `http` or `https` (case-insensitive)

**Refused schemes:** `javascript:`, `data:`, `file:`, `vbscript:`, `blob:`, relative paths, scheme-relative `//host`, scp-like `git@host:path`

**Host policy:** No host classification. `http://localhost`, `http://10.0.0.5`, `https://gitlab.internal` all pass because they are `http`/`https`. No DNS resolution or URL fetching.

**On refusal:** Omit from the emitted URL field; do not fail the transform. Refused URLs are not projected under any annotation key.
