## Why

MCP registries (the upstream [MCP Registry](https://github.com/modelcontextprotocol/registry) and downstream/private mirrors) publish server entries as `server.json` documents conforming to the [`server.schema.json` draft](https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json). Backstage already supports cataloging MCP servers as `API` entities with `spec.type: mcp-server` — defined upstream in [`backstage/backstage`](https://github.com/backstage/backstage) (Backstage RFC [#32062](https://github.com/backstage/backstage/issues/32062), not by RHDH) — but there is no defined, deterministic way to turn a registry `server.json` into such an entity. Without a canonical mapping, every ingestion path would invent its own field translation, lose registry metadata that has no native catalog home, and produce entities that do not round-trip. A single documented mapping contract makes registry ingestion predictable and lossless, and is the prerequisite for any future registry entity provider.

## What Changes

- Define a deterministic, idempotent **mapping contract** that transforms one `server.json` document (draft `server.schema.json`) into one Backstage `API` entity with `spec.type: mcp-server`, conformant to the upstream Backstage `mcp-server` `API` entity specification (defined in [`backstage/backstage`](https://github.com/backstage/backstage)).
- Specify the **direct field mapping**: which `server.json` attributes lift into native Backstage/entity fields — `metadata.name` (derived as `<name>__<version>` so each server version gets a collision-free entity), `metadata.title`/`description`, `metadata.links` (a `websiteUrl` entry titled `Website` and a `repository.url` entry titled `Source Code`, with `repository.url` (combined with `repository.subfolder` when present) also emitted as a `backstage.io/source-location` annotation), `spec.type`/`lifecycle`/`owner`, the top-level `spec.remotes[]` (`type`, `url`) that the upstream mcp-server entity uses in place of `spec.definition`, and dedicated `modelcontextprotocol.io/name` and `modelcontextprotocol.io/version` fields preserving the bare canonical name and version.
- Specify the **annotation projection** fallback: every `server.json` attribute that has no native home is projected into an annotation keyed `modelcontextprotocol.io/<dot.path.to.leaf>`, encoding nested objects and array indices as dot-separated segments within a single-slash, catalog-valid key. **Secret-flagged inputs** (`isSecret: true`) have their `default`/`value` leaves pruned so no credential is published into a searchable catalog annotation.
- Specify **catalog-valid key construction**: character sanitization, the 63-character name-segment limit with deterministic hash-suffix truncation, and collision disambiguation — because Backstage annotation keys permit only one `/` and a restricted name-segment character set.
- Specify **field-supply rules** for catalog-required fields absent from `server.json` (`spec.owner` defaults to the constant `unknown`, `spec.lifecycle` defaults to the constant `production` — both overridable by caller defaults, never a failure), and **round-trip fidelity** so scalar leaves are recoverable from the produced entity (except redacted secrets).
- Deliver a canonical mapping-table reference, worked examples, and a conformance fixture set (`server.json` input → expected entity output).

## Capabilities

### New Capabilities

- `mcp-registry-server-mapping`: The deterministic direct field mapping from a `server.json` (draft `server.schema.json`) document to the native fields of an `mcp-server` `API` entity — identity/name sanitization with canonical-name preservation, descriptive metadata, `remotes` → top-level `spec.remotes[]`, and supply of catalog-required fields (`spec.owner`, `spec.lifecycle`) absent from the source.
- `mcp-registry-annotation-projection`: The fallback rule that projects every `server.json` attribute without a native home into `modelcontextprotocol.io/<dot.path>` annotations — dot-path encoding of nested objects and array indices, catalog-valid key sanitization/truncation, no-overwrite of natively-mapped fields, and scalar round-trip fidelity.

### Modified Capabilities

_(none — no long-lived specs exist under `openspec/specs/` yet; this change introduces new capabilities only and consumes the upstream Backstage `mcp-server` `API` entity contract defined in [`backstage/backstage`](https://github.com/backstage/backstage).)_

## Non-goals

- **Ingestion / runtime.** No registry HTTP client, polling schedule, catalog entity provider/processor, or entity lifecycle management. This change defines the pure `server.json` → entity transform only; the component that fetches entries and applies the mapping is a separate future change.
- **Modifying the upstream `mcp-server` `API` entity contract.** This change consumes that contract as defined in [`backstage/backstage`](https://github.com/backstage/backstage); it does not change `spec.type: mcp-server` recognition, validation, or page rendering. Changes to the entity contract are owned upstream (Backstage RFC [#32062](https://github.com/backstage/backstage/issues/32062)), not made here.
- **Reverse mapping** (entity → `server.json`) beyond the scalar round-trip fidelity guarantee needed to avoid data loss.
- **Runtime invocation / health checking** of the mapped MCP servers.
- **Local package execution.** `packages[]` runtime details are preserved as annotations for discoverability, not interpreted or executed.
- **Deduplication / merge** of the same server appearing in multiple registries.

## Upstream References

The mapping target — the `mcp-server` `API` entity shape — is anchored to the following upstream Backstage sources (`backstage/backstage`):

- **Canonical example** — [`packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/examples/apis/backstage-mcp-server-api.yaml): the reference `mcp-server` `API` entity. It uses `spec.type: mcp-server`, `spec.lifecycle`, `spec.owner`, `metadata.tags: [mcp, ai]`, and — notably — a **top-level `spec.remotes[]`** with `type` + `url` (no `spec.definition`):
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
- **Base API schema** — [`packages/catalog-model/src/schema/kinds/API.v1alpha1.schema.json`](https://raw.githubusercontent.com/backstage/backstage/a4bdc49ed664661bc69fe42bfaebcf24dc96e6b3/packages/catalog-model/src/schema/kinds/API.v1alpha1.schema.json): defines `spec.type` (free-form string), `lifecycle`, `owner`, and lists `definition` as required for generic `API` entities. This `definition` requirement is **overridden for `spec.type: mcp-server`** by the dedicated mcp-server entity schema below.
- **RFC** — Backstage [#32062](https://github.com/backstage/backstage/issues/32062): models MCP servers as the `API` kind with `spec.type: mcp-server`.
- **Dedicated mcp-server entity schema** — [`packages/catalog-model/src/kinds/McpServerApiEntity.ts`](https://github.com/backstage/backstage/blob/f91434377dc43cd64bef82344e3f2b539bfdaf11/packages/catalog-model/src/kinds/McpServerApiEntity.ts#L28-L36) (Backstage [PR #34016](https://github.com/backstage/backstage/pull/34016)): the upstream schema for `spec.type: mcp-server`. It does `Omit<ApiEntityV1alpha1, 'spec'>` and requires `spec.type: 'mcp-server'`, `spec.lifecycle`, `spec.owner`, and `spec.remotes[]` (with optional `spec.system`); `spec.definition` is not part of this schema. `spec.remotes` therefore **replaces** the base schema's required `spec.definition` for mcp-server entities.

**Consequence for this mapping:** the mapping target is the upstream example shape exactly — `spec.type: mcp-server`, `spec.lifecycle`, `spec.owner`, `metadata` (`name`/`title`/`description`/`tags`/`links`), and top-level `spec.remotes[]` (`type`, `url`). No `spec.definition` is emitted. `server.json` fields with no native home (`packages`, `repository` sub-fields other than `url`, `icons`, remote `headers`/`variables`, `_meta`, …) are projected into `modelcontextprotocol.io/*` annotations per `mcp-registry-annotation-projection`. (`name` and `version` get dedicated `modelcontextprotocol.io/name` and `modelcontextprotocol.io/version` fields and also form `metadata.name`.)

## Canonical Touchpoints

- **PRDs (`specifications/prd/`)**: None
- **ADRs (`specifications/adr/`)**: None
- **Long-lived specs (`openspec/specs/`)**: None (new capabilities only; `openspec/specs/` does not yet exist)

**Change type**: feature-spec

## Impact

- **Depends on the upstream Backstage `mcp-server` `API` entity specification** (defined in [`backstage/backstage`](https://github.com/backstage/backstage), not by RHDH): the mapping targets that `mcp-server` `API` entity contract — `spec.type: mcp-server`, `spec.lifecycle`, `spec.owner`, and top-level `spec.remotes[]` (`type`, `url`); no `spec.definition`. Produced entities MUST pass the upstream `mcp-server` `API` entity schema (`McpServerApiEntity`, PR [#34016](https://github.com/backstage/backstage/pull/34016)), which for `spec.type: mcp-server` requires `spec.remotes` and drops the base schema's `spec.definition` requirement.
- **Source schema**: MCP Registry draft `server.schema.json` — top-level `name`, `title`, `description`, `version`, `websiteUrl`, `icons[]`, `repository{url,source,id,subfolder}`, `packages[]` (with nested `runtimeArguments`/`packageArguments`/`environmentVariables`/`transport`), `remotes[]` (`type`, `url`, `headers[]`, `variables`), and `_meta`. The draft schema evolves; the mapping is versioned against the draft and projects unknown fields generically (fail-open).
- **Backstage constraints**: annotation keys allow exactly one `/`; the name segment is ≤63 chars over a restricted character set — driving the dot-path encoding, sanitization, and hash-suffix truncation rules.
- **Consumers**: a future registry entity provider; AI agents and developers who discover MCP servers via catalog search/filter (the `modelcontextprotocol.io/*` annotations become searchable/filterable metadata).
- **Documentation**: mapping-table reference, worked examples, and a conformance fixture set usable as the test oracle when the transform is implemented.
- **Upstream**: keep aligned with Backstage RFC [#32062](https://github.com/backstage/backstage/issues/32062) and the MCP Registry `server.json` draft as both evolve.
