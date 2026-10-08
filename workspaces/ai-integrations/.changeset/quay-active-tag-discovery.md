---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
'@red-hat-developer-hub/backstage-plugin-ai-skills-common': minor
---

Discover all active tags in public Quay repositories when `quayDiscovery.tag` is
omitted or blank. Set `tag: latest` explicitly to retain the previous default;
other supplied tags remain exact filters. Bound repository and tag pagination
together, and preserve distinct tagged references even when they share a digest.
Update shared contract fixtures and documentation for a separate catalog identity
per valid OCI skill-image tag.

OCI record producers adopting this contract must construct keys as
`<registry>/<repository>:<tag>` instead of `<registry>/<repository>`, preserving
the exact tag case. Consumers with persisted repository-only identities must
plan for replacement catalog identities and update references when adopting
tagged keys. The shared hashing algorithm and validators are unchanged: the same
identity tuple still yields the same catalog name. Upgrading the common library
alone does not rewrite caller-supplied keys or migrate existing entities.
