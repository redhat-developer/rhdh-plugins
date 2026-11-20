---
'@red-hat-developer-hub/backstage-plugin-adoption-insights': minor
---

Add a Top Plugins homepage card and shared Popular Content primitives (auto/hybrid/curated modes, display-count and title config, Adoption Insights fetch helpers, empty/error/permission-denied states, and `HomePageWidgetBlueprint` registration). The widget is gated with the same `adoption-insights.events.read` NFS `if` predicate as the Adoption Insights page, so users without that permission do not see the card on the homepage or in the Add Widget catalog. List rows support rank, 16px icons, display name, plugin id subtitle, signed trend %, and visit counts, with an InfoCard shell so dark-mode surfaces match other NFS homepage widgets. Built-in plugin destinations are overridable via `pluginDestinations`, and in-app links use the Backstage router so clicks do not reload the whole app.
