---
'@red-hat-developer-hub/backstage-plugin-lightspeed': minor
---

Graduate the New Frontend System (NFS) plugin from the `./alpha` export to the primary `./` entry point. Legacy (OFS) component exports are still available from the main path (deprecated, will be removed in a future release) and also accessible at `./legacy`. Translations remain at `./alpha`.

Existing OFS dynamic plugin configurations continue to work without changes — `module: Legacy` is advised but not mandatory.
