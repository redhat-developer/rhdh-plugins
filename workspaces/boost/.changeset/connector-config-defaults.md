---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
---

Add optional `defaultValue` field to `ConfigFieldMeta` and apply it as a third
precedence layer in `RuntimeConfigResolver`: DB override, YAML baseline, field
default, undefined. Connector defaults: `schedule.intervalMs` 300000,
`batchSize` 100, `timeout.connectionMs` 30000 (Jira only). Bumps
`BOOST_CONFIG_SCHEMA_VERSION` from 4 to 5.
