---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Added `createSharedThemeProvider` utility that creates a single shared Provider for multiple themes, preventing full application remount when switching themes. All built-in RHDH themes now share one Provider. Exported `createSharedThemeProvider` and `SharedThemeEntry` for use by custom theme authors.
