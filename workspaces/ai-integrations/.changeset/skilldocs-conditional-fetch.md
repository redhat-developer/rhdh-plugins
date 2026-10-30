---
'@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend': patch
---

Use explicit revalidation cache mode for conditional OCI skill documentation reads.
This prevents Node fetch from adding request headers that suppress the connector's
304 response, allowing matching ETags to produce NotModifiedError and reuse cached
TechDocs content. Model-card requests and public APIs are unchanged.
