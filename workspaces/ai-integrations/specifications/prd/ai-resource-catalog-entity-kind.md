# PRD: AIResource Catalog Entity Kind

**Product:** AI Integrations for Red Hat Developer Hub
**Status:** Requirements for new implementation (mirrored into this workspace for local implementation)
**Date:** 2026-07-06
**Updated:** 2026-07-06 - ported into this workspace so local implementation agents can consume the requirements directly
**Priority:** P0
**Provenance:** Requirements mirrored into this workspace from the AIResource OpenSpec work and adapted to the current upstream-aligned `AIResource` model.

---

## Why

AI coding tools consume reusable assets such as skills, rules, prompts, and agent definitions that teams publish in source repositories or OCI images. Today there is no standard way in RHDH to register those assets in the catalog, validate their location metadata, and make them discoverable through standard catalog APIs and entity pages.

This PRD defines the product requirements for introducing `AIResource` as a first-class catalog entity in this workspace. The goal is to let platform teams register AI assets consistently while staying aligned with the upstream Backstage `AIResource` direction.

## What This Product Does

The product adds support for cataloging AI assets as `AIResource` entities. It validates the entity schema, supports both git-backed and OCI-backed asset locations, integrates with standard Backstage catalog ingestion and entity pages, and exposes AIResource entities through catalog search and filter APIs.

Git-backed AIResource entities reuse existing Backstage catalog behavior. OCI-backed AIResource entities use a lightweight processor that validates the `oci://` reference format only and makes no outbound registry calls.

## Who It's For

### Platform Engineer

Registers and manages AI assets in the catalog so teams can discover approved repositories and OCI artifacts in a consistent, governed way.

### AI Asset Author

Publishes reusable skills, rules, prompts, or agent bundles in git or OCI form and wants them to appear as catalog entities with standard metadata and ownership.

### Catalog Consumer

Searches, filters, and opens AI assets through the standard catalog experience without needing a separate marketplace or custom frontend.

## Boundaries

### In Scope

- Introduce `AIResource` entity support aligned with the upstream Backstage kind
- Support `spec.location.type` values `git` and `oci`
- Validate `spec.location.target` and RHDH-specific extensions during ingestion
- Reuse `UrlReaderProcessor` for git-backed entities
- Add an OCI processor that performs format validation only, with zero network calls
- Register AIResource entities through standard catalog flows
- Render AIResource entities on the standard entity page
- Support filtering by `kind`, `spec.type`, `spec.scope`, `spec.owner`, and `spec.lifecycle`
- Include AIResource entities in standard catalog full-text search

### Out of Scope

- Parsing or indexing individual skills, rules, or agents inside an asset
- OCI manifest fetching, layer pulls, registry pinging, or annotation enrichment
- Authentication to private OCI registries in the initial implementation
- HTTPS archive, ZIP, or TAR asset location support
- A dedicated AI marketplace frontend or custom entity page plugin
- Tool-specific runtime integrations for Cursor, Copilot, Claude Code, or other AI coding tools

---

## Capabilities

### 1. AIResource Schema and Validation

**Goal:** Ensure AI assets are represented by a consistent, validated catalog schema aligned with upstream Backstage.

**How it works:**

- Use the upstream `AIResource` kind rather than maintaining an RHDH-only `AIContext` fork
- Use `spec.location.type` to discriminate between `git` and `oci`
- Use `spec.location.target` as the canonical location field for both source types
- Extend the upstream model with RHDH-specific `spec.scope` support
- Return actionable validation errors that name the field path, invalid value, and violated constraint
- Report multiple validation errors together rather than failing one field at a time

### 2. Git-backed AIResource Ingestion

**Goal:** Support git-backed AI assets with zero new infrastructure.

**How it works:**

- AIResource entities with `spec.location.type: git` use the standard `backstage.io/source-location` annotation
- The existing `UrlReaderProcessor` handles ingestion and enrichment
- Missing `backstage.io/source-location` produces a processor warning rather than a hard failure

### 3. OCI-backed AIResource Ingestion

**Goal:** Accept OCI-backed AI assets while keeping catalog ingestion air-gap safe and stateless.

**How it works:**

- AIResource entities with `spec.location.type: oci` are validated by a dedicated catalog processor
- The processor validates `spec.location.target` format only
- The target must use the `oci://` scheme prefix
- No manifest fetch, layer pull, registry ping, or other outbound network call is allowed
- Malformed OCI targets are rejected with actionable errors before storage

### 4. Standard Catalog Registration

**Goal:** Make AIResource a normal catalog entity kind instead of a special-case workflow.

**How it works:**

- AIResource entities are registrable through standard catalog URL registration
- AIResource entities participate in normal catalog-info discovery flows
- AIResource entities are compatible with RHDH catalog registration automation such as MCP-driven registration flows

### 5. Entity Page Rendering

**Goal:** Let users inspect AIResource entities in the existing catalog UI without building a separate frontend.

**How it works:**

- AIResource entities render on the standard `EntityPage`
- The asset location is shown in a readable form using the existing page layout
- Git locations are rendered as links
- OCI locations are rendered as OCI image references
- TechDocs appear when `metadata.annotations["backstage.io/techdocs-ref"]` is present

### 6. Discovery and Filtering

**Goal:** Make AIResource entities discoverable through normal catalog APIs and search.

**How it works:**

- `GET /api/catalog/entities?filter=kind=AIResource` returns AIResource entities
- AIResource entities are retrievable by entity ref through the standard by-name endpoint
- Standard filters work for `spec.type`, `spec.scope`, `spec.owner`, and `spec.lifecycle`
- AIResource entities appear in catalog full-text search based on `metadata.name`, `metadata.title`, `metadata.description`, and `spec.type`

---

## Architecture Context

**Upstream alignment first:**

- This workspace should implement the upstream `AIResource` kind, not continue with the older `AIContext` name
- `spec.location.target` is the canonical field, replacing earlier `url` / `uri` split proposals
- `spec.type` is a single string value aligned with the RFC model

**Location model:**

- `git` locations reuse Backstage-native source-location patterns
- `oci` locations require custom validation because no existing catalog processor handles OCI references directly
- Only `git` and `oci` are valid location types in the initial implementation

**Air-gap safety:**

- OCI ingestion is metadata validation only
- The catalog indexes the OCI reference itself, not the image contents
- No outbound registry traffic is allowed during processing

**RHDH-specific extension:**

- `spec.scope` is supported as an RHDH extension with accepted values `organization`, `product`, and `team`
- Extension validation must remain compatible with upstream AIResource evolution

---

## Traceability

| Capability                       | OpenSpec source                                                                                | Priority |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| AIResource schema and validation | `openspec/changes/ai-resource-catalog-entity-kind/specs/ai-resource-entity-schema/spec.md`     | P0       |
| OCI and git ingestion            | `openspec/changes/ai-resource-catalog-entity-kind/specs/ai-resource-catalog-ingestion/spec.md` | P0       |
| Entity page rendering            | `openspec/changes/ai-resource-catalog-entity-kind/specs/ai-resource-entity-page/spec.md`       | P1       |
| Discovery and filtering          | `openspec/changes/ai-resource-catalog-entity-kind/specs/ai-resource-discovery/spec.md`         | P1       |

---

## Customer Context

RHDH users need a catalog-native way to publish and discover reusable AI assets without introducing a separate asset registry UI or requiring direct registry access during ingestion. The platform should treat AI assets like other first-class catalog entities: typed, validated, owned, searchable, and visible through standard entity pages.

The initial release prioritizes safe registration and discovery over deep asset introspection. That means validating location metadata, indexing entity records, and surfacing them through the catalog, while explicitly deferring OCI content inspection, private-registry auth, and richer marketplace-style experiences.
