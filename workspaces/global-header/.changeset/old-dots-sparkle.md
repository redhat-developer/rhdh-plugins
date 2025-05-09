---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**Breaking change**: Use new theme package. Global header items will now use the `theme.rhdh?.general.appBarForegroundColor` colour if defined, and fall back to `theme.palette.text.primary`. This may cause your global header to not look correct in light mode when using the legacy theme.
