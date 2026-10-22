---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': minor
---

Add OCI skill TechDocs URL annotation and reconciliation acknowledgment

Extends the common skills catalog provider to set `backstage.io/techdocs-ref`
on OCI skill entities using discovery-based, digest-addressed URLs derived from
trusted connector/source configuration. npx skill entities do not receive the
annotation. Captures the `X-Skilldocs-Revision` response header from connector
snapshots and implements the D8 reconciliation acknowledgment lifecycle:
atomically persists acknowledgments with ready-state ownership commits, verifies
catalog processing visibility before delivery, retries pending acknowledgments
before polling, handles superseded revisions and transport failures, and rejects
duplicate retention-owner assignments at startup.
