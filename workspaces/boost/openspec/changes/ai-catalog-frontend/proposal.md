# Proposal: AI Catalog Frontend

## Why

Developers need a single place to discover AI agents, skills, MCP servers, AI models, and model servers available in their organization. These assets are already registered in the Backstage Software Catalog via ingestion connectors (RHDHPLAN-1507, 1510–1512), but the generic catalog table view is not optimized for marketplace-style discovery — card layout, category grouping, contextual filtering, and download/copy actions are absent.

The existing catalog entity detail pages provide metadata, TechDocs, and relationships out of the box. Rather than rebuilding detail pages, the frontend extends them with AI-specific cards and tabs using NFS Blueprints.

## What Boost Builds

### AI Catalog Browse Page

A standalone page at `/ai-catalog` with a card grid for discovering AI assets:

- Cards grouped by category (skills, rules, MCP servers, agents, models)
- Search bar with debounced keyword filtering
- Multi-faceted filter controls (category, lifecycle, tags, owner, source connector)
- Pagination, sort, loading/empty/error states
- Card click navigates to the existing catalog entity detail page

### Entity Page Extensions

NFS Blueprint extensions that render on catalog entity pages for AI assets:

- AI Asset Summary Card — category, version, source, lifecycle
- Download/Adopt Card — ZIP download for git assets, docker/podman pull command for OCI assets
- Version List Card — all versions with navigation
- Usage Tab — RBAC-gated usage documentation (TechDocs or external links)

### Dev App Shell

`packages/app` and `packages/backend` for local development and testing, following the adoption-insights/orchestrator pattern.

## Impact

- `plugins/boost/` — new NFS frontend plugin
- `packages/app/` — new dev app shell
- `packages/backend/` — new dev backend
- `boost-backend` — new download proxy route (`GET /api/boost/catalog/download`)
