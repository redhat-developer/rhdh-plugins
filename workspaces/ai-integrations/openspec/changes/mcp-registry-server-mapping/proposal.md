# Proposal: MCP Registry Server Mapping

## Why

[MCP Registry](https://github.com/modelcontextprotocol/registry) and private mirrors publish `server.json` entries per the [draft `server.schema.json`](https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json). Backstage already catalogs MCP servers as `API` entities with `spec.type: mcp-server` (upstream [`backstage/backstage`](https://github.com/backstage/backstage), RFC [#32062](https://github.com/backstage/backstage/issues/32062)), but there is no canonical transform from registry JSON to that entity shape. Ad-hoc translations lose metadata, break round-trip, and diverge across consumers. This change defines one deterministic mapping contract as the prerequisite for registry ingestion (e.g. [`mcp-registry-provider`](../mcp-registry-provider/)).

## What Changes

- Define a pure, deterministic **`server.json` → `mcp-server` `API` entity** transform (one document in, one entity out).
- Specify **native field mapping** (`metadata`, `spec.remotes`, dedicated `modelcontextprotocol.io/*` annotations, D11 URL gating, SCM-aware repository links, **D8** placeholder remote when `remotes` is unset/empty or all D11-refused — `type` literal `undefined`, `url` from D11-valid `websiteUrl` for upstream `minItems: 1`) in `mcp-registry-server-mapping`.
- Specify **annotation projection** for unmapped attributes (`modelcontextprotocol.io/<dot.path>`), including secret redaction (D9) and catalog-valid keys, in `mcp-registry-annotation-projection`.
- Require `name`, `description`, and `version` on input (`server.json`); mapping fails with an actionable error when any is omitted. Supply catalog-required defaults (`spec.owner`, `spec.lifecycle`, identity `prefix`) and document **round-trip** rules (with documented exceptions for secrets and refused URLs).
- Deliver a **mapping reference**, worked examples, and **conformance fixtures** as the implementation oracle (see `design.md` and capability specs).

## Capabilities

### New Capabilities

- `mcp-registry-server-mapping`: Direct mapping from `server.json` to native `mcp-server` `API` fields — identity, descriptive metadata, `spec.remotes`, D11 allowlist, and caller-supplied defaults.
- `mcp-registry-annotation-projection`: Fallback projection of remaining scalars into `modelcontextprotocol.io/*` annotations with key sanitization, no-overwrite of native annotations, D9/D11, and round-trip fidelity.

### Modified Capabilities

_(none — introduces new capabilities only; consumes the upstream Backstage `mcp-server` `API` contract.)_

## Non-goals

- Registry HTTP client, entity provider, or scheduling ([`mcp-registry-provider`](../mcp-registry-provider/) owns ingestion).
- Changing the upstream `mcp-server` `API` schema or catalog UI.
- Reverse mapping beyond scalar round-trip guarantees.
- Executing `packages[]`, health checks, or cross-registry deduplication.

## Canonical Touchpoints

- **PRDs (`specifications/prd/`)**: None
- **ADRs (`specifications/adr/`)**: None
- **Long-lived specs (`openspec/specs/`)**: None

**Change type**: feature-spec

## Impact

- **Upstream target**: `McpServerApiEntity` shape (top-level `spec.remotes[]`, no `spec.definition`) — detailed anchors in `design.md`; requirements in `specs/mcp-registry-server-mapping/spec.md`.
- **Source**: MCP Registry draft `server.json` (version-pinned in implementation); unknown fields fail-open via projection.
- **Consumers**: future registry entity provider; catalog search over `modelcontextprotocol.io/*` annotations.
- **Alignment**: track Backstage RFC [#32062](https://github.com/backstage/backstage/issues/32062) and registry schema drift.
