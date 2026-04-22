---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Align the navigation sidebar with merged `palette.navigation` and `rhdh.general` colors, including submenu rows and selected/active `BackstageSidebarItem` states. Add `rhdh.general.pageInsetBackgroundColor` so the page inset shell can use its own color (defaults match the previous app bar fill; falls back to `appBarBackgroundColor` when unset). Main content area remains on `mainSectionBackgroundColor`.
