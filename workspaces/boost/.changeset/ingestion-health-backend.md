---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
'@red-hat-developer-hub/backstage-plugin-boost-common': minor
---

Add ingestion health backend API, data model, and error classification. Introduces `GET /api/boost/ingestion-health` endpoint with per-connector health status derived from recent sync attempts, `SyncAttemptsRepository` for tracking sync outcomes, `ErrorClassifier` for categorizing sync failures, and `ConnectorConfigReader` for config-based connector discovery.
