# Proposal: Connector Configuration Hot-Reload

## Why

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed — its scope has been absorbed by RHIDP-15277 (AI Catalog RBAC Audit Logging) under RHDHPLAN-1508. This hot-reload epic (RHIDP-15332) is unaffected — it remains a surviving RHDHPLAN-1513 epic alongside RHIDP-15331 (Ingestion Health Dashboard) and RHIDP-15334 (Upstream Schema Alignment). Config change audit events (originally RHIDP-15333 scope) are now delivered under RHIDP-15277/RHIDP-15280 — connector config changes should emit audit events using the RHIDP-15277 pattern.

Connectors need configuration changes without pod restart. Toggling a connector on/off, changing sync schedules, or updating endpoint URLs currently requires editing YAML config and redeploying — a multi-minute cycle that blocks quick experimentation and rapid incident response. Enterprise customers need immediate control over ingestion behavior without downtime.

Boost's existing `RuntimeConfigResolver` already solves this for core boost settings: it provides a two-layer config model (YAML baseline + database overrides) with 30-second TTL refresh. This change extends that proven infrastructure to connector settings, enabling hot-reload of connector enable/disable, endpoint URLs, and sync schedules.

The key distinction: Backstage's built-in `ConfigApi` loads config at startup with no hot-reload capability. Boost's `RuntimeConfigResolver` is a **custom layer** that adds DB overrides and TTL-based refresh on top of the YAML baseline. This epic extends that custom layer to connector configuration.

## What Boost Builds

### Config Schemas

- Zod schema definitions for per-connector `boost.connectors.*` fields: `enabled`, `endpoint`, `schedule`, `batchSize`, `timeout` — all `configScope: db-overridable`. Deployment-time fields (`tls`, `credentials`, `namespace`) live under `catalog.providers.*` and are not part of these schemas.
- Runtime operational state (last sync timestamp, run status) lives in the health store (`boost_sync_attempts` table), not the config resolver.
- Schema validation rejects invalid connector config values before write
- Integration with `RuntimeConfigResolver`'s two-layer resolution

### Hot-Reload Propagation

- Runtime overrides propagate to active entity provider instances within 30s TTL
- Connector responds to enable/disable changes on next reconciliation cycle
- Schedule changes take effect on next reconciliation cycle
- Endpoint URL changes take effect on next sync cycle
- K8s Secret mount propagation delays (up to 60s for projected volumes) handled transparently

### Config Admin UI

- Admin UI section for toggling connectors on/off
- Endpoint URL and sync schedule configuration fields
- K8s Secret reference field (display only — Secret names are deployment-time config)
- Changes saved via `AdminConfigService` DB overrides
- Takes effect via `RuntimeConfigResolver` hot-reload pattern
- RBAC gating: admin-only access to connector config

## Impact

- `RuntimeConfigResolver` extension — connector config becomes a new scope under the two-layer model
- Admin panel — new connector config section
- Connector modules — entity providers read config through `RuntimeConfigResolver`, get hot-reload for free
- No changes to Backstage upstream — this is a Boost-specific custom config layer
