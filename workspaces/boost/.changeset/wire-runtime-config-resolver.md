---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
---

Wire ConnectorConfigReader runtimeEnabled to RuntimeConfigResolver so that admin panel toggles for connector runtime sync take effect within the 30-second cache TTL. listCandidates() is now async and ConnectorConfigReaderOptions requires a resolver.
