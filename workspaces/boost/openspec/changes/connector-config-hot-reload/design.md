# Design: Connector Configuration Hot-Reload

## Context

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed and consolidated into RHIDP-15277 (RHDHPLAN-1508). This hot-reload epic is unaffected. Config change audit events (originally RHIDP-15333 scope) are now under RHIDP-15277/RHIDP-15280 — connector config changes should emit `ingestion.config.change` audit events using the RHIDP-15277 structured JSON pattern.

Boost's `RuntimeConfigResolver` provides a two-layer config model: YAML baseline (read-only, deployment-time) + database overrides (mutable, runtime). The resolver caches the merged config with 30-second TTL and immediate invalidation on DB writes. This change extends that proven infrastructure to connector configuration.

Backstage's built-in `ConfigApi` loads YAML at startup with no hot-reload. Boost's `RuntimeConfigResolver` is a **custom layer** built on top of `ConfigApi` that adds:

- Database-backed overrides (via `AdminConfigService`)
- TTL-based refresh (30s cache with immediate invalidation)
- Merged resolution (YAML baseline + DB overrides)

Connector config becomes a new scope under this existing infrastructure.

## Goals

- Extend `RuntimeConfigResolver` to connector settings (runtime sync-skip via `boost.connectors.*.enabled`), not create a new config system. Note: startup registration is governed by `catalog.providers.<connectorId>.enabled` at module init time (shared-infra Decision 4) — a provider never registered at startup cannot be hot-enabled at runtime. Hot-reload controls sync behavior of already-registered providers.

**Config namespace ownership:**

| Namespace                  | Scope                                             | Fields                                                                                                         | Layer            |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------- |
| `catalog.providers.<id>.*` | Shared infrastructure (startup, TLS, credentials) | `enabled` (startup registration), `tls.caFile`, `credentials.secretRef`, `credentials.secretKey`, `namespace`  | YAML-only        |
| `boost.connectors.<id>.*`  | Runtime behavior (hot-reloadable)                 | `enabled` (sync-skip), `endpoint`, `schedule.intervalMs`, `schedule.cron`, `batchSize`, `timeout.connectionMs` | `db-overridable` |

- Hot-reload enable/disable, endpoint URL, and schedule changes within 30s
- Preserve deployment-time config (TLS mount paths, K8s Secret references) as YAML-only
- Admin UI for connector config with RBAC gating
- Handle K8s Secret mount propagation delays (up to 60s for projected volumes)

## Non-Goals

- Creating a new config system — reuse `RuntimeConfigResolver`
- Replacing Backstage's `ConfigApi` — extend it with a custom layer
- Hot-reloading YAML files — YAML is the baseline layer, only DB overrides are hot-reloadable
- Hot-reloading TLS certificates or mount paths — these are deployment-time config
- Event-driven propagation — polling-based via existing reconciliation cycles is sufficient

## Decisions

### Decision 1: Extend RuntimeConfigResolver, don't create new config system

Connector config extends Boost's existing `RuntimeConfigResolver` two-layer model (YAML baseline + DB overrides + 30s TTL). Connectors read config through the resolver, get hot-reload for free.

This reuses proven infrastructure (tested in production for core boost settings) instead of building a parallel config system. The resolver already handles:

- Two-layer merging (YAML baseline + DB overrides)
- Cache invalidation (30s TTL + immediate invalidation on write)
- Schema validation (Zod schemas reject invalid values)

**Implementation pattern:**

```typescript
// Connector entity provider reads leaf keys via RuntimeConfigResolver
const enabled = await runtimeConfigResolver.resolve(
  'boost.connectors.jira.enabled',
);
if (!enabled) {
  this.logger.info('Jira connector disabled via runtime config, skipping sync');
  return;
}

const endpoint =
  (await runtimeConfigResolver.resolve('boost.connectors.jira.endpoint')) ||
  this.config.getString('catalog.providers.jira.endpoint');
await this.syncClient.connect(endpoint);
```

**Why not a separate system:** Creating a new config layer would duplicate cache invalidation, TTL logic, DB schema, admin API, and frontend UI patterns — all of which `RuntimeConfigResolver` already provides.

### Decision 2: configScope annotation strategy

Each `boost.connectors.<id>.*` field is `configScope: db-overridable` — these are the runtime-tunable fields. Deployment-time fields (`tls.caFile`, `credentials.*`, `namespace`) live under `catalog.providers.<id>.*` and are not part of this schema (see Goals namespace table above).

| Field                  | configScope      | Rationale                                          |
| ---------------------- | ---------------- | -------------------------------------------------- |
| `enabled`              | `db-overridable` | Admin can toggle without YAML change               |
| `endpoint`             | `db-overridable` | Admin can switch environments without deployment   |
| `schedule.intervalMs`  | `db-overridable` | Admin can tune sync frequency at runtime           |
| `schedule.cron`        | `db-overridable` | Admin can change cron schedule at runtime          |
| `batchSize`            | `db-overridable` | Admin can tune performance at runtime              |
| `timeout.connectionMs` | `db-overridable` | Admin can adjust for network conditions at runtime |

**Runtime state lives in the health store, not the config resolver:** Fields like `lastSyncTimestamp`, `lastSyncOutcome`, and `runStatus` are pure runtime state owned by the `boost_sync_attempts` table (see ingestion-health-dashboard Decision 1). They are not config — they are operational state written by providers after each sync. Querying them goes through the health API (`GET /api/boost/ingestion-health`), not `RuntimeConfigResolver`.

**Why all fields are db-overridable:** The `boost.connectors` schema only contains runtime-tunable fields by design. Deployment-time fields (mount paths, Secret references, namespace) belong to `catalog.providers` — they can't change at runtime without a pod restart, so they are excluded from this schema entirely rather than marked `yaml-only`.

### Decision 3: Propagation mechanism — polling-based via reconciliation cycles

Entity providers receive config changes on next reconciliation cycle. Provider's scheduled task reads config from `RuntimeConfigResolver` at each cycle start. No event/callback needed — polling-based via existing schedule.

**Why polling, not events:** Connectors already run on scheduled reconciliation cycles (e.g., every 5 minutes for Jira). Reading config at cycle start is zero marginal cost — the provider is already waking up. Event-driven propagation would add complexity (event bus, handler registration, failure recovery) for no latency benefit (30s TTL + schedule interval ≤ 5m30s, which is acceptable for config changes).

**Propagation sequence:**

1. Admin saves DB override via admin UI (e.g., disables Jira connector)
2. `AdminConfigService` writes to DB, invalidates cache
3. Next reconciliation cycle (within schedule interval, e.g., ≤5m)
4. Provider reads config via `RuntimeConfigResolver`
5. Resolver cache miss (invalidated), fetches fresh YAML + DB overrides
6. Provider sees `enabled: false`, skips sync

**Worst-case latency:** Cache TTL (30s) + reconciliation interval (e.g., 5m) = 5m30s. For critical changes (incident response), admin can reduce the connector's schedule interval temporarily via DB override.

### Decision 4: Credential rotation handling

K8s Secret mount propagation can take up to 60s for projected volumes (kubelet sync period). Provider re-reads mounted file each reconciliation cycle. Effective credential rotation = mount propagation delay (≤60s) + reconciliation interval (up to 5m) = ~6 minutes worst case.

**Why not watch Secret mounts:** Filesystem watching (inotify) adds complexity and failure modes (missed events, watcher exhaustion). Reading the mounted Secret file at each reconciliation cycle is simpler and sufficient for credential rotation use cases.

**Credential rotation sequence:**

1. Admin updates K8s Secret content (e.g., new API token)
2. Kubelet syncs projected volume (up to 60s delay)
3. Next reconciliation cycle (within schedule interval)
4. Provider reads mounted Secret file
5. Provider uses new credentials for sync

**Why not immediate propagation:** Credentials are long-lived secrets (API tokens, certificates). ~6 minute rotation latency is acceptable. Immediate propagation would require filesystem watchers or polling loops, adding complexity for minimal benefit.

### Decision 5: Admin UI writes DB overrides via AdminConfigService

Admin UI writes connector config changes via `AdminConfigService` — same pattern as existing boost admin settings. Zod schema validates before write. Frontend uses existing admin API patterns.

**Why not a separate connector config API:** Reusing `AdminConfigService` maintains consistency with other runtime-overridable settings (AI provider config, feature flags, etc.). The admin panel already has RBAC gating, audit logging, and validation patterns.

**UI flow:**

1. Admin opens connector config section
2. Form fields pre-populated with current merged config (YAML baseline + DB overrides)
3. Admin toggles `enabled` or changes `endpoint`
4. Frontend calls `POST /api/boost/admin/config` with flat `BoostConfigKey` — e.g., `{ key: "boost.connectors.jira.enabled", value: false }`. Each write targets a single leaf key; no nested objects, no ambiguity about deep-merge vs replace.
5. Backend validates via Zod schema, writes DB override, calls `RuntimeConfigResolver.invalidate()` (whole-cache invalidation)
6. Frontend shows immediate visual feedback ("Saved — will take effect within 30s + next reconciliation cycle")

**YAML-only fields (read-only in UI):** TLS mount paths, Secret references shown as read-only info. Tooltip: "Deployment-time config. Edit YAML to change."

**Why immediate visual feedback:** Admin sees "Saved" immediately, understands propagation delay. Prevents confusion about "did my change take effect?"

## Risks

- **K8s Secret mount propagation delays:** Mitigated by documenting ~6 minute worst-case credential rotation latency (60s kubelet sync + 5m reconciliation interval). For emergency credential rotation, admin can manually restart connector pod.
- **Config schema versioning:** Mitigated by Zod schema versioning. Breaking changes require migration logic in `RuntimeConfigResolver`.
- **Partial config state during cache refresh:** Mitigated by atomic cache updates. Resolver fetches full merged config (YAML + DB) before updating cache entry.
