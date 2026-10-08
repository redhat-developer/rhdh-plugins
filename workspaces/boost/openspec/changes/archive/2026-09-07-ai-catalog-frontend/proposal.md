# Proposal: AI Catalog Frontend

## Why

Developers need a single place to discover AI assets already in the Software
Catalog. The generic catalog table is not a marketplace browse view.

The Catalog entity page already provides About, TechDocs, and relationships.
This plugin adds AI-specific cards and one Usage tab; it does not replace those
Catalog surfaces and does not add a Boost backend.

## What Changes

- Browse page at `/ai-catalog` with cards/table, search, NFS filters, pagination
- Entity cards: Summary, Adoption, Version
- Usage tab (`entity-content:boost/usage`) on AI assets
- Dev app shell; overlay registration for the frontend (and OGX) images

## What Boost Builds

### AI Catalog Browse Page

A standalone page at `/ai-catalog`:

- Card grid or table of AI assets
- Search bar with debounced keyword filtering
- Type, provider, owner, and tag filters (AND logic, NFS-extensible)
- Pagination, sort, loading/empty/error states
- Card click navigates to the existing catalog entity detail page

### Entity Page Extensions

- Summary Card — extra AI fields on the entity overview
- Adoption Card — copy/open actions in the browser
- Version Card — current `rhdh.io/ai-asset-version` only
- Usage Tab — Boost tab; may link to TechDocs. Catalog TechDocs stays a Catalog tab.

### Dev App Shell

`packages/app` and `packages/backend` for local development.

## Impact

- `plugins/boost/` — NFS frontend plugin
- `packages/app/` — dev app shell
- `packages/backend/` — dev backend
