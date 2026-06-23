---
'@red-hat-developer-hub/backstage-plugin-lightspeed': major
---

Graduate the New Frontend System (NFS) plugin from the `./alpha` export to the primary `./` entry point. OFS (legacy) exports are now available at `./legacy`. Translations remain at `./alpha`.

**BREAKING**: The `LightspeedPlugin` scalprum module has been removed. OFS dynamic plugin configurations must use `module: Legacy` instead.
