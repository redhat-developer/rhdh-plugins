---
'@red-hat-developer-hub/backstage-plugin-lightspeed': major
---

Graduate the New Frontend System (NFS) plugin from the `./alpha` export to the primary `./` entry point. Legacy (OFS) component exports are still available from the main path (deprecated, will be removed in a future release) and also accessible at `./legacy`. Translations remain at `./alpha`.

**BREAKING**: The `LightspeedPlugin` scalprum module has been removed. OFS dynamic plugin configurations must use `module: Legacy` instead.
