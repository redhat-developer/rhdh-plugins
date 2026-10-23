---
'@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend': minor
---

Add OCI skill documentation URL reader: read skill source configurations from `catalog.providers.skillsCatalogProvider`, match `/api/<connectorPluginId>/skilldocs/<sourceId>/<digest>` URLs, authenticate via service-to-service tokens, and generate TechDocs-ready MkDocs projects with response ETag caching.
