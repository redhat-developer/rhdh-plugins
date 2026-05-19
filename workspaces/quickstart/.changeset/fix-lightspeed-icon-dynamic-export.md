---
'@red-hat-developer-hub/backstage-plugin-quickstart': patch
---

Fixed dynamic plugin export failure for the Lightspeed quickstart icon by inlining SVG assets as data URIs instead of file imports that are not emitted into the ESM `dist` output.
