---
'@red-hat-developer-hub/backstage-plugin-quickstart': minor
---

Defer Quickstart NFS drawer content, init snackbar, and help menu item to async chunks so the Module Federation sync graph stays thin. The help menu uses a blueprint `loader` and a local MUI `MenuItem` instead of `global-header/components` to avoid pulling `@backstage/core-components` into the quickstart MF graph.

Bumps `@red-hat-developer-hub/backstage-plugin-global-header` to ^3.0.0 for the loader blueprint API.

Adds public legacy exports `quickstartTranslationRef` and `quickstartTranslations`. Legacy `QuickstartButton` and `QuickstartDrawerProvider` exported types widen from concrete function signatures to `React.ComponentType` because they are now re-exported from lazy component extensions rather than concrete component modules.
