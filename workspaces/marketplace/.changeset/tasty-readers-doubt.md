---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-marketplace': minor
'@red-hat-developer-hub/backstage-plugin-marketplace': minor
'@red-hat-developer-hub/backstage-plugin-marketplace-common': minor
---

Removes separate providers for plugins, packages and collections and introduces unified provider `marketplace-provider`. The provider adds `installStatus` of packages and plugins. Introduces new `installStatus` values: `MarketplacePackageInstallStatus.Disabled` and `MarketplacePluginInstallStatus.Disabled`.
