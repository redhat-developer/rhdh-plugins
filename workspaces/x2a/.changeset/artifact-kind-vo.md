---
'@red-hat-developer-hub/backstage-plugin-x2a-common': patch
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Extract `ArtifactKind` value object to replace raw artifact-type string comparisons, fragile casts, and duplicated Zod enums.
