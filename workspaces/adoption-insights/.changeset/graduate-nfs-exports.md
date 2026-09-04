---
'@red-hat-developer-hub/backstage-plugin-adoption-insights': major
'@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights': major
---

**BREAKING:** Graduate NFS plugin exports from `/alpha` to the primary package entry point. OFS exports move to `/legacy`. Translations remain available at `/alpha`.

NFS apps should import plugins from the package root instead of `/alpha`. Legacy OFS apps should import from `/legacy`.
