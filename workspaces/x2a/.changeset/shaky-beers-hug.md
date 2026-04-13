---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Removed blockOwnerDeletion: true from the ownerReference in KubeService.ts. This field is unnecessary for our use case - it only controls whether the garbage collector should block deletion of the owner (Job) until the dependent (Secret) is removed first.
