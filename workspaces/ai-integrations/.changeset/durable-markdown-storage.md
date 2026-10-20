---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Add durable OCI skill Markdown retention with bounded storage (50 MiB / 1,000 digests per source), monotonic `X-Skilldocs-Revision` header on completed snapshots, and `POST /skilldocs/:sourceId/reconcile` endpoint for provider-authorized acknowledgment with safe cleanup of unreferenced content. Content is stored in-memory with optional database persistence for restart recovery.
