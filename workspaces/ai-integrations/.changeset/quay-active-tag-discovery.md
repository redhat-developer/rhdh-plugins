---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
'@red-hat-developer-hub/backstage-plugin-ai-skills-common': patch
---

Discover all active tags in public Quay repositories when `quayDiscovery.tag` is
omitted or blank. Set `tag: latest` explicitly to retain the previous default;
other supplied tags remain exact filters. Bound repository and tag pagination
together, and preserve distinct tagged references even when they share a digest.
Update shared contract fixtures and documentation for a separate catalog identity
per valid OCI skill-image tag.
