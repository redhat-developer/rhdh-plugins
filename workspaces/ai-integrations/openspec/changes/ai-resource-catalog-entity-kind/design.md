# Design: AIResource Catalog Entity Kind

## Canonical Touchpoints

- RHDHPLAN-1113 — [Agentic] Agents & Skills (AIResource Kinds) in the RHDH Catalog (DP)
- RHIDP-13942 — AIResource: Catalog ingestion (OCI processor + git annotation path)
- RHIDP-15739 — Align OCI AIResource support with upstream source-location (`url:oci://…`); remove `spec.location`

## Context

Backstage's catalog supports pluggable entity kinds through three main mechanisms:

1. Defining the entity schema and TypeScript model
2. Registering processors that validate or enrich entities during ingestion
3. Reusing existing catalog behavior where a new kind fits an established path

Upstream `AiResource` does **not** define `spec.location`. Skill and rule content is referenced via the standard `backstage.io/source-location` annotation, identical to other Backstage entity kinds.

For AI assets, two content reference shapes are needed:

- **Git / HTTPS**: `backstage.io/source-location: url:https://…` (or other UrlReader-compatible URL)
- **OCI**: `backstage.io/source-location: url:oci://registry/repository[:tag|@digest]`

In both cases, the **entity YAML** (`catalog-info.yaml`) is still registered through a normal catalog location (`url` / `file` / git discovery). The OCI reference is metadata on the entity; the catalog does not pull image content during ingest.

The design must keep OCI ingest air-gap safe: validate the reference and index the entity, but do not fetch manifests, pull layers, or contact registries during processing.

## Goals / Non-Goals

**Goals:**

- Implement the upstream-aligned `AIResource` / `AiResource` kind in this workspace
- Use `backstage.io/source-location` as the canonical content location
- Validate OCI source-location values in location-ref form `url:oci://…`
- Reuse existing catalog behavior for registering entity YAML from git/HTTPS/`file`
- Add lightweight OCI validation with zero outbound network calls
- Support standard entity page rendering, discovery, filtering, and search
- Support RHDH-specific `spec.scope` validation
- Remove any RHDH `spec.location` field used for OCI/git asset location

**Non-Goals:**

- Deep OCI content ingestion / OCI `UrlReader`
- Catalog location type `oci` for discovering entities from registries
- Private registry authentication
- Separate frontend plugin or marketplace UI
- Additional RHDH location fields beyond upstream annotations + `spec.scope`

## Decisions

### D1 - Use upstream `AiResource` / `AIResource`, not `AIContext`

**Choice**: Implement the upstream `AiResource` entity kind rather than maintaining the older `AIContext` naming.

**Rationale**: Upstream alignment reduces migration cost and keeps this workspace compatible with the Backstage merge path.

### D2 - Canonical location is `backstage.io/source-location` (no `spec.location`)

**Choice**: Do not use an RHDH `spec.location` struct. Git/HTTPS and OCI content references both use `metadata.annotations["backstage.io/source-location"]`.

**Rationale**: Matches upstream AIResource design and Backstage feedback. Keeps OCI skill support compatible with future consumers that resolve content via `UrlReader` against the source-location target.

### D3 - OCI uses location-ref form `url:oci://…`

**Choice**: OCI-backed entities MUST set:

```yaml
metadata:
  annotations:
    backstage.io/source-location: url:oci://quay.io/org/skills:latest
```

Backstage `parseLocationRef` splits on the first `:`, yielding `{ type: 'url', target: 'oci://quay.io/org/skills:latest' }`.

**Rationale**: Bare `oci://…` as the annotation value parses as location type `oci` with a non-URL target (`//quay.io/…`), which breaks future UrlReader integration. Prefixing with `url:` keeps type `url` and preserves a parseable `oci://` target.

### D4 - Reuse standard catalog registration for entity YAML

**Choice**: Entity descriptors are always fetched from normal catalog locations (`url` / `file` / git). No catalog location type `oci` and no OCI `UrlReader` are required to **register** OCI-referenced AIResources.

**Rationale**: Registration indexes metadata. Fetching skill content from a registry is a separate, later capability.

### D5 - OCI ingestion performs format validation only

**Choice**: When `backstage.io/source-location` has target scheme `oci://`, a dedicated processor validates format only (non-empty, no surrounding whitespace, well-formed `oci://registry/repository[:tag|@digest]`).

**Rationale**: The catalog indexes the OCI reference as metadata. It should not fetch remote OCI content. This keeps ingestion stateless, air-gap safe, and free of registry dependency or rate-limit concerns.

### D6 - Preserve the `oci://` scheme on the location target

**Choice**: The source-location **target** (after the `url:` prefix) must use the `oci://` scheme.

**Rationale**: Unambiguous distinction from HTTPS/git URLs; matches established RHDH OCI URI convention.

### D7 - `spec.scope` is an RHDH extension

**Choice**: Support optional `spec.scope` values `organization`, `product`, and `team` as an RHDH-specific extension.

**Rationale**: Scope is needed for RHDH use cases but is not part of the upstream core kind. Keeping it as an extension preserves alignment while meeting local requirements.

### D8 - Use the standard entity page

**Choice**: Render AIResource entities through the existing `EntityPage` layout rather than creating a dedicated page.

**Rationale**: The standard entity page already provides metadata rendering, relationships, and TechDocs integration. A custom AI catalog frontend is deferred to a future release.

### D9 - Discovery uses standard catalog APIs

**Choice**: AIResource entities participate in the existing entity list, by-name lookup, filter, and full-text search APIs.

**Rationale**: AIResource should behave like any other first-class catalog kind rather than requiring special endpoints.

### D10 - Deferred: OCI UrlReader

**Choice**: Do not implement an OCI `UrlReader` in this change.

**Rationale**: A UrlReader is only needed when a consumer must fetch content (or catalog YAML) from `oci://…`. Registration and format validation do not require it. When added later, it registers via `urlReaderFactoriesServiceRef` with `predicate: (url) => url.protocol === 'oci:'`.

## Risks / Trade-offs

| Risk                                              | Mitigation                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Upstream AIResource evolves further               | Keep the design aligned to upstream annotations; limit RHDH-specific additions to `spec.scope` |
| Wrong location-ref form (`oci://` without `url:`) | Validate `url:` prefix + `oci://` target; document examples clearly                            |
| Users expect OCI content inspection               | Document clearly that ingestion indexes metadata only and performs no registry I/O             |
| Stale `spec.location` examples confuse agents     | Remove `spec.location` from schema, processor, docs, examples, and OpenSpec                    |
| RHDH extension behavior drifts from upstream      | Keep `spec.scope` isolated as an extension and avoid additional spec divergence                |

## Deferred Decisions

- OCI `UrlReader` for content fetch / broader import
- Private OCI registry authentication
- Catalog location type `oci` for discovering entities from registries
- OCI URI to registry-browse URL transformation on a custom entity page
- Promotion of change-local specs into long-lived `openspec/specs/`
