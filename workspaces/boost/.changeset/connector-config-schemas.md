---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
---

Add connector config Zod schemas and RuntimeConfigResolver support for Jira, GitHub, and GitLab connectors. Registers flat leaf keys in `boostConfigFields` with `db-overridable` scope covering enabled, endpoint, schedule, batchSize, timeout, and cron fields. Bumps `BOOST_CONFIG_SCHEMA_VERSION` to 4.
