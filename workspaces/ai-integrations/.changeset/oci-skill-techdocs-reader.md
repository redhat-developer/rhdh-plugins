---
'@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend': minor
---

Add OCI skill documentation URL reader: read skill source configurations from `catalog.providers.skillsCatalogProvider`, match the exact discovery-resolved connector origin and complete base pathname followed by `/skilldocs/<sourceId>/<digest>`, authenticate via service-to-service tokens, and generate TechDocs-ready MkDocs projects with response ETag caching.

Reject off-origin URLs, malformed route encoding, authenticated redirects, and successful skill-docs responses lacking a nonblank ETag. Preserve discovery deployment prefixes and prevent skill routes from falling through to legacy model-card matching.
