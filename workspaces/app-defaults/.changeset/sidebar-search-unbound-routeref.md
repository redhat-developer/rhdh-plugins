---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
---

Fix sidebar Search crashing with `No path for routeRef{type=absolute,id=search}` when the search routeRef is unbound under module federation. Fall back to a plain `/search` sidebar link when the route is missing.
