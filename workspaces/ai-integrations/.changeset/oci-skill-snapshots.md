---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Add authenticated `GET /skills/:sourceId` returning bounded v1 OCI snapshots,
atomically published by standard Backstage scheduled refreshes (default immediate
startup and ten-minute frequency). Honor configured initial delays and manual
trigger mode, enforce local task scope, and replace the unreleased custom refresh
interval option with `schedule` blocks. Preserve the raw `/images` API independently of metadata
normalization. Support stable source IDs, isolated redirect-origin configuration,
and the legacy flat configuration as source `default`. Preserve partial discovery
results and report known failed repository/tag keys without treating incomplete
inventories as complete empty success. Digest-only inputs remain raw-only and do
not alone make normalized snapshots incomplete.
