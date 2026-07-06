## Why

AI coding tools consume reusable assets such as skills, rules, prompts, and agent definitions that teams publish in source repositories or OCI images. There is no standard way in this workspace to register those assets as catalog entities, validate their location metadata safely, and make them discoverable through standard RHDH catalog APIs and entity pages.

Adding first-class `AIResource` catalog support closes that gap while staying aligned with the upstream Backstage `AIResource` kind.

## What Changes

- Introduce support for the upstream `AIResource` catalog kind in this workspace.
- Support two asset location types under `spec.location.type`: `git` and `oci`.
- Validate AIResource entities during ingestion, including RHDH-specific `spec.scope` support and `oci://` prefix rules.
- Reuse existing Backstage catalog behavior for git-backed entities.
- Add an OCI catalog processor that validates `spec.location.target` format only and makes zero outbound registry calls.
- Render AIResource entities on the standard catalog entity page.
- Expose AIResource entities through standard catalog search and filter APIs.
- Add local workspace documentation and OpenSpec artifacts so implementation agents can work from this workspace directly.

## Capabilities

### New Capabilities

- `ai-resource-entity-schema`: Schema and validation rules for the `AIResource` kind, including `spec.scope` as an RHDH extension and `oci://` validation for OCI locations.
- `ai-resource-catalog-ingestion`: Catalog backend support for git-backed and OCI-backed AIResource ingestion.
- `ai-resource-entity-page`: Standard entity page rendering for AIResource entities, including source-aware location display and TechDocs integration.
- `ai-resource-discovery`: Catalog API, filtering, and full-text search support for AIResource entities.

### Modified Capabilities

_(none - this is a net-new capability area in this workspace)_

## Non-goals

- Parsing or indexing individual skills, rules, prompts, or agents inside an asset
- OCI registry manifest fetching, layer inspection, or metadata enrichment
- Private OCI registry authentication in the initial implementation
- HTTPS archive, ZIP, or TAR support as location types
- A dedicated AI marketplace or custom frontend plugin
- Tool-runtime-specific integration with Cursor, Copilot, Claude Code, or other AI coding tools

## Canonical Touchpoints

- **PRDs**: `specifications/prd/ai-resource-catalog-entity-kind.md`
- **ADRs**: None
- **Long-lived specs (`openspec/specs/`)**: None yet

**Change type**: feature-spec

## Impact

- **Catalog backend**: Adds AIResource-specific ingestion and OCI validation behavior
- **Schema handling**: Extends upstream AIResource behavior with RHDH-specific validation
- **Frontend**: Reuses the standard entity page layout for AIResource entities
- **Catalog API**: No breaking API changes; AIResource appears through standard entity and search endpoints
- **Documentation**: Adds local PRD and OpenSpec materials to make the workspace self-contained for implementation
