---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

fix(theme): use MUI theme overrides for sidebar selected states instead of class name selectors

Replaced `class*=` CSS selectors with proper `styleOverrides.selected` on `BackstageSidebarItem` and `BackstageSidebarSubmenuItem`. The previous `class*=` approach failed in production where JSS minifies class names.
