# RHDHPLAN-1513 Potential OpenSpec References

These are historical, potential reuse references for
[RHDHPLAN-1513](https://redhat.atlassian.net/browse/RHDHPLAN-1513), not active
implementation or release contracts.

## Strongest reusable subset

The strongest reusable subset is
`platform-operations-deployment/specs/runtime-config/spec.md`: YAML baseline
plus DB overrides, cache TTL/invalidation, schema validation, configuration
scopes, and schema evolution. Relevant configuration portions of
`platform-operations-deployment/specs/cache-migration/spec.md`,
`platform-operations-deployment/design.md`, and
`platform-operations-deployment/tasks.md` provide supporting background.

## Relationship to current planning

This material supports future reconciliation around
[RHIDP-15332](https://redhat.atlassian.net/browse/RHIDP-15332) (Connector
Config Hot-Reload) and
[RHIDP-15340](https://redhat.atlassian.net/browse/RHIDP-15340), rather than
delivering those issues.

Deployment and packaging concepts provide background for RHDHPLAN-1507 and
RHDHPLAN-1510. Old chat/session caches, RAG pipelines, white-label branding,
agent administration, and Kagenti settings are not promoted into the current
minimum scope.

## Reconciliation requirements

Existing historical assumptions must be reconciled before reuse. In particular,
retaining Kagenti text as historical evidence is not authorization to restore
that integration.

## Current RHDHPLAN-1513 planning

Current 1513 planning remains in the active OpenSpec change areas:

- `workspaces/boost/openspec/changes/connector-config-hot-reload/`
- `workspaces/boost/openspec/changes/ingestion-health-dashboard/`
- `workspaces/boost/openspec/changes/upstream-schema-alignment/`

## Related archive

For the related `RHDHPLAN-1513-potential-code/` archive, see
[#5547](https://github.com/redhat-developer/rhdh-plugins/issues/5547).
