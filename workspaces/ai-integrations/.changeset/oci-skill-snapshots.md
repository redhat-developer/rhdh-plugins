---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Add authenticated `GET /skills/:sourceId` returning bounded v1 OCI snapshots,
atomically published at startup and on configurable Backstage scheduled refreshes
(default ten minutes). Preserve the raw `/images` API independently of metadata
normalization. Support stable source IDs, isolated redirect-origin configuration,
and the legacy flat configuration as source `default`. Preserve partial discovery
results and report known failed repository/tag keys without treating incomplete
inventories as complete empty success. Digest-only inputs remain raw-only and do
not alone make normalized snapshots incomplete.
