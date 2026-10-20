---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Add authenticated `GET /skilldocs/:sourceId/:digest` endpoint serving extracted OCI skill Markdown with `Content-Type: text/markdown`, digest-derived `ETag`, and `If-None-Match` conditional request support (304). Returns 404 for unknown sources, unknown digests, and unavailable content. Rejects blank and dot/dot-dot source IDs during configuration validation.
