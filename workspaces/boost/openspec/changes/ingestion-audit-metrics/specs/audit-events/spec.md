# Spec: Ingestion Sync Audit Events

> **Status:** 🔀 CONSOLIDATED into RHIDP-15280 (RHDHPLAN-1508)  
> **Story:** RHIDP-15343 (Closed — absorbed by RHIDP-15280)  
> **Coverage:** Audit event emission for sync lifecycle, config changes, RHDH audit log integration, disconnected cluster support  
> **Consolidation (2026-07-08):** Ingestion sync audit events are now delivered under RHIDP-15280 (Emit audit events for entity provider ingestion sync cycles) within RHIDP-15277 (AI Catalog RBAC Audit Logging, RHDHPLAN-1508).

## Scenarios

### Scenario 1: Sync start event emission

**GIVEN** a connector is about to perform a sync operation  
**WHEN** the sync lifecycle begins  
**THEN** an `ingestion.sync.start` audit event is emitted with `connector_name` and `timestamp`  
**AND** the event is written to the RHDH audit log channel  
**AND** the event payload includes `type: 'ingestion.sync.start'`

### Scenario 2: Sync success event with asset counts

**GIVEN** a connector completes a sync operation successfully  
**WHEN** the sync lifecycle ends with success  
**THEN** an `ingestion.sync.success` audit event is emitted with `connector_name`, `timestamp`, `outcome: 'success'`  
**AND** the event payload includes `assets: { added: N, updated: M, removed: K }`  
**AND** the event is written to the RHDH audit log channel  
**AND** asset counts reflect the actual entities added, updated, and removed during the sync

### Scenario 3: Sync failure event with error details

**GIVEN** a connector sync operation fails with an error  
**WHEN** the sync lifecycle ends with failure  
**THEN** an `ingestion.sync.failure` audit event is emitted with `connector_name`, `timestamp`, `outcome: 'failure'`  
**AND** the event payload includes `error: { message: string, code?: string }`  
**AND** the error message contains the failure reason (e.g., 'API timeout', 'Authentication failed')  
**AND** the error code (if available) is included in the event  
**AND** the event is written to the RHDH audit log channel

### Scenario 4: Config change event with actor and before/after values

**GIVEN** an admin changes a connector configuration field via the admin panel  
**WHEN** the configuration change is committed  
**THEN** an `ingestion.config.change` audit event is emitted with `connector_name`, `timestamp`, `actor`  
**AND** the event payload includes `config_change: { field: string, before: string, after: string }`  
**AND** the `actor` field contains the user identifier (username or service account ID)  
**AND** the `before` and `after` values contain the old and new configuration values (serialized as strings)  
**AND** the event is written to the RHDH audit log channel

### Scenario 5: Audit event format consistency with RHIDP-15277

**GIVEN** RBAC audit events (RHIDP-15277) already emit structured JSON events  
**WHEN** an ingestion audit event is emitted  
**THEN** the event follows the same base schema as RBAC audit events  
**AND** the event has top-level fields: `type`, `timestamp`, `metadata`  
**AND** the event is serializable to JSON without loss of information  
**AND** the event schema is compatible with the RHDH audit log ingestion pipeline

### Scenario 6: Audit events in RHDH audit log channel

**GIVEN** RHDH audit log is configured (via platform settings)  
**WHEN** an ingestion audit event is emitted  
**THEN** the event is written to the RHDH audit log channel (same channel as RBAC events)  
**AND** the event is persisted according to RHDH platform retention policies  
**AND** the event is queryable via RHDH audit log UI (if available)  
**AND** the event is exportable via RHDH audit log export API (if available)

### Scenario 7: Audit events in disconnected clusters

**GIVEN** a disconnected cluster where RHDH central is unreachable  
**WHEN** an ingestion audit event is emitted  
**THEN** the event is written to the local audit log file (fallback mechanism)  
**AND** the event is queued for transmission when connectivity is restored (if sync-to-central is enabled)  
**AND** the event is not lost due to network partition  
**AND** the event retains the same schema and content as centrally-logged events
