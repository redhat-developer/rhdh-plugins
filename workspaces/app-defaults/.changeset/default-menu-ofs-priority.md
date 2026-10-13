---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
---

Give built-in default sidebar pages OFS `DefaultMainMenuItems` priorities (Home 100, Catalog 80, APIs 70, Docs 65, Learning Paths 60, Create 50) when no explicit priority is set, so Home sorts above Create. Default-path items stay in the top menu section even with positive priority (chrome remains for logo/search and other non-default positive entries).
