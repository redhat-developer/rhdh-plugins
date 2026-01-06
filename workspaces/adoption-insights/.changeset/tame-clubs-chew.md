---
'@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights': patch
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': patch
---

Mark the app-config `app.analytics.adoptionInsights` option as optional. It was already read with getOptional<Number/Boolean> so there is no code change or configuration change needed, this just reflect the status quo better.
