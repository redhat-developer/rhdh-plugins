---
'@red-hat-developer-hub/backstage-plugin-marketplace-backend': minor
'@red-hat-developer-hub/backstage-plugin-marketplace': minor
---

Integrate plugins-info plugin and add `Installed packages` tab with enhanced UI.

BREAKING: The deprecated `InstallationContextProvider` export behavior changed.

- We now export a null component `InstallationContextProvider` from `plugin.ts` solely for backward compatibility. It no longer provides context and will be removed in a future release.
- Migration: There is no replacement API; this was internal-only. Please upgrade to the latest RHDH where features no longer rely on this provider.

Also:

- New `Installed packages` tab with dual-source mapping and client-side filtering/pagination.
