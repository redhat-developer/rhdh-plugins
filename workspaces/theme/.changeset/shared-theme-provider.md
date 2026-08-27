---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Added `createSharedThemeProvider` internal utility that creates a single shared Provider for multiple themes, preventing full application remount when switching themes. All built-in RHDH themes now share one Provider.
