## Canonical Touchpoints

- `specifications/prd/ai-resource-catalog-entity-kind.md`

## Context

Backstage's catalog supports pluggable entity kinds through three main mechanisms:

1. Defining the entity schema and TypeScript model
2. Registering processors that validate or enrich entities during ingestion
3. Reusing existing catalog behavior where a new kind fits an established path

For AI assets, the two source types are materially different:

- **`git`**: A source repository or other URL-reader-compatible location that can reuse existing Backstage ingestion behavior
- **`oci`**: An OCI artifact reference such as `oci://quay.io/org/skills:latest`, which requires explicit validation because existing catalog processors do not understand OCI references directly

The design must keep OCI ingestion air-gap safe. The catalog should validate the reference and index the entity, but it must not fetch manifests, pull layers, or contact registries during processing.

## Goals / Non-Goals

**Goals:**

- Implement the upstream-aligned `AIResource` kind in this workspace
- Use `spec.location.target` as the canonical location field
- Reuse existing catalog behavior for git-backed AIResource entities
- Add lightweight OCI validation with zero outbound network calls
- Support standard entity page rendering, discovery, filtering, and search
- Support RHDH-specific `spec.scope` validation

**Non-Goals:**

- Deep OCI content ingestion
- Private registry authentication
- Separate frontend plugin or marketplace UI
- Additional asset source types beyond `git` and `oci`

## Decisions

### D1 - Use upstream `AIResource`, not `AIContext`

**Choice**: Implement the upstream `AIResource` entity kind rather than maintaining the older `AIContext` naming.

**Rationale**: Upstream alignment reduces migration cost and keeps this workspace compatible with the Backstage merge path.

### D2 - Use `spec.location.target` as the canonical location field

**Choice**: Represent both git and OCI locations with `spec.location.target`, discriminated by `spec.location.type`.

**Rationale**: This matches the current RFC direction and avoids separate `url` / `uri` field shapes.

### D3 - Reuse `UrlReaderProcessor` for git-backed entities

**Choice**: Git-backed AIResource entities use the standard `backstage.io/source-location` annotation and the existing `UrlReaderProcessor`.

**Rationale**: This keeps the common path simple and avoids duplicating catalog logic that already exists in Backstage.

### D4 - OCI ingestion performs format validation only

**Choice**: OCI-backed AIResource entities are validated by a dedicated processor that checks `spec.location.target` format only.

**Rationale**: The catalog indexes the OCI reference as metadata. It should not fetch remote OCI content. This keeps ingestion stateless, air-gap safe, and free of registry dependency or rate-limit concerns.

### D5 - Preserve the `oci://` prefix convention

**Choice**: OCI locations must retain the `oci://` scheme prefix.

**Rationale**: This is the established RHDH convention and provides an unambiguous distinction from ordinary URLs.

### D6 - `spec.scope` is an RHDH extension

**Choice**: Support optional `spec.scope` values `organization`, `product`, and `team` as an RHDH-specific extension.

**Rationale**: Scope is needed for RHDH use cases but is not part of the upstream core kind. Keeping it as an extension preserves alignment while meeting local requirements.

### D7 - Use the standard entity page

**Choice**: Render AIResource entities through the existing `EntityPage` layout rather than creating a dedicated page.

**Rationale**: The standard entity page already provides metadata rendering, relationships, and TechDocs integration. A custom plugin would add unnecessary complexity for the initial release.

### D8 - Discovery uses standard catalog APIs

**Choice**: AIResource entities participate in the existing entity list, by-name lookup, filter, and full-text search APIs.

**Rationale**: AIResource should behave like any other first-class catalog kind rather than requiring special endpoints.

## Risks / Trade-offs

| Risk                                         | Mitigation                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Upstream AIResource evolves further          | Keep the design aligned to upstream naming and field shapes; limit RHDH-specific additions |
| OCI target ambiguity causes weak validation  | Enforce `spec.location.type`, `spec.location.target`, and `oci://` prefix rules explicitly |
| Users expect OCI content inspection          | Document clearly that ingestion indexes metadata only and performs no registry I/O         |
| RHDH extension behavior drifts from upstream | Keep `spec.scope` isolated as an extension and avoid additional spec divergence            |

## Deferred Decisions

- Private OCI registry authentication
- OCI URI to registry-browse URL transformation on the entity page
- Promotion of change-local specs into long-lived `openspec/specs/`
