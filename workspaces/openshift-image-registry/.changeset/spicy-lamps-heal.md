---
'@red-hat-developer-hub/backstage-plugin-openshift-image-registry': patch
---

Replaced internal usage of `formatByteSize` with a local implementation using the `filesize` library, matching the original output format.
