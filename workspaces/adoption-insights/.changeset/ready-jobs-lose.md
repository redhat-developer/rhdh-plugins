---
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': patch
---

Stop forwarding the caller's raw Authorization header when resolving TechDocs titles; mint a plugin-to-plugin token on behalf of the calling user, and reject unsafe entity path segments.
