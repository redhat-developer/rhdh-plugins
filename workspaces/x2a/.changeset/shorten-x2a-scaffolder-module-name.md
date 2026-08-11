---
'@red-hat-developer-hub/backstage-plugin-x2a-scaffolder-module': major
---

Rename package from `@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-x2a` so the flattened dynamic-plugin / catalog name fits Backstage's 63-character `metadata.name` limit (FLPATH-4576).

Consumers must update OCI image / folder refs from `red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-x2a` to `red-hat-developer-hub-backstage-plugin-x2a-scaffolder-module`, and any Extensions `Package` `metadata.name` / `dynamicArtifact` paths accordingly.
