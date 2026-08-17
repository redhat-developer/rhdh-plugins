---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
---

Add per-connector `__schemaVersion` leaf with `db-only` scope and startup migration infrastructure. Registers `boost.connectors.<id>.__schemaVersion` metadata keys for jira, github, and gitlab connectors. Introduces `BOOST_CONNECTOR_SCHEMA_VERSION`, `CONNECTOR_IDS`, `ConnectorId` type, `ConnectorMigrationFn`, `ConnectorMigrationRegistry`, and `RuntimeConfigResolver.migrateConnectorSchemas()` which runs on plugin startup.
