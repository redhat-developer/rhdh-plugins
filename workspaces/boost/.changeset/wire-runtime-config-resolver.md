---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
---

BREAKING: Wire ConnectorConfigReader runtimeEnabled to RuntimeConfigResolver so that admin panel toggles for connector runtime sync take effect within the 30-second cache TTL. listCandidates() is now async — callers must `await reader.listCandidates()`. ConnectorConfigReaderOptions now requires a `resolver` (RuntimeConfigResolver).
