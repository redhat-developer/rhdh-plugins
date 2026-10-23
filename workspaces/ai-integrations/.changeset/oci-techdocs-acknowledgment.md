---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': major
---

Add OCI skill TechDocs URL annotation and reconciliation acknowledgment

Extends the common skills catalog provider to set `backstage.io/techdocs-ref`
on OCI skill entities using discovery-based, digest-addressed URLs derived from
trusted connector/source configuration. npx skill entities do not receive the
annotation. Captures the `X-Skilldocs-Revision` response header from connector
snapshots and implements the D8 reconciliation acknowledgment lifecycle:
atomically persists acknowledgments with ready-state ownership commits, verifies
catalog processing visibility before delivery, retries pending acknowledgments
before polling, handles superseded revisions and transport failures, and rejects
duplicate retention-owner assignments at startup.

### Breaking changes

- Four new required methods on `ReconciliationStore`: `commitStateAndSaveAcknowledgment`, `getPendingAcknowledgment`, `getAllPendingAcknowledgments`, and `clearPendingAcknowledgment`.
- The `store` constructor parameter on `SkillsCatalogProvider` is now required (previously optional).
- Direct callers can no longer rely on an implicit in-memory fallback; they must supply and initialize a durable `ReconciliationStore` implementation.
- The `catalogApi` constructor parameter is now required and must implement `CatalogApi.getEntitiesByRefs`; visibility verification cannot be bypassed.

Pending deltas persist the complete acknowledgment context before catalog mutation
and recover it before polling newer snapshots. Deferred visibility checks block
newer polls for that source. Existing entities receive missing or changed TechDocs
annotations even without a digest change. Provider HTTP operations reject redirects
and use bounded deadlines. An additive migration preserves existing rows; legacy
revision-only pending deltas fail closed for operator investigation.
