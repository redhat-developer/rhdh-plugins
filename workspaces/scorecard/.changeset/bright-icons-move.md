---
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Moved scorecard status icon registration from the app's `/legacy` import into the plugin's own `IconBundleBlueprint` extension, so consuming apps no longer need to register scorecard-specific icons manually.
