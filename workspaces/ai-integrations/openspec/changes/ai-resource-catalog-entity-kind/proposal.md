# Proposal: AIResource Catalog Entity Kind

## Why

AI coding tools consume reusable assets such as skills, rules, prompts, and agent definitions that teams publish in source repositories or OCI images. There is no standard way in this workspace to register those assets as catalog entities, validate their location metadata safely, and make them discoverable through standard RHDH catalog APIs and entity pages.

Adding first-class `AIResource` catalog support closes that gap while staying aligned with the upstream Backstage `AiResource` kind. Upstream intentionally has no `spec.location` field — asset content is referenced via the standard `backstage.io/source-location` annotation.

## What Changes

- Introduce support for the upstream `AiResource` / `AIResource` catalog kind in this workspace.
- Use `backstage.io/source-location` as the canonical asset location for both git/HTTPS and OCI-backed entities.
- Represent OCI-backed assets with the Backstage location-ref form `url:oci://…` (location type `url`, target scheme `oci://`).
- Validate AIResource entities during ingestion, including RHDH-specific `spec.scope` support and OCI source-location format rules.
- Reuse existing Backstage catalog behavior for entity YAML registration (git/HTTPS/`file` catalog locations).
- Add an OCI catalog processor that validates OCI `source-location` format only and makes zero outbound registry calls.
- Do **not** introduce RHDH `spec.location` (removed / not used for OCI skill support).
- Render AIResource entities on the standard catalog entity page.
- Expose AIResource entities through standard catalog search and filter APIs.
- Add local workspace documentation and OpenSpec artifacts so implementation agents can work from this workspace directly.

## Capabilities

### New Capabilities

- `ai-resource-entity-schema`: Schema and validation rules for the `AIResource` kind, including `spec.scope` as an RHDH extension and OCI `source-location` validation.
- `ai-resource-catalog-ingestion`: Catalog backend support for git/HTTPS-backed and OCI-referenced AIResource ingestion (format validation only for OCI).
- `ai-resource-entity-page`: Standard entity page rendering for AIResource entities, including source-aware location display and TechDocs integration.
- `ai-resource-discovery`: Catalog API, filtering, and full-text search support for AIResource entities.

### Modified Capabilities

_(none - this is a net-new capability area in this workspace)_

## Non-goals

- Parsing or indexing individual skills, rules, prompts, or agents inside an asset
- OCI registry manifest fetching, layer inspection, or metadata enrichment
- An OCI `UrlReader` (deferred; needed only when something must fetch OCI content)
- A catalog location type `oci` / `readLocation` for discovering entities from registries
- Private OCI registry authentication in the initial implementation
- HTTPS archive, ZIP, or TAR support as catalog location types
- A dedicated AI marketplace or custom frontend plugin (future release)
- Tool-runtime-specific integration with Cursor, Copilot, Claude Code, or other AI coding tools

## Canonical Touchpoints

- **PRDs**: None
- **ADRs**: None
- **Long-lived specs (`openspec/specs/`)**: None yet
- **Jira**: RHDHPLAN-1113, RHIDP-13942, RHIDP-15739

**Change type**: feature-spec

## Impact

- **Catalog backend**: Adds AIResource-specific ingestion and OCI `source-location` validation behavior
- **Schema handling**: Extends upstream AIResource behavior with RHDH-specific `spec.scope` validation only (no `spec.location`)
- **Frontend**: Reuses the standard entity page layout for AIResource entities
- **Catalog API**: No breaking API changes; AIResource appears through standard entity and search endpoints
- **Documentation**: Adds local OpenSpec materials to make the workspace self-contained for implementation
