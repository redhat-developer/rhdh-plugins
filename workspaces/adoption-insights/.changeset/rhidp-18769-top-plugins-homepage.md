---
'@red-hat-developer-hub/backstage-plugin-adoption-insights': minor
---

Add a Top Plugins homepage card for the new frontend system. The card lists org-wide most-used plugins from Adoption Insights over the last 28 days, with rank, display name, plugin id, signed trend, and visit count. Admins set `auto`, `hybrid`, or `curated` mode, row count, title, pinned items, and extra plugin routes through app-config `widgetLayout` props. Users without `adoption-insights.events.read` do not see the card on the homepage or in the Add Widget catalog. Rows link to known in-app destinations and stay plain text when no route is known.
